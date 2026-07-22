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
from edge_tts_wrapper import EdgeTTSWrapper
from livekit.agents.llm import ChatContext
from google.genai import types
import livekit.plugins.silero as silero
try:
    from livekit.plugins.openai import LLM as OpenAILLM
except ImportError:
    OpenAILLM = None
import json
import redis
from agent import get_db

# Global Redis client
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
except Exception:
    redis_client = None

def publish_event(event_type, data):
    if redis_client:
        try:
            payload = {"event": event_type}
            payload.update(data)
            redis_client.publish('ventra_call_events', json.dumps(payload))
        except Exception:
            pass
import logging
from dotenv import load_dotenv

load_dotenv()
from typing import Optional, Dict, List
import aiohttp

print("Loading AI Models into memory (this will take a few seconds)...")
stt_model = WhisperSTT(model_name="small")
vad_model = silero.VAD.load()
print("Models loaded successfully!")

import agent

def _report_sync(room_id: str, role: str, content: str, latency_ms: Optional[int], extension: Optional[str], company_id: Optional[int]):
    try:
        agent.add_report_message(
            room_id=room_id,
            role=role,
            content=content,
            latency_ms=latency_ms,
            extension=extension,
            company_id=company_id
        )
    except Exception as e:
        logging.warning(f"Failed to write report to database: {e}")

async def report_to_dashboard_async(room_id: str, role: str, content: str, latency_ms: int = None, extension: str = None, company_id: int = None):
    try:
        await asyncio.to_thread(_report_sync, room_id, role, content, latency_ms, extension, company_id)
    except Exception as e:
        logging.warning(f"Failed in report_to_dashboard_async: {e}")

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

class CallTransferTool:
    def __init__(self, caller_number: str, range_start: int, range_end: int):
        self.caller_number = caller_number
        self.range_start = range_start
        self.range_end = range_end

    @agents.function_tool(description="Transfer the call to another agent or extension number.")
    async def transfer_call(
        self,
        extension: str
    ) -> str:
        logging.info(f"[Call Transfer]: Requested transfer of caller {self.caller_number} to extension {extension}")
        publish_event("call_transferred", {"caller": self.caller_number, "target": extension})
        try:
            try:
                ext_int = int(extension)
                if not (self.range_start <= ext_int <= self.range_end):
                    return f"Failed to transfer call: Extension {extension} is outside the allowed range of {self.range_start} to {self.range_end} for this company."
            except ValueError:
                return f"Failed to transfer call: Extension {extension} is not a valid number."
            
            import subprocess
            import asyncio
            import os
            
            def run_local_asterisk():
                docker_cmd = ["wsl", "docker"] if os.name == 'nt' else ["docker"]
                cmd = docker_cmd + ["exec", "voiceagent-asterisk-1", "asterisk", "-rx", "core show channels concise"]
                result = subprocess.run(cmd, capture_output=True, text=True)
                channels = result.stdout.strip().split("\n")
                
                target_channel = None
                for line in channels:
                    parts = line.split("!")
                    if len(parts) > 0:
                        channel_name = parts[0]
                        if channel_name.startswith(f"PJSIP/{self.caller_number}-"):
                            target_channel = channel_name
                            break
                
                if not target_channel:
                    for line in channels:
                        parts = line.split("!")
                        if len(parts) > 0:
                            channel_name = parts[0]
                            if "livekit" in channel_name or "livekit-sip" in line:
                                if channel_name.startswith("PJSIP/") and "livekit" not in channel_name:
                                    target_channel = channel_name
                                    break
                
                if target_channel:
                    logging.info(f"[Call Transfer]: Found channel {target_channel}. Redirecting to {extension}...")
                    redirect_cmd = docker_cmd + ["exec", "voiceagent-asterisk-1", "asterisk", "-rx", f"channel redirect {target_channel} default,{extension},1"]
                    subprocess.run(redirect_cmd, check=True)
                    return f"Successfully transferring your call to extension {extension}. Please hold."
                else:
                    return "Could not find your active call channel to transfer."
                    
            return await asyncio.to_thread(run_local_asterisk)
        except Exception as e:
            logging.error(f"Error transferring call: {e}")
            return f"Failed to transfer call: {e}"

