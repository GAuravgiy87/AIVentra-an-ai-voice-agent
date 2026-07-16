import os
os.environ["LIVEKIT_LOG_LEVEL"] = "info"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import torch
torch.set_num_threads(1)

import asyncio
from livekit import agents, rtc
from livekit.plugins import google
from whisper_stt import WhisperSTT
from piper_tts import PiperTTSWrapper
from livekit.agents.llm import ChatContext
from google.genai import types
import livekit.plugins.silero as silero
import logging
from dotenv import load_dotenv

load_dotenv()
import aiohttp

print("Loading AI Models into memory (this will take a few seconds)...")
stt_model = WhisperSTT(model_name="tiny")
tts_model = PiperTTSWrapper(model_path="D:/voiceagent/backend/piper/en_US-amy-medium.onnx")
vad_model = silero.VAD.load()
print("Models loaded successfully!")

async def report_to_dashboard_async(room_id: str, role: str, content: str, latency_ms: int = None):
    try:
        async with aiohttp.ClientSession() as session_http:
            payload = {
                "room_id": room_id,
                "role": role,
                "content": content,
                "latency_ms": latency_ms
            }
            async with session_http.post("http://localhost:8001/api/admin/report_message", json=payload) as response:
                await response.read()
    except Exception as e:
        logging.warning(f"Failed to report message to dashboard: {e}")

class FallbackLLMStream:
    def __init__(self, inner_stream, chat_ctx):
        self._inner = inner_stream
        self._chat_ctx = chat_ctx
        self._fallback_sent = False

    @property
    def chat_ctx(self):
        return self._inner.chat_ctx

    @property
    def tools(self):
        return self._inner.tools

    async def aclose(self):
        await self._inner.aclose()

    async def collect(self):
        return await self._inner.collect()

    def to_str_iterable(self):
        return self._inner.to_str_iterable()

    def __aiter__(self):
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.aclose()

    async def __anext__(self):
        try:
            return await self._inner.__anext__()
        except StopAsyncIteration:
            raise
        except Exception as e:
            logging.exception("Exception occurred in Gemini LLM stream:")
            if not self._fallback_sent:
                self._fallback_sent = True
                user_msg = ""
                for msg in reversed(self._chat_ctx._items):
                    if hasattr(msg, "role") and msg.role == "user":
                        user_msg = msg.text_content or ""
                        break
                fallback_text = f"Thank you for asking '{user_msg}', but I can't respond right now."
                from livekit.agents.llm import ChatChunk, ChoiceDelta
                chunk = ChatChunk(
                    id="fallback_" + agents.utils.shortuuid(),
                    delta=ChoiceDelta(
                        role="assistant",
                        content=fallback_text
                    )
                )
                return chunk
            raise StopAsyncIteration

class CustomGoogleLLM(google.LLM):
    def chat(self, *, chat_ctx, **kwargs):
        inner_stream = super().chat(chat_ctx=chat_ctx, **kwargs)
        return FallbackLLMStream(inner_stream, chat_ctx)

