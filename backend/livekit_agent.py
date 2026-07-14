import asyncio
import os
from livekit import agents, rtc
from livekit.plugins import google
from vosk_stt import VoskSTT
from piper_tts import PiperTTSWrapper
import livekit.plugins.silero as silero
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)

async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()
    
    # Initialize the Gemini model for STT, LLM, and TTS
    # Note: Using Google plugins may require Google Cloud Credentials
    stt = await asyncio.to_thread(VoskSTT)
    # LLM stays the same (Gemini)
    llm = google.LLM(model="gemini-3.5-flash")
    # Piper TTS – set path to your downloaded voice model
    tts = await asyncio.to_thread(PiperTTSWrapper, model_path="D:/voiceagent/backend/piper/en_US-amy-medium.onnx")
    vad = await asyncio.to_thread(silero.VAD.load)
    
    session = agents.voice.AgentSession(
        stt=stt,
        llm=llm,
        tts=tts,
        vad=vad,
    )
    
    agent = agents.voice.Agent(
        instructions="You are Ventra, a voice agent for D E I Lab. Answer phone calls concisely and professionally."
    )
    
    await session.start(agent=agent, room=ctx.room)
    
    last_human_speech_time = asyncio.get_event_loop().time()
    has_warned = False

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
                role_label = "Ventra" if item.role == "assistant" else "User"
                print(f"\n[{role_label}]: {text.strip()}", flush=True)

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
                    logging.info("Human has been silent for 2 minutes. Prompting warning.")
                    await session.say("Hey, are you there?", allow_interruptions=True)
            else:
                if elapsed >= 60:  # 1 minute after warning
                    logging.info("Human has been silent for 1 minute after warning. Hanging up.")
                    ctx.shutdown("human silent for 3 minutes")
                    break

    asyncio.create_task(monitor_silence())
    
    # Greet the user immediately when they connect to the room via SIP
    # A short sleep (0.1s) is kept to let WebRTC media connection establish, preventing the first word from clipping.
    await asyncio.sleep(0.1)
    await session.say("Hello, welcome to D E I Lab! I am Ventra. How can I help you?", allow_interruptions=True)

if __name__ == "__main__":
    import livekit.plugins.silero as silero
    # Run the LiveKit Agent Worker
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=lambda proc: {"vad": silero.VAD.load()}
        )
    )
