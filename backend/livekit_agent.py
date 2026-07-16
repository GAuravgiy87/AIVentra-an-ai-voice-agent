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

async def report_to_dashboard_async(room_id: str, role: str, content: str, latency_ms: int = None, extension: str = None):
    try:
        async with aiohttp.ClientSession() as session_http:
            payload = {
                "room_id": room_id,
                "role": role,
                "content": content,
                "latency_ms": latency_ms,
                "extension": extension
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

    import json
    dialed_number = None
    caller_number = None
    
    # Helper to retrieve value from dict using multiple potential key variations
    def get_val(data, keys):
        if not data:
            return None
        for k in keys:
            if k in data and data[k]:
                return str(data[k])
        return None

    to_keys = ["to", "sip.to", "sip.trunkPhoneNumber", "trunkPhoneNumber"]
    from_keys = ["from", "sip.from", "sip.phoneNumber", "phoneNumber"]

    # 1. Try to read from Room Metadata (instant)
    if ctx.room.metadata:
        try:
            meta = json.loads(ctx.room.metadata)
            sip_info = meta.get("sip", {})
            dialed_number = get_val(sip_info, to_keys) or get_val(meta, to_keys)
            caller_number = get_val(sip_info, from_keys) or get_val(meta, from_keys)
        except Exception:
            pass

    # 2. Try to read from Job Metadata (instant)
    if not dialed_number and ctx.job.metadata:
        try:
            meta = json.loads(ctx.job.metadata)
            sip_info = meta.get("sip", {})
            dialed_number = get_val(sip_info, to_keys) or get_val(meta, to_keys)
            caller_number = get_val(sip_info, from_keys) or get_val(meta, from_keys)
        except Exception as e:
            logging.warning(f"Failed to parse job metadata: {e}")

    # 3. Fallback to remote participants (wait maximum 0.2 seconds only if it's a SIP call to prevent deadlocks)
    if not dialed_number and ctx.room.name.startswith("sip-call-"):
        for _ in range(3):
            for p in ctx.room.remote_participants.values():
                print(f"DEBUG: Remote Participant ID={p.identity}, attributes={p.attributes}", flush=True)
                dialed_number = get_val(p.attributes, to_keys)
                caller_number = get_val(p.attributes, from_keys)
                if not caller_number:
                    caller_number = p.identity
                break
            if dialed_number:
                break
            await asyncio.sleep(0.1)

    import sqlite3
    authorized = True
    reject_reason = ""
    user_model = "gemini"
    user_model_name = "gemini-3.1-flash-lite"
    user_name = "Vantara AI"

    if dialed_number:
        try:
            conn = sqlite3.connect("calls.db")
            cursor = conn.cursor()
            
            # Find the user who owns this AI extension
            cursor.execute("SELECT id, name, ai_model, ai_model_name FROM users WHERE ai_extension = ?", (dialed_number,))
            user_row = cursor.fetchone()
            
            if user_row:
                user_id, user_name, user_model, user_model_name = user_row[0], user_row[1], user_row[2], user_row[3]
                if not user_model_name:
                    user_model_name = "llama3" if user_model == "ollama" else "gemini-3.1-flash-lite"
                
                # Check if the caller phone extension belongs to this user
                cursor.execute("SELECT COUNT(*) FROM devices WHERE user_id = ? AND extension = ?", (user_id, caller_number))
                device_count = cursor.fetchone()[0]
                
                if device_count == 0 and dialed_number.strip('+') != "200":
                    authorized = False
                    reject_reason = f"Access denied. Device {caller_number} is not authorized for AI Line {dialed_number}."
            else:
                # Default configuration checks for system extension 200
                if dialed_number.strip('+') != "200":
                    authorized = False
                    reject_reason = f"Extension {dialed_number} is not configured."
            
            conn.close()
        except Exception as e:
            logging.warning(f"Failed to query routing DB: {e}")

    # Configure the appropriate LLM
    if not authorized:
        # Load default LLM for error playback
        llm = CustomGoogleLLM(
            model="gemini-3.1-flash-lite",
            http_options=types.HttpOptions(timeout=20000)
        )
    elif user_model.lower() == "ollama":
        from livekit.plugins.openai import LLM as OpenAILLM
        print(f"Routing call on line {dialed_number} to Ollama local model: {user_model_name}")
        llm = OpenAILLM(
            model=user_model_name,
            base_url="http://localhost:11434/v1",
            api_key="ollama"
        )
    else:
        print(f"Routing call on line {dialed_number} to Gemini model: {user_model_name}")
        llm = CustomGoogleLLM(
            model=user_model_name,
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
            f"You are {user_name}, a conversational voice agent. "
            "Answer phone calls concisely, professionally, and extremely briefly. "
            "CRITICAL: Keep your answers extremely short and concise, exactly like a real phone call (e.g. 1-2 sentences maximum). "
            "Answer ONLY what the user asks. No extra information, long paragraphs, or formatting. "
            "Do NOT introduce yourself, say your name, or state who you are in your responses "
            "unless the user explicitly asks for your name or who created you. Keep standard answers completely free of introductions."
        ),
        allow_interruptions=True,
    )
    
    await session.start(agent=agent, room=ctx.room, room_input_options=agents.RoomInputOptions(close_on_disconnect=False))
    logging.info(f"[Call Pickup]: Agent session started for room {ctx.room.name}.")

    if not authorized:
        logging.info(f"[REJECTING SIP CALL]: {reject_reason}")
        try:
            # Play greeting warning and leave
            warning_text = "Access denied. You are not authorized to call this line."
            if "not configured" in reject_reason:
                warning_text = "The extension you dialed is not configured."
            handle = session.say(warning_text, allow_interruptions=False)
            await handle.wait_for_playout()
        except Exception as e:
            logging.warning(f"Error speaking reject warning: {e}")
        await ctx.room.disconnect()
        return
    
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
            logging.info(f"[User state]: {event.new_state}")

    @session.on("conversation_item_added")
    def on_conversation_item_added(event):
        nonlocal last_human_speech_time, has_warned
        if is_greeting_playing:
            return
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
                
                logging.info(f"[{role_label}]: {text.strip()}{token_usage_str}")

                # Extract caller extension (non-agent participant) to attribute calls to devices
                caller_extension = None
                for p in ctx.room.remote_participants.values():
                    caller_extension = p.attributes.get("sip.from")
                    if not caller_extension:
                        caller_extension = p.identity
                    break

                asyncio.create_task(report_to_dashboard_async(ctx.room.name, item.role, text.strip(), latency_ms, caller_extension))

    # Greet the user immediately when they connect to the room via SIP
    # Removed short sleep to prevent initial greeting clipping and delay.
    # await asyncio.sleep(0.1)
    greeting_text = "Hello, welcome to D E I Lab! I am Ventra. How can I help you?"
    logging.info(f"[Ventra Greeting]: {greeting_text}")
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

    async def monitor_silence():
        nonlocal last_human_speech_time, has_warned
        while True:
            await asyncio.sleep(1)
            now = asyncio.get_event_loop().time()
            elapsed = now - last_human_speech_time
            
            if not has_warned:
                if elapsed >= 120:  # 2 minutes of silence
                    has_warned = True
                    last_human_speech_time = now
                    logging.info("[Silence Warning]: Asking user if they are still there...")
                    session.say("Hey, are you still there?", allow_interruptions=True)
            else:
                if elapsed >= 60:  # 1 minute after warning
                    logging.info("[Silence Timeout]: Human silent for 3 minutes. Hanging up call.")
                    await ctx.room.disconnect()
                    break

    asyncio.create_task(monitor_silence())

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
