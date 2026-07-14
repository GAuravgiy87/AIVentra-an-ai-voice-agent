import os
import wave
import json
from livekit.agents.stt import STT, SpeechEvent, SpeechData, SpeechEventType, STTCapabilities
from livekit.agents.utils import AudioBuffer
from livekit.agents.types import NOT_GIVEN, NotGivenOr, APIConnectOptions
from livekit import rtc
from vosk import Model, KaldiRecognizer

class VoskSTT(STT):
    """LiveKit STT plugin that uses Vosk for offline speech‑to‑text.
    It expects the Vosk model directory `vosk-model-small-en-us-0.15`
    to be present in the backend folder (downloaded by `download_models.py`).
    """
    def __init__(self, model_path: str = "vosk-model-small-en-us-0.15"):
        if not os.path.isdir(model_path):
            raise FileNotFoundError(f"Vosk model directory not found: {model_path}")
        self._vosk_model = Model(model_path)
        self._model_name = model_path
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
        # Convert to 16kHz mono WAV bytes for Vosk.
        frame = rtc.combine_audio_frames(buffer)
        pcm = frame.data.tobytes()
        # Write temporary WAV file.
        tmp_path = "temp.wav"
        with wave.open(tmp_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(16000)
            import numpy as np, librosa
            audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
            if frame.num_channels > 1:
                audio = audio.reshape(-1, frame.num_channels)
                mono = np.mean(audio, axis=1)
            else:
                mono = audio
            mono16k = librosa.resample(mono, orig_sr=frame.sample_rate, target_sr=16000)
            wav_bytes = (mono16k * 32767).astype(np.int16).tobytes()
            wf.writeframes(wav_bytes)
        rec = KaldiRecognizer(self._vosk_model, 16000)
        with open(tmp_path, "rb") as f:
            while True:
                data = f.read(4000)
                if not data:
                    break
                rec.AcceptWaveform(data)
        result = json.loads(rec.FinalResult())
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        
        text = result.get("text", "")
        lang_code = language if isinstance(language, str) else "en"
        speech_data = SpeechData(language=lang_code, text=text, confidence=1.0)
        return SpeechEvent(type=SpeechEventType.FINAL_TRANSCRIPT, alternatives=[speech_data])
