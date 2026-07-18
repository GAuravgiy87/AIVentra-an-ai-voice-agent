import numpy as np
import whisper
import librosa
from livekit.agents.stt import STT, SpeechEvent, SpeechData, SpeechEventType, STTCapabilities
from livekit.agents.utils import AudioBuffer
from livekit.agents.types import NOT_GIVEN, NotGivenOr, APIConnectOptions
from livekit import rtc

class WhisperSTT(STT):
    """LiveKit STT plugin that wraps OpenAI Whisper.
    model_name can be one of 'tiny', 'base', 'small', 'medium', 'large'.
    """
    def __init__(self, model_name: str = "base"):
        self._whisper_model = whisper.load_model(model_name)
        self._model_name = model_name
        super().__init__(
            capabilities=STTCapabilities(
                streaming=False,
                interim_results=False,
            )
        )

    @property
    def model(self) -> str:
        return self._model_name

    async def _recognize_impl(
        self,
        buffer: AudioBuffer,
        *,
        language: NotGivenOr[str] = NOT_GIVEN,
        conn_options: APIConnectOptions,
    ) -> SpeechEvent:
        # LiveKit provides PCM int16 frames.
        frame = rtc.combine_audio_frames(buffer)
        pcm_bytes = frame.data.tobytes()
        pcm = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        
        if frame.num_channels > 1:
            pcm = pcm.reshape(-1, frame.num_channels)
            mono = np.mean(pcm, axis=1)
        else:
            mono = pcm
            
        # Resample to 16 kHz as required by Whisper
        if frame.sample_rate == 16000:
            mono16k = mono
        else:
            src_len = len(mono)
            target_len = int(src_len * 16000 / frame.sample_rate)
            src_indices = np.arange(src_len)
            dst_indices = np.linspace(0, src_len - 1, target_len)
            mono16k = np.interp(dst_indices, src_indices, mono)
        
        mono16k = mono16k.astype(np.float32)
        # Run transcription (None allows Whisper to dynamically auto-detect English or Hindi)
        lang_str = language if isinstance(language, str) else None
        result = self._whisper_model.transcribe(mono16k, language=lang_str, fp16=False)
        
        text = result.get("text", "").strip()
        
        # --- Noise & Whisper Hallucination Filter ---
        # Whisper often hallucinates these phrases when it hears pure silence or background static.
        # By dropping them, we prevent the LLM from being called unnecessarily, saving API limits!
        noise_phrases = [
            "thank you", "thank you.", "thank you for watching", "thank you for watching.", 
            "thanks for watching", "thanks for watching.", "you.", "you", "subscribe", 
            "subtitles by", "amara.org", "bye.", "bye", "thank you very much.", "thanks.", "thanks"
        ]
        
        clean_text = text.lower().strip()
        if clean_text in noise_phrases or len(clean_text.replace(".", "").strip()) <= 1:
            text = "" # Discard the noise by returning an empty transcript
        # --------------------------------------------
        
        lang_code = language if isinstance(language, str) else "en"
        speech_data = SpeechData(language=lang_code, text=text, confidence=1.0)
        return SpeechEvent(type=SpeechEventType.FINAL_TRANSCRIPT, alternatives=[speech_data])
