from google import genai
from google.genai import types
from typing import Dict, List
import time
import os

# Configure Gemini with the provided API Key from environment variables
from dotenv import load_dotenv
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")
client = genai.Client(api_key=api_key)

DEFAULT_MODEL = "gemini-3.5-flash"

SYSTEM_PROMPT = """You are Ventra, a voice agent for D E I Lab. 
Your first message should always be exactly: ", Hello, welcome to D E I Lab! I am Ventra. How can I help you today?"
CRITICAL: Keep your answers extremely short and concise, exactly like a real phone call. 
If the user introduces themselves by name, you MUST politely address them by their name (e.g., "Hello Gaurav"). 
Answer ONLY what the user asks. No extra information or long paragraphs. Keep it conversational but very fast.
Do not use markdown formatting like asterisks or bold text, just plain text that is easy to speak out loud.
"""

# Store Gemini ChatSession objects per room
# { room_id: ChatSession }
rooms_sessions: Dict[str, object] = {}
# Store raw history for frontend UI
# { room_id: [{"role": "system"/"user"/"assistant", "content": "...", "latency_ms": Optional[int]}] }
rooms_history: Dict[str, List[Dict]] = {}
# { room_id: timestamp_float }
rooms_last_active: Dict[str, float] = {}

def get_all_rooms():
    return rooms_history

def get_admin_metrics():
    total_chats = len(rooms_history)
    live_chats = 0
    total_latency = 0
    latency_count = 0
    
    current_time = time.time()
    
    # Calculate live chats (active in last 5 minutes)
    for room_id, last_active in rooms_last_active.items():
        if current_time - last_active <= 300: # 5 minutes
            live_chats += 1
            
    # Calculate average latency
    for room_id, history in rooms_history.items():
        for msg in history:
            if "latency_ms" in msg:
                total_latency += msg["latency_ms"]
                latency_count += 1
                
    avg_latency = int(total_latency / latency_count) if latency_count > 0 else 0
    
    return {
        "total_chats": total_chats,
        "live_chats": live_chats,
        "avg_latency_ms": avg_latency,
        "rooms": rooms_history
    }

def create_room(room_id: str):
    if room_id not in rooms_sessions:
        config = types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
        # Start a new chat session for this room
        chat = client.chats.create(model=DEFAULT_MODEL, config=config)
        rooms_sessions[room_id] = chat
        rooms_history[room_id] = [{"role": "system", "content": SYSTEM_PROMPT}]

def get_room_history(room_id: str) -> List[Dict[str, str]]:
    return rooms_history.get(room_id, [])

def chat_with_agent(room_id: str, user_message: str, model: str = DEFAULT_MODEL) -> str:
    # Ensure room exists
    create_room(room_id)
    
    # Add user message to history
    rooms_history[room_id].append({"role": "user", "content": user_message})
    rooms_last_active[room_id] = time.time()
    
    chat_session = rooms_sessions[room_id]
    
    start_time = time.time()
    try:
        response = chat_session.send_message(user_message)
        reply_content = response.text
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Add assistant reply to history
        rooms_history[room_id].append({
            "role": "assistant", 
            "content": reply_content,
            "latency_ms": latency_ms
        })
        rooms_last_active[room_id] = time.time()
        
        return reply_content
    except Exception as e:
        error_msg = f"Sorry, I am having trouble connecting to Gemini. Error: {e}"
        # Do not append error to history to allow retry
        return error_msg
