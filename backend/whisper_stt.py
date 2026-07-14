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
        mono16k = librosa.resample(mono, orig_sr=frame.sample_rate, target_sr=16000)
        # Run transcription
        lang_str = language if isinstance(language, str) else None
        result = self._whisper_model.transcribe(mono16k, language=lang_str)
        
        text = result.get("text", "")
        lang_code = language if isinstance(language, str) else "en"
        speech_data = SpeechData(language=lang_code, text=text, confidence=1.0)
        return SpeechEvent(type=SpeechEventType.FINAL_TRANSCRIPT, alternatives=[speech_data])
