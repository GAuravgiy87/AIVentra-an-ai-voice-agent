import numpy as np
import asyncio
from livekit.agents import tts, utils, APIConnectOptions
from livekit.agents.types import DEFAULT_API_CONNECT_OPTIONS
from piper import PiperVoice

import scipy.signal

class PiperTTSWrapper(tts.TTS):
    """LiveKit TTS plugin that wraps Piper TTS.
    model_path should be the path to a .onnx voice model file.
    """
    def __init__(self, model_path: str):
        self.engine = PiperVoice.load(model_path)
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1,
        )

    def synthesize(
        self, text: str, *, conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS
    ) -> tts.ChunkedStream:
        return PiperChunkedStream(tts=self, input_text=text, conn_options=conn_options)


class PiperChunkedStream(tts.ChunkedStream):
    def __init__(self, *, tts: PiperTTSWrapper, input_text: str, conn_options: APIConnectOptions) -> None:
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._tts = tts

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        def _do_synth():
            chunks = list(self._tts.engine.synthesize(self._input_text))
            if not chunks:
                return b""
            # Concatenate all float arrays
            audio = np.concatenate([c.audio_float_array for c in chunks])
            
            # Fast, real-time linear interpolation resampling (22050Hz -> 24000Hz)
            # This is 100x faster than FFT resample, eliminating audio dropouts
            src_len = len(audio)
            target_len = int(src_len * 24000 / 22050)
            src_indices = np.arange(src_len)
            dst_indices = np.linspace(0, src_len - 1, target_len)
            audio24k = np.interp(dst_indices, src_indices, audio)
            
            resampled_int16 = (audio24k * 32767).astype(np.int16).tobytes()
            return resampled_int16

        audio_bytes = await asyncio.to_thread(_do_synth)
        
        output_emitter.initialize(
            request_id=utils.shortuuid(),
            sample_rate=24000,
            num_channels=1,
            mime_type="audio/pcm",
        )
        if audio_bytes:
            output_emitter.push(audio_bytes)


class BilingualPiperTTS(tts.TTS):
    """TTS that dynamically routes text to either English or Hindi engines based on character detection."""
    def __init__(self, en_model_path: str, hi_model_path: str):
        self.en_engine = PiperVoice.load(en_model_path)
        self.hi_engine = PiperVoice.load(hi_model_path)
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1,
        )

    def synthesize(
        self, text: str, *, conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS
    ) -> tts.ChunkedStream:
        has_hindi = any('\u0900' <= char <= '\u097f' for char in text)
        engine = self.hi_engine if has_hindi else self.en_engine
        return BilingualPiperChunkedStream(tts=self, engine=engine, input_text=text, conn_options=conn_options)


class BilingualPiperChunkedStream(tts.ChunkedStream):
    def __init__(self, *, tts: BilingualPiperTTS, engine: PiperVoice, input_text: str, conn_options: APIConnectOptions) -> None:
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._engine = engine

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        def _do_synth():
            chunks = list(self._engine.synthesize(self._input_text))
            if not chunks:
                return b""
            audio = np.concatenate([c.audio_float_array for c in chunks])
            
            src_len = len(audio)
            target_len = int(src_len * 24000 / 22050)
            src_indices = np.arange(src_len)
            dst_indices = np.linspace(0, src_len - 1, target_len)
            audio24k = np.interp(dst_indices, src_indices, audio)
            
            resampled_int16 = (audio24k * 32767).astype(np.int16).tobytes()
            return resampled_int16

        audio_bytes = await asyncio.to_thread(_do_synth)
        
        output_emitter.initialize(
            request_id=utils.shortuuid(),
            sample_rate=24000,
            num_channels=1,
            mime_type="audio/pcm",
        )
        if audio_bytes:
            output_emitter.push(audio_bytes)