async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()
    
    # Use global pre-loaded models for instant pickup!
    stt = stt_model
    vad = vad_model

    # Initialize basic call metadata
    dialed_number = None
    caller_number = None
    room_name = ctx.room.name

    
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

    import psycopg2
    from psycopg2.extras import DictCursor

    def _fetch_routing_sync():
        res = {
            "authorized": True,
            "reject_reason": "",
            "user_model": "gemini",
            "user_model_name": "gemini-3.1-flash-lite",
            "user_name": "Vantara AI",
            "company_name": "D E I Lab",
            "agent_name": "AI Assistant",
            "agent_prompt": "",
            "agent_voice": "en-US-AriaNeural",
            "range_start": 100,
            "range_end": 200,
            "company_id": None
        }
        
        if not dialed_number:
            return res
            
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # 1. Check if dialed_number matches a company's AI extension
            cursor.execute("""
                SELECT id, name, range_start, range_end, ai_model, ai_model_name, agent_name, agent_prompt, agent_voice,
                       who_starts, greeting_msg, responsiveness, interruption_sensitivity, allow_interruptions,
                       enable_backchanneling, backchannel_words, speech_speed, speech_volume, vad_threshold,
                       min_endpointing_delay, max_endpointing_delay
                FROM companies WHERE ai_extension = %s
            """, (dialed_number,))
            company_row = cursor.fetchone()
            
            if company_row:
                (company_id, company_name, range_start, range_end, user_model, user_model_name, 
                 agent_name_val, agent_prompt_val, agent_voice_val, who_starts_val, greeting_msg_val,
                 responsiveness_val, interruption_sens_val, allow_interrupt_val, backchannel_val,
                 backchannel_words_val, speech_speed_val, speech_volume_val, vad_threshold_val,
                 min_end_val, max_end_val) = company_row
                
                res["company_id"] = company_id
                res["user_name"] = company_name
                res["company_name"] = company_name
                res["range_start"] = range_start
                res["range_end"] = range_end
                res["user_model"] = user_model
                res["user_model_name"] = user_model_name
                if agent_name_val:
                    res["agent_name"] = agent_name_val
                if agent_prompt_val:
                    res["agent_prompt"] = agent_prompt_val
                if agent_voice_val:
                    res["agent_voice"] = agent_voice_val
                
                res["who_starts"] = who_starts_val or "AI speaks first"
                res["greeting_msg"] = greeting_msg_val or "Hello, welcome! How can I help you?"
                res["allow_interruptions"] = allow_interrupt_val if allow_interrupt_val is not None else True
                res["min_endpointing_delay"] = min_end_val if min_end_val is not None else 0.5
                res["max_endpointing_delay"] = max_end_val if max_end_val is not None else 1.0
                res["speech_speed"] = speech_speed_val if speech_speed_val is not None else 1.0
                res["speech_volume"] = speech_volume_val if speech_volume_val is not None else 1.0
                
                # Verify caller extension falls in range
                if caller_number and caller_number.isdigit():
                    caller_int = int(caller_number)
                    if range_start is not None and range_end is not None:
                        if not (range_start <= caller_int <= range_end):
                            res["authorized"] = False
                            res["reject_reason"] = f"Extension {caller_int} is outside allowed range {range_start}-{range_end}"
                    else:
                        cursor.execute("SELECT id FROM devices WHERE extension = %s AND company_id = %s", (caller_number, company_id))
                        if not cursor.fetchone():
                            res["authorized"] = False
                            res["reject_reason"] = f"Extension {caller_number} is not configured."
                else:
                    res["authorized"] = False
                    res["reject_reason"] = f"Invalid caller extension: {caller_number}"
            else:
                # 2. Check if dialed_number matches a user's AI extension
                cursor.execute("SELECT id, name, ai_model, ai_model_name, company_id FROM users WHERE ai_extension = %s", (dialed_number,))
                user_row = cursor.fetchone()
                
                if user_row:
                    user_id, user_name, user_model, user_model_name, user_company_id = user_row
                    res["company_id"] = user_company_id
                    res["user_name"] = user_name
                    res["user_model"] = user_model
                    res["user_model_name"] = user_model_name
                    
                    if user_company_id:
                        cursor.execute("SELECT name, range_start, range_end, agent_name, agent_prompt, agent_voice FROM companies WHERE id = %s", (user_company_id,))
                        comp_data = cursor.fetchone()
                        if comp_data:
                            company_name, range_start, range_end, agent_name_val, agent_prompt_val, agent_voice_val = comp_data
                            res["company_name"] = company_name
                            res["range_start"] = range_start
                            res["range_end"] = range_end
                            if agent_name_val:
                                res["agent_name"] = agent_name_val
                            if agent_prompt_val:
                                res["agent_prompt"] = agent_prompt_val
                            if agent_voice_val:
                                res["agent_voice"] = agent_voice_val
                    
                    cursor.execute("SELECT COUNT(*) FROM devices WHERE user_id = %s AND extension = %s", (user_id, caller_number))
                    device_count = cursor.fetchone()[0]
                    if device_count == 0 and dialed_number.strip('+') != "200":
                        res["authorized"] = False
                        res["reject_reason"] = f"Access denied. Device {caller_number} is not authorized for AI Line {dialed_number}."
                else:
                    if dialed_number.strip('+') == "200":
                        res["authorized"] = True
                        res["user_name"] = "Vantara AI"
                        cursor.execute("SELECT MIN(CAST(extension AS INTEGER)), MAX(CAST(extension AS INTEGER)) FROM devices")
                        min_max = cursor.fetchone()
                        if min_max and min_max[0] is not None:
                            res["range_start"] = min_max[0]
                            res["range_end"] = min_max[1]
                    else:
                        res["authorized"] = False
                        res["reject_reason"] = f"Extension {dialed_number} is not configured."
            conn.close()
        except Exception as e:
            logging.warning(f"Failed to query routing DB: {e}")
            
        return res

    # Run the synchronous DB block in a separate thread so it doesn't freeze the async event loop!
    route_data = await asyncio.to_thread(_fetch_routing_sync)
    
    authorized = route_data["authorized"]
    reject_reason = route_data["reject_reason"]
    user_model = route_data["user_model"]
    user_model_name = route_data["user_model_name"]
    user_name = route_data["user_name"]
    company_name = route_data["company_name"]
    agent_name = route_data["agent_name"]
    agent_prompt = route_data["agent_prompt"]
    agent_voice = route_data["agent_voice"]
    range_start = route_data["range_start"]
    range_end = route_data["range_end"]
    company_id = route_data["company_id"]
    
    who_starts_opt = route_data.get("who_starts", "AI speaks first")
    greeting_msg_opt = route_data.get("greeting_msg")
    responsiveness_opt = route_data.get("responsiveness", 0.5)
    interruption_sens_opt = route_data.get("interruption_sensitivity", 0.9)
    allow_interrupt_opt = route_data.get("allow_interruptions", True)
    min_end_opt = route_data.get("min_endpointing_delay", 0.5)
    max_end_opt = route_data.get("max_endpointing_delay", 1.0)
    
    speech_speed_val = route_data.get("speech_speed", 1.0)
    speech_vol_val = route_data.get("speech_volume", 1.0)
    rate_str = f"{int((speech_speed_val - 1.0) * 100):+d}%"
    vol_str = f"{int((speech_vol_val - 1.0) * 100):+d}%"
    
    # Initialize dynamic TTS based on database voice, rate, and volume
    tts = EdgeTTSWrapper(voice=agent_voice, rate=rate_str, volume=vol_str)

    publish_event("incoming_call", {
        "caller": caller_number,
        "dialed": dialed_number,
        "room": room_name
    })

    # Configure the appropriate LLM
    if not authorized:
        # Load default LLM for error playback
        llm = CustomGoogleLLM(
            model="gemini-3.1-flash-lite",
            http_options=types.HttpOptions(timeout=20000)
        )
    elif user_model.lower() == "ollama":
        print(f"Routing call on line {dialed_number} to Ollama local model: {user_model_name}")
        if OpenAILLM is None:
            raise RuntimeError("livekit-plugins-openai is not installed")
        llm = OpenAILLM(
            model=user_model_name,
            base_url="http://10.7.32.220:11434/v1",
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
    
    fcontext = CallTransferTool(caller_number or "100", range_start=range_start, range_end=range_end)
    tools = agents.llm.find_function_tools(fcontext)
    
    base_instructions = f"You are {agent_name}, a highly capable multi-lingual conversational voice agent for {company_name}. "
    if agent_prompt:
        base_instructions += f"\nCRITICAL COMPANY DIRECTIVE: {agent_prompt}\n\n"
        
    allow_interrupt_opt = routing_info.get("allow_interruptions", True)
    min_end_opt = routing_info.get("min_endpointing_delay", 0.5)
    max_end_opt = routing_info.get("max_endpointing_delay", 1.0)
    who_starts_opt = routing_info.get("who_starts", "AI speaks first")
    greeting_msg_opt = routing_info.get("greeting_msg")

    agent = agents.voice.Agent(
        instructions=(
            base_instructions +
            "CRITICAL LANGUAGE RULE: You MUST speak in the exact language the user is speaking to you in. If the user speaks Hindi, reply entirely in Hindi. If the user asks you to speak in Hindi, reply entirely in Hindi. DO NOT use English words when speaking Hindi. "
            "Answer phone calls concisely, professionally, and extremely briefly. "
            "CRITICAL: Keep your answers extremely short and concise, exactly like a real phone call (e.g. 1-2 sentences maximum). "
            "Answer ONLY what the user asks. No extra information, long paragraphs, or formatting. "
            f"Do NOT introduce yourself, say your name, or state who you are in your responses "
            f"unless the user explicitly asks for your name or who created you. If they ask who you are, say exactly: 'Hello, I am {agent_name}, AI agent of {company_name}. How can I help you?' "
            "Keep all other standard answers completely free of introductions. "
            "CRITICAL: You must respond in the same language the user speaks to you. If the user speaks in Hindi, you must respond strictly in Hindi using Devanagari script (e.g. नमस्ते). If the user speaks in English, you must respond strictly in English (Latin script). Never mix scripts in a single sentence. "
            "CRITICAL: If the user asks you to transfer, connect, or forward their call to a human agent, extension, or department (e.g. '100', '101', 'agent'), you MUST call the 'transfer_call' function."
        ),
        tools=tools,
        allow_interruptions=allow_interrupt_opt,
        min_endpointing_delay=min_end_opt,
        max_endpointing_delay=max_end_opt,
    )
    
    await session.start(agent=agent, room=ctx.room, room_input_options=agents.RoomInputOptions(close_on_disconnect=False))
    agent.report_room_start(room_name, company_id)
    logging.info(f"[Call Pickup]: Agent session started for room {ctx.room.name}.")
    
    publish_event("agent_pickup", {
        "caller": caller_number,
        "dialed": dialed_number,
        "room": room_name
    })

    if not authorized:
        publish_event("call_rejected", {
            "caller": caller_number,
            "reason": reject_reason
        })
        logging.info(f"[REJECTING SIP CALL]: {reject_reason}")
        try:
            # Play greeting warning and leave
            warning_text = "प्रवेश निषेध। आप इस लाइन पर कॉल करने के लिए अधिकृत नहीं हैं।"
            if "not configured" in reject_reason:
                warning_text = "आपके द्वारा डायल किया गया एक्सटेंशन कॉन्फ़िगर नहीं है।"
            handle = session.say(warning_text, allow_interruptions=False)
            await handle.wait_for_playout()
        except Exception as e:
            logging.warning(f"Error speaking reject warning: {e}")
        agent.report_room_end(room_name)
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
            publish_event("user_speaking", {"caller": caller_number})

    @session.on("agent_state_changed")
    def on_agent_state_changed(event):
        if getattr(event, "new_state", "") == "speaking":
            publish_event("agent_speaking", {"caller": caller_number})

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        logging.info(f"Participant disconnected: {participant.identity}")
        agent.report_room_end(room_name)
        publish_event("call_ended", {"caller": caller_number})

    # ─── DTMF Keypad State Machine ───
    dtmf_mode = "IDLE"  # "IDLE" or "AWAITING_EXTENSION"
    dtmf_buffer = ""
    dtmf_timer_task = None
    transfer_in_progress = False

    expected_ext_len = 3
    if range_start:
        expected_ext_len = len(str(range_start))

    async def execute_dtmf_transfer(target_ext: str):
        nonlocal transfer_in_progress, dtmf_mode, dtmf_buffer
        if transfer_in_progress:
            return
        transfer_in_progress = True
        dtmf_mode = "IDLE"
        dtmf_buffer = ""
        
        ext_clean = target_ext.strip()
        logging.info(f"[DTMF Transfer Triggered]: Caller {caller_number} requested keypad transfer to {ext_clean}")
        
        # Check authorization
        valid_ext = False
        if range_start is not None and range_end is not None:
            if ext_clean.isdigit() and range_start <= int(ext_clean) <= range_end:
                valid_ext = True
        else:
            valid_ext = True
            
        if not valid_ext:
            session.say(f"Sorry, extension {ext_clean} is not valid or outside allowed range.", allow_interruptions=True)
            transfer_in_progress = False
            return

        session.say(f"Forwarding your call to extension {ext_clean}, please hold...", allow_interruptions=False)
        await asyncio.sleep(2.0)
        
        try:
            success = await fcontext.transfer_call(ext_clean)
            if not success:
                session.say("Transfer failed. Returning to assistant.", allow_interruptions=True)
                transfer_in_progress = False
        except Exception as err:
            logging.error(f"DTMF transfer exception: {err}")
            transfer_in_progress = False

    async def dtmf_timeout_job():
        nonlocal dtmf_mode, dtmf_buffer
        await asyncio.sleep(3.5)
        if dtmf_buffer:
            buf = dtmf_buffer
            dtmf_buffer = ""
            asyncio.create_task(execute_dtmf_transfer(buf))
        else:
            dtmf_mode = "IDLE"

    @ctx.room.on("sip_dtmf_received")
    def on_sip_dtmf_received(dtmf_event):
        nonlocal dtmf_mode, dtmf_buffer, dtmf_timer_task, last_human_speech_time
        digit = getattr(dtmf_event, "digit", "")
        if not digit:
            digit = getattr(dtmf_event, "digits", "")
        
        if transfer_in_progress:
            return
            
        digit = str(digit).strip()
        if not digit:
            return
            
        logging.info(f"[DTMF Keypad Input]: Digit '{digit}' received from caller {caller_number}")
        last_human_speech_time = asyncio.get_event_loop().time()
        
        if dtmf_timer_task and not dtmf_timer_task.done():
            dtmf_timer_task.cancel()

        if digit == "#":
            if dtmf_buffer:
                buf = dtmf_buffer
                dtmf_buffer = ""
                asyncio.create_task(execute_dtmf_transfer(buf))
            return

        if dtmf_mode == "IDLE":
            if digit == "1":
                dtmf_mode = "AWAITING_EXTENSION"
                dtmf_buffer = ""
                session.say("You requested call forwarding. Please type the extension number you want to forward to.", allow_interruptions=True)
                dtmf_timer_task = asyncio.create_task(dtmf_timeout_job())
                return
            else:
                dtmf_mode = "AWAITING_EXTENSION"
                dtmf_buffer = digit
                if len(dtmf_buffer) >= expected_ext_len:
                    buf = dtmf_buffer
                    dtmf_buffer = ""
                    asyncio.create_task(execute_dtmf_transfer(buf))
                    return
                dtmf_timer_task = asyncio.create_task(dtmf_timeout_job())
                return

        elif dtmf_mode == "AWAITING_EXTENSION":
            dtmf_buffer += digit
            if len(dtmf_buffer) >= expected_ext_len:
                buf = dtmf_buffer
                dtmf_buffer = ""
                asyncio.create_task(execute_dtmf_transfer(buf))
                return
            dtmf_timer_task = asyncio.create_task(dtmf_timeout_job())

    @ctx.room.on("dtmf_received")
    def on_dtmf_received(dtmf_event):
        d = getattr(dtmf_event, "digit", None) or getattr(dtmf_event, "code", None) or getattr(dtmf_event, "key", None)
        if d is not None:
            # Reusing sip logic
            on_sip_dtmf_received(dtmf_event)

    @session.on("history_updated")
    def on_history_updated():
        if session.history._items:
            item = session.history._items[-1]
            if hasattr(item, "role") and item.role in ("assistant", "user"):
                text = item.text_content
                if text and text.strip():
                    if text.strip() == greeting_text.strip():
                        return
                    role_label = agent_name if item.role == "assistant" else "User"
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

                    caller_extension = None
                    for p in ctx.room.remote_participants.values():
                        caller_extension = p.attributes.get("sip.phoneNumber") or p.attributes.get("sip.from")
                        if caller_extension: break
                    
                    publish_event("transcript", {
                        "role": role_label,
                        "text": text.strip(),
                        "caller": caller_extension or caller_number
                    })

                    asyncio.create_task(report_to_dashboard_async(ctx.room.name, item.role, text.strip(), latency_ms, caller_extension or dialed_number, company_id))

    # Greet user if who_starts_opt is "AI speaks first"
    greeting_text = greeting_msg_opt if (greeting_msg_opt and greeting_msg_opt.strip()) else f"Hello, welcome to {company_name}! I am {agent_name}. How can I help you today?"
    
    if who_starts_opt == "AI speaks first":
        logging.info(f"[{agent_name} Greeting]: {greeting_text}")
        asyncio.create_task(report_to_dashboard_async(ctx.room.name, "assistant", greeting_text, None, dialed_number or caller_number, company_id))
        greeting_handle = session.say(greeting_text, allow_interruptions=False)
        await greeting_handle.wait_for_playout()
    else:
        logging.info(f"[{agent_name} Ready]: Listening (User speaks first mode).")

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
                    session.say("Hello, are you still there?", allow_interruptions=True)
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


    print("\n[OK] AI Voice Agent is successfully connected and ready to receive calls on extension 200!\n")

    # Run the LiveKit Agent Worker
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            job_executor_type=agents.JobExecutorType.THREAD,
        )
    )