async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()
    
    # Use global pre-loaded models for instant pickup!
    stt = stt_model
    tts = tts_model
    vad = vad_model

    # LLM stays the same (Gemini) - with custom timeout and custom fallback handling
    llm = CustomGoogleLLM(
        model="gemini-3.1-flash-lite",
        http_options=types.HttpOptions(timeout=20000)
    )
    

    
    session = agents.voice.AgentSession(
        stt=stt,
        llm=llm,
        tts=tts,
        vad=vad,
        allow_interruptions=True,
        discard_audio_if_uninterruptible=True,
    )
    
    agent = agents.voice.Agent(
        instructions=(
            "You are Vantara AI, a conversational voice agent developed by Gaurav Chauhan. "
            "Answer phone calls concisely, professionally, and extremely briefly. "
            "CRITICAL: Keep your answers extremely short and concise, exactly like a real phone call (e.g. 1-2 sentences maximum). "
            "Answer ONLY what the user asks. No extra information, long paragraphs, or formatting. "
            "Do NOT introduce yourself, say your name, or state that you are developed by Gaurav Chauhan in your responses "
            "unless the user explicitly asks for your name or who created you. Keep standard answers completely free of introductions."
        ),
        allow_interruptions=True,
    )
    
    await session.start(agent=agent, room=ctx.room)
    
    last_human_speech_time = asyncio.get_event_loop().time()
    has_warned = False
    is_greeting_playing = True
    greeting_handle = None

    @session.on("user_state_changed")
    def on_user_state_changed(event):
        nonlocal last_human_speech_time, has_warned
        if getattr(event, "new_state", "") == "speaking":
            last_human_speech_time = asyncio.get_event_loop().time()
            has_warned = False

    @session.on("conversation_item_added")
    def on_conversation_item_added(event):
        item = event.item
        if hasattr(item, "role") and item.role in ("assistant", "user"):
            text = item.text_content
            if text and text.strip():
                role_label = "Vantara" if item.role == "assistant" else "User"
                # Report to dashboard & track tokens
                latency_ms = None
                token_usage_str = ""
                if item.role == "assistant" and hasattr(item, "metrics") and item.metrics and hasattr(item.metrics, "llm") and item.metrics.llm:
                    if item.metrics.llm.duration > 0:
                        latency_ms = int(item.metrics.llm.duration * 1000)
                    
                    if hasattr(item.metrics.llm, "usage") and item.metrics.llm.usage:
                        try:
                            prompt_tok = item.metrics.llm.usage.prompt_tokens
                            comp_tok = item.metrics.llm.usage.completion_tokens
                            token_usage_str = f"\n   -> [Gemini Token Usage: {prompt_tok} Prompt | {comp_tok} Completion]"
                        except Exception:
                            pass
                
                print(f"\n[{role_label}]: {text.strip()}{token_usage_str}", flush=True)

                asyncio.create_task(report_to_dashboard_async(ctx.room.name, item.role, text.strip(), latency_ms))

    async def monitor_silence():
        nonlocal last_human_speech_time
        while True:
            await asyncio.sleep(1)
            now = asyncio.get_event_loop().time()
            elapsed = now - last_human_speech_time
            
            if elapsed >= 120:  # 2 minutes of silence
                last_human_speech_time = now  # Reset silence timer
                logging.info("Human has been silent for 2 minutes. Prompting warning.")
                # Direct TTS (no AI generated response)
                session.say("Hey, are you still there?", allow_interruptions=True)

    asyncio.create_task(monitor_silence())

    # Greet the user immediately when they connect to the room via SIP
    # Removed short sleep to prevent initial greeting clipping and delay.
    # await asyncio.sleep(0.1)
    greeting_text = "Hello, welcome to D E I Lab! I am Ventra. How can I help you?"
    greeting_handle = session.say(greeting_text, allow_interruptions=False)
    await greeting_handle.wait_for_playout()
    
    # Greeting playout finished, start tracking user queries and silence monitor
    is_greeting_playing = False
    
    # Keep only the system message if present, otherwise clear all user messages transcribed during greeting
    if session.history._items and hasattr(session.history._items[0], "role") and session.history._items[0].role == "system":
        session.history._items[:] = [session.history._items[0]]
    else:
        session.history._items.clear()
        
    last_human_speech_time = asyncio.get_event_loop().time()

if __name__ == "__main__":
    import livekit.plugins.silero as silero
    from livekit.agents import cli
    
    # Override LiveKit's default startup logging
    def custom_setup_logging(*args, **kwargs):
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        for h in root_logger.handlers[:]:
            root_logger.removeHandler(h)
            
        file_h = logging.FileHandler("agent.log", mode='a')
        file_h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
        file_h.setLevel(logging.INFO)
        
        console_h = logging.StreamHandler()
        console_h.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))
        console_h.setLevel(logging.INFO)
        
        root_logger.addHandler(file_h)
        root_logger.addHandler(console_h)
        
    cli.log.setup_logging = custom_setup_logging
    # CRITICAL: cli.py does `from .log import setup_logging`, so we MUST patch the reference inside `cli.cli` too!
    import livekit.agents.cli.cli
    livekit.agents.cli.cli.setup_logging = custom_setup_logging


    print("\n[OK] Ventra AI is successfully connected and ready to receive calls on extension 200!\n")

    # Run the LiveKit Agent Worker
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            job_executor_type=agents.JobExecutorType.THREAD,
        )
    )
