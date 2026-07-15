from google import genai
from google.genai import types
from typing import Dict, List, Optional
import time
import os
import sqlite3

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

# Store Gemini ChatSession objects per room (Must remain in-memory as they are live objects)
# { room_id: ChatSession }
rooms_sessions: Dict[str, object] = {}

DB_PATH = "calls.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            room_id TEXT PRIMARY KEY,
            last_active REAL,
            created_at REAL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT,
            role TEXT,
            content TEXT,
            latency_ms INTEGER,
            timestamp REAL,
            FOREIGN KEY(room_id) REFERENCES rooms(room_id)
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

def _update_room_active(room_id: str, timestamp: float):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT OR IGNORE INTO rooms (room_id, created_at, last_active) VALUES (?, ?, ?)', 
                  (room_id, timestamp, timestamp))
    cursor.execute('UPDATE rooms SET last_active = ? WHERE room_id = ?', (timestamp, room_id))
    conn.commit()
    conn.close()

def add_report_message(room_id: str, role: str, content: str, latency_ms: Optional[int] = None):
    current_time = time.time()
    _update_room_active(room_id, current_time)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (room_id, role, content, latency_ms, timestamp)
        VALUES (?, ?, ?, ?, ?)
    ''', (room_id, role, content, latency_ms, current_time))
    conn.commit()
    conn.close()

def get_admin_metrics():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total chats
    cursor.execute('SELECT COUNT(*) FROM rooms')
    total_chats = cursor.fetchone()[0]
    
    # Live chats (active in last 5 minutes)
    current_time = time.time()
    five_mins_ago = current_time - 300
    cursor.execute('SELECT COUNT(*) FROM rooms WHERE last_active >= ?', (five_mins_ago,))
    live_chats = cursor.fetchone()[0]
    
    # Average latency
    cursor.execute('SELECT AVG(latency_ms) FROM messages WHERE latency_ms IS NOT NULL')
    avg_latency_raw = cursor.fetchone()[0]
    avg_latency = int(avg_latency_raw) if avg_latency_raw else 0
    
    # Fetch rooms history map
    cursor.execute('SELECT room_id FROM rooms ORDER BY last_active DESC')
    room_ids = [row[0] for row in cursor.fetchall()]
    
    rooms_history = {}
    for room_id in room_ids:
        cursor.execute('SELECT role, content, latency_ms FROM messages WHERE room_id = ? ORDER BY timestamp ASC', (room_id,))
        messages = [{"role": row[0], "content": row[1], "latency_ms": row[2]} for row in cursor.fetchall()]
        rooms_history[room_id] = messages
        
    conn.close()
    
    return {
        "total_chats": total_chats,
        "live_chats": live_chats,
        "avg_latency_ms": avg_latency,
        "rooms": rooms_history
    }

def create_room(room_id: str):
    _update_room_active(room_id, time.time())
    
    if room_id not in rooms_sessions:
        config = types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
        # Start a new chat session for this room
        chat = client.chats.create(model=DEFAULT_MODEL, config=config)
        rooms_sessions[room_id] = chat
        
        # Check if the room already has history in DB before adding system prompt
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM messages WHERE room_id = ?', (room_id,))
        count = cursor.fetchone()[0]
        conn.close()
        
        if count == 0:
            add_report_message(room_id, "system", SYSTEM_PROMPT, None)

def get_room_history(room_id: str) -> List[Dict[str, str]]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT role, content, latency_ms FROM messages WHERE room_id = ? ORDER BY timestamp ASC', (room_id,))
    messages = [{"role": row[0], "content": row[1], "latency_ms": row[2]} for row in cursor.fetchall()]
    conn.close()
    return messages

def chat_with_agent(room_id: str, user_message: str, model: str = DEFAULT_MODEL) -> str:
    # Ensure room exists
    create_room(room_id)
    
    # Add user message to DB
    add_report_message(room_id, "user", user_message, None)
    
    chat_session = rooms_sessions[room_id]
    start_time = time.time()
    
    try:
        response = chat_session.send_message(user_message)
        reply_content = response.text
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Add assistant reply to DB
        add_report_message(room_id, "assistant", reply_content, latency_ms)
        
        return reply_content
    except Exception as e:
        error_msg = f"Sorry, I am having trouble connecting to Gemini. Error: {e}"
        # Do not append error to history to allow retry
        return error_msg
