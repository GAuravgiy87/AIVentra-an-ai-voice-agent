import numpy as np
import librosa
import asyncio
from livekit.agents import tts, utils
from livekit.agents.types import DEFAULT_API_CONNECT_OPTIONS
from piper import PiperVoice

class PiperTTSWrapper(tts.TTS):
    """LiveKit TTS plugin that wraps Piper TTS.
    model_path should be the path to a .onnx voice model file.
    """
    def __init__(self, model_path: str):
        self.engine = PiperVoice.load(model_path)
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=48000,
            num_channels=1,
        )

    def synthesize(
        self, text: str, *, conn_options: tts.APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS
    ) -> tts.ChunkedStream:
        return PiperChunkedStream(tts=self, input_text=text, conn_options=conn_options)


class PiperChunkedStream(tts.ChunkedStream):
    def __init__(self, *, tts: PiperTTSWrapper, input_text: str, conn_options: tts.APIConnectOptions) -> None:
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._tts = tts

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        def _do_synth():
            chunks = list(self._tts.engine.synthesize(self._input_text))
            if not chunks:
                return b""
            # Concatenate all float arrays
            audio = np.concatenate([c.audio_float_array for c in chunks])
            # Resample to 48 kHz for LiveKit
            audio48k = librosa.resample(audio, orig_sr=22050, target_sr=48000)
            resampled_int16 = (audio48k * 32767).astype(np.int16).tobytes()
            return resampled_int16

        audio_bytes = await asyncio.to_thread(_do_synth)
        
        output_emitter.initialize(
            request_id=utils.shortuuid(),
            sample_rate=48000,
            num_channels=1,
            mime_type="audio/pcm",
        )
        if audio_bytes:
            output_emitter.push(audio_bytes)
