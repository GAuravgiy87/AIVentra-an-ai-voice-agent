import asyncio
from livekit.agents import tts, utils, APIConnectOptions
from livekit.agents.types import DEFAULT_API_CONNECT_OPTIONS
import edge_tts
import io
from pydub import AudioSegment

class EdgeTTSWrapper(tts.TTS):
    """LiveKit TTS plugin that wraps the free Azure Edge-TTS."""
    def __init__(self, voice: str = "en-US-AriaNeural", rate: str = "+0%", volume: str = "+0%"):
        self.voice = voice
        self.rate = rate
        self.volume = volume
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1,
        )

    def synthesize(
        self, text: str, *, conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS
    ) -> tts.ChunkedStream:
        return EdgeChunkedStream(tts=self, input_text=text, conn_options=conn_options)


class EdgeChunkedStream(tts.ChunkedStream):
    def __init__(self, *, tts: EdgeTTSWrapper, input_text: str, conn_options: APIConnectOptions) -> None:
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._tts = tts

    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        try:
            # edge-tts generates mp3 bytes.
            communicate = edge_tts.Communicate(self._input_text, self._tts.voice, rate=self._tts.rate, volume=self._tts.volume)
            
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            if not audio_data:
                return
            
            # Decode MP3 to raw PCM (24000Hz, 1 channel, 16-bit) using pydub
            def _decode():
                try:
                    audio = AudioSegment.from_file(io.BytesIO(audio_data), format="mp3")
                    audio = audio.set_frame_rate(24000).set_channels(1).set_sample_width(2)
                    return audio.raw_data
                except Exception as e:
                    print(f"[EdgeTTS] Error decoding MP3: {e}")
                    return b""
            
            pcm_bytes = await asyncio.to_thread(_decode)
            
            output_emitter.initialize(
                request_id=utils.shortuuid(),
                sample_rate=24000,
                num_channels=1,
                mime_type="audio/pcm",
            )
            if pcm_bytes:
                output_emitter.push(pcm_bytes)
                
        except Exception as e:
            print(f"[EdgeTTS] Synthesis failed: {e}")
