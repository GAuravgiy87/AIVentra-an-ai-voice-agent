from google import genai
from google.genai import types
from typing import Dict, List, Optional
import time
import os
import psycopg2
from psycopg2.extras import DictCursor
import bcrypt

# Configure Gemini with the provided API Key from environment variables
from dotenv import load_dotenv
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")
client = genai.Client(api_key=api_key)

DEFAULT_MODEL = "gemini-3.5-flash"

SYSTEM_PROMPT = """You are an AI Voice Agent for your company. 
Your first message should always be exactly: ", Hello, welcome! I am your AI assistant. How can I help you today?"
CRITICAL: Keep your answers extremely short and concise, exactly like a real phone call. 
If the user introduces themselves by name, you MUST politely address them by their name (e.g., "Hello Gaurav"). 
Answer ONLY what the user asks. No extra information or long paragraphs. Keep it conversational but very fast.
Do not use markdown formatting like asterisks or bold text, just plain text that is easy to speak out loud.
"""


DB_URL = "postgresql://postgres:postgres@localhost:5433/ventra"

def get_db():
    return psycopg2.connect(DB_URL)

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Create companies table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            ai_extension TEXT,
            range_start INTEGER,
            range_end INTEGER,
            ai_model TEXT,
            ai_model_name TEXT,
            created_at DOUBLE PRECISION
        )
    ''')
    # Alter companies table to add columns if missing
    for col, col_type in [("ai_extension", "TEXT"), ("range_start", "INTEGER"), ("range_end", "INTEGER"), ("ai_model", "TEXT"), ("ai_model_name", "TEXT"), ("agent_name", "TEXT"), ("agent_prompt", "TEXT"), ("agent_voice", "TEXT")]:
        cursor.execute(f"ALTER TABLE companies ADD COLUMN IF NOT EXISTS {col} {col_type}")
    
    # 2. Create rooms table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            room_id TEXT PRIMARY KEY,
            extension TEXT,
            company_id INTEGER,
            last_active DOUBLE PRECISION,
            created_at DOUBLE PRECISION
        )
    ''')
    # Alter rooms to add company_id and extension if missing
    for col, col_type in [("extension", "TEXT"), ("company_id", "INTEGER")]:
        cursor.execute(f"ALTER TABLE rooms ADD COLUMN IF NOT EXISTS {col} {col_type}")

    # 3. Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            room_id TEXT,
            role TEXT,
            content TEXT,
            latency_ms INTEGER,
            timestamp DOUBLE PRECISION,
            FOREIGN KEY(room_id) REFERENCES rooms(room_id)
        )
    ''')

    # 4. Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            password TEXT,
            name TEXT,
            ai_extension TEXT,
            ai_model TEXT,
            ai_model_name TEXT,
            role TEXT,
            company_id INTEGER,
            created_at DOUBLE PRECISION,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )
    ''')
    # Alter users to add new columns if missing
    for col, col_type in [("ai_extension", "TEXT"), ("ai_model", "TEXT"), ("ai_model_name", "TEXT"), ("role", "TEXT"), ("company_id", "INTEGER")]:
        cursor.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type}")

    # 5. Create devices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            name TEXT,
            ip_address TEXT,
            extension TEXT,
            type TEXT,
            status TEXT,
            company_id INTEGER,
            created_at DOUBLE PRECISION,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )
    ''')
    for col, col_type in [("company_id", "INTEGER")]:
        cursor.execute(f"ALTER TABLE devices ADD COLUMN IF NOT EXISTS {col} {col_type}")

    # Seed default companies if empty
    cursor.execute("SELECT COUNT(*) FROM companies")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO companies (name, ai_extension, range_start, range_end, ai_model, ai_model_name, created_at) VALUES ('Acme Corp', '201', 100, 150, 'gemini', 'gemini-3.1-flash-lite', %s)", (time.time(),))
        cursor.execute("INSERT INTO companies (name, ai_extension, range_start, range_end, ai_model, ai_model_name, created_at) VALUES ('Globex Corporation', '202', 151, 200, 'gemini', 'gemini-3.1-flash-lite', %s)", (time.time(),))
        
    # Seed default users
    # Super Admin
    cursor.execute("SELECT COUNT(*) FROM users WHERE id = 'admin'")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO users (id, password, name, ai_extension, ai_model, ai_model_name, role, company_id, created_at)
            VALUES ('admin', 'admin', 'Super Administrator', '200', 'gemini', 'gemini-3.1-flash-lite', 'super_admin', NULL, %s)
        ''', (time.time(),))
    else:
        cursor.execute("UPDATE users SET role = 'super_admin' WHERE id = 'admin'")

    # Acme Admin
    cursor.execute("SELECT COUNT(*) FROM users WHERE id = 'acme_admin'")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO users (id, password, name, ai_extension, ai_model, ai_model_name, role, company_id, created_at)
            VALUES ('acme_admin', 'acme123', 'Acme Admin', '201', 'gemini', 'gemini-3.1-flash-lite', 'company_admin', 1, %s)
        ''', (time.time(),))

    # Globex Admin
    cursor.execute("SELECT COUNT(*) FROM users WHERE id = 'globex_admin'")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO users (id, password, name, ai_extension, ai_model, ai_model_name, role, company_id, created_at)
            VALUES ('globex_admin', 'globex123', 'Globex Admin', '202', 'gemini', 'gemini-3.1-flash-lite', 'company_admin', 2, %s)
        ''', (time.time(),))

    # Seed default admin devices (100 to 110)
    for ext in range(100, 111):
        ext_str = str(ext)
        cursor.execute("SELECT COUNT(*) FROM devices WHERE extension = %s", (ext_str,))
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                INSERT INTO devices (user_id, name, ip_address, extension, type, status, company_id, created_at)
                VALUES ('admin', %s, '127.0.0.1', %s, 'Softphone', 'Offline', NULL, %s)
            ''', (f"Admin Softphone {ext_str}", ext_str, time.time()))

    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

def _update_room_active(room_id: str, timestamp: float, extension: Optional[str] = None, company_id: Optional[int] = None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO rooms (room_id, created_at, last_active, extension, company_id) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (room_id) DO NOTHING', 
                  (room_id, timestamp, timestamp, extension, company_id))
    
    updates = ['last_active = %s']
    params = [timestamp]
    if extension:
        updates.append('extension = %s')
        params.append(extension)
    if company_id:
        updates.append('company_id = %s')
        params.append(company_id)
    params.append(room_id)
    
    cursor.execute(f'UPDATE rooms SET {", ".join(updates)} WHERE room_id = %s', params)
    conn.commit()
    conn.close()

def add_report_message(room_id: str, role: str, content: str, latency_ms: Optional[int] = None, extension: Optional[str] = None, company_id: Optional[int] = None):
    current_time = time.time()
    
    if company_id is None and extension:
        conn = get_db()
        cursor = conn.cursor()
        
        # 1. Check if the extension belongs to a company's main line
        cursor.execute("SELECT id FROM companies WHERE ai_extension = %s", (extension,))
        row = cursor.fetchone()
        if row:
            company_id = row[0]
        else:
            # 2. Check if the extension belongs to an individual user's line
            cursor.execute("SELECT company_id FROM users WHERE ai_extension = %s", (extension,))
            row = cursor.fetchone()
            if row:
                company_id = row[0]
                
        conn.close()
        
    _update_room_active(room_id, current_time, extension, company_id)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (room_id, role, content, latency_ms, timestamp)
        VALUES (%s, %s, %s, %s, %s)
    ''', (room_id, role, content, latency_ms, current_time))
    conn.commit()
    conn.close()

def get_admin_metrics(company_id: Optional[int] = None):
    conn = get_db()
    cursor = conn.cursor()
    
    # Filters
    where_clause = ""
    params = []
    if company_id is not None:
        where_clause = "WHERE company_id = %s"
        params = [company_id]
        
    # Total chats
    cursor.execute(f'SELECT COUNT(*) FROM rooms {where_clause}', params)
    total_chats = cursor.fetchone()[0]
    
    # Live chats (active in last 5 minutes)
    current_time = time.time()
    five_mins_ago = current_time - 300
    if company_id is not None:
        cursor.execute('SELECT COUNT(*) FROM rooms WHERE last_active >= %s AND company_id = %s', (five_mins_ago, company_id))
    else:
        cursor.execute('SELECT COUNT(*) FROM rooms WHERE last_active >= %s', (five_mins_ago,))
    live_chats = cursor.fetchone()[0]
    
    # Average latency
    if company_id is not None:
        cursor.execute('''
            SELECT AVG(m.latency_ms) 
            FROM messages m 
            JOIN rooms r ON m.room_id = r.room_id 
            WHERE m.latency_ms IS NOT NULL AND r.company_id = %s
        ''', (company_id,))
    else:
        cursor.execute('SELECT AVG(latency_ms) FROM messages WHERE latency_ms IS NOT NULL')
    avg_latency_raw = cursor.fetchone()[0]
    avg_latency = int(avg_latency_raw) if avg_latency_raw else 0
    
    # Fetch rooms history map
    cursor.execute(f'SELECT room_id, last_active FROM rooms {where_clause} ORDER BY last_active DESC', params)
    rows = cursor.fetchall()
    
    rooms_history = {}
    for r_id, last_active in rows:
        cursor.execute('SELECT role, content, latency_ms FROM messages WHERE room_id = %s ORDER BY timestamp ASC', (r_id,))
        messages = [{"role": row[0], "content": row[1], "latency_ms": row[2]} for row in cursor.fetchall()]
        rooms_history[r_id] = {
            "messages": messages,
            "last_active": last_active
        }
        
    conn.close()
    
    return {
        "total_chats": total_chats,
        "live_chats": live_chats,
        "avg_latency_ms": avg_latency,
        "rooms": rooms_history
    }

def create_room(room_id: str, extension: Optional[str] = None):
    _update_room_active(room_id, time.time(), extension)
    
    # Check if the room already has history in DB
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM messages WHERE room_id = %s', (room_id,))
    count = cursor.fetchone()[0]
    conn.close()
    
    # If room is completely new, inject the system prompt as the first hidden context
    if count == 0:
        add_report_message(room_id, "system", SYSTEM_PROMPT, None, extension)

def get_room_history(room_id: str) -> List[Dict[str, str]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT role, content, latency_ms FROM messages WHERE room_id = %s ORDER BY timestamp ASC', (room_id,))
    messages = [{"role": row[0], "content": row[1], "latency_ms": row[2]} for row in cursor.fetchall()]
    conn.close()
    return messages

def chat_with_agent(room_id: str, user_message: str, model: str = DEFAULT_MODEL) -> str:
    # Ensure room exists
    create_room(room_id)
    
    # Add user message to DB
    add_report_message(room_id, "user", user_message, None)
    
    # Fetch complete history for stateless context
    history = get_room_history(room_id)
    
    contents = []
    system_instruction = None
    for msg in history:
        role = msg["role"]
        if role == "system":
            system_instruction = msg["content"]
            continue
        gemini_role = "user" if role == "user" else "model"
        contents.append(types.Content(role=gemini_role, parts=[types.Part.from_text(text=msg["content"])]))
        
    config = types.GenerateContentConfig(system_instruction=system_instruction)
    start_time = time.time()
    
    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=config
        )
        reply_content = response.text
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Add assistant reply to DB
        add_report_message(room_id, "assistant", reply_content, latency_ms)
        
        return reply_content
    except Exception as e:
        error_msg = f"Sorry, I am having trouble connecting to Gemini. Error: {e}"
        return error_msg

def add_user(user_id, password, name, ai_extension=None, ai_model="gemini", ai_model_name="gemini-3.1-flash-lite", role="agent", company_id=None):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') if password else None
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO users (id, password, name, ai_extension, ai_model, ai_model_name, role, company_id, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)', 
                   (user_id, hashed_password, name, ai_extension, ai_model, ai_model_name, role, company_id, time.time()))
    conn.commit()
    conn.close()

def get_users(company_id=None):
    conn = get_db()
    cursor = conn.cursor()
    if company_id is not None:
        cursor.execute('SELECT id, name, ai_extension, ai_model, ai_model_name, role, company_id, created_at FROM users WHERE company_id = %s', (company_id,))
    else:
        cursor.execute('SELECT id, name, ai_extension, ai_model, ai_model_name, role, company_id, created_at FROM users')
    users = [{"id": row[0], "name": row[1], "ai_extension": row[2], "ai_model": row[3], "ai_model_name": row[4], "role": row[5], "company_id": row[6], "created_at": row[7]} for row in cursor.fetchall()]
    conn.close()
    return users

def delete_user(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
    cursor.execute('DELETE FROM devices WHERE user_id = %s', (user_id,))
    conn.commit()
    conn.close()

def check_user_login(user_id, password):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT name, role, company_id, password FROM users WHERE id = %s', (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        stored_hash = row[3]
        if stored_hash and bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            return {"id": user_id, "name": row[0], "role": row[1] or "user", "company_id": row[2]}
    return None

def add_device(user_id, name, ip_address, extension, device_type, status, company_id=None):
    conn = get_db()
    cursor = conn.cursor()
    # Lookup the owner's company_id if not explicitly provided
    if company_id is None:
        cursor.execute("SELECT company_id FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if row:
            company_id = row[0]
            
    # Perform range check validation
    if company_id is not None:
        cursor.execute("SELECT range_start, range_end FROM companies WHERE id = %s", (company_id,))
        comp_row = cursor.fetchone()
        if comp_row and comp_row[0] is not None:
            r_start, r_end = comp_row[0], comp_row[1]
            try:
                ext_int = int(extension)
                if not (r_start <= ext_int <= r_end):
                    conn.close()
                    raise ValueError(f"Extension {extension} is outside the allowed range of {r_start} to {r_end} for this company.")
            except ValueError as e:
                conn.close()
                raise ValueError(f"Invalid extension range: {e}")

    cursor.execute('''
        INSERT INTO devices (user_id, name, ip_address, extension, type, status, company_id, created_at) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ''', (user_id, name, ip_address, extension, device_type, status, company_id, time.time()))
    conn.commit()
    conn.close()
    # Trigger Asterisk sync
    sync_asterisk_config()

def get_user_devices(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, ip_address, extension, type, status, created_at, company_id FROM devices WHERE user_id = %s', (user_id,))
    devices = [{"id": row[0], "name": row[1], "ip_address": row[2], "extension": row[3], "type": row[4], "status": row[5], "created_at": row[6], "company_id": row[7]} for row in cursor.fetchall()]
    conn.close()
    return devices

def get_all_devices(company_id=None):
    conn = get_db()
    cursor = conn.cursor()
    if company_id is not None:
        cursor.execute('SELECT id, user_id, name, ip_address, extension, type, status, company_id, created_at FROM devices WHERE company_id = %s', (company_id,))
    else:
        cursor.execute('SELECT id, user_id, name, ip_address, extension, type, status, company_id, created_at FROM devices')
    devices = [{"id": row[0], "user_id": row[1], "name": row[2], "ip_address": row[3], "extension": row[4], "type": row[5], "status": row[6], "company_id": row[7], "created_at": row[8]} for row in cursor.fetchall()]
    conn.close()
    return devices

def delete_device(device_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM devices WHERE id = %s', (device_id,))
    conn.commit()
    conn.close()
    # Trigger Asterisk sync
    sync_asterisk_config()

def get_companies():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, ai_extension, range_start, range_end, ai_model, ai_model_name, created_at, agent_name, agent_prompt, agent_voice FROM companies')
    companies = [{
        "id": row[0],
        "name": row[1],
        "ai_extension": row[2],
        "range_start": row[3],
        "range_end": row[4],
        "ai_model": row[5],
        "ai_model_name": row[6],
        "created_at": row[7],
        "agent_name": row[8],
        "agent_prompt": row[9],
        "agent_voice": row[10]
    } for row in cursor.fetchall()]
    conn.close()
    return companies

def add_company(name: str, ai_extension: str, range_start: int, range_end: int, ai_model: str = "gemini", ai_model_name: str = "gemini-3.1-flash-lite", admin_id: str = None, admin_name: str = None, admin_password: str = None, agent_name: str = "AI Assistant", agent_prompt: str = "", agent_voice: str = "en-US-AriaNeural"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO companies (name, ai_extension, range_start, range_end, ai_model, ai_model_name, agent_name, agent_prompt, agent_voice, created_at) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
    ''', (name, ai_extension, range_start, range_end, ai_model, ai_model_name, agent_name, agent_prompt, agent_voice, time.time()))
    company_id = cursor.fetchone()[0]

    if admin_id and admin_password:
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute('''
            INSERT INTO users (id, password, name, ai_extension, ai_model, ai_model_name, role, company_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (admin_id, hashed_password, admin_name or "Admin", ai_extension, ai_model, ai_model_name, 'company_admin', company_id, time.time()))

    conn.commit()
    conn.close()
    # Trigger Asterisk sync
    sync_asterisk_config()

def update_company(company_id: int, name: str, ai_extension: str, range_start: int, range_end: int, ai_model: str, ai_model_name: str, agent_name: str = "AI Assistant", agent_prompt: str = "", agent_voice: str = "en-US-AriaNeural"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE companies 
        SET name = %s, ai_extension = %s, range_start = %s, range_end = %s, ai_model = %s, ai_model_name = %s, agent_name = %s, agent_prompt = %s, agent_voice = %s
        WHERE id = %s
    ''', (name, ai_extension, range_start, range_end, ai_model, ai_model_name, agent_name, agent_prompt, agent_voice, company_id))
    
    # Also update the associated company_admin user if their model needs updating
    cursor.execute('''
        UPDATE users
        SET ai_extension = %s, ai_model = %s, ai_model_name = %s
        WHERE company_id = %s AND role = 'company_admin'
    ''', (ai_extension, ai_model, ai_model_name, company_id))
    
    conn.commit()
    conn.close()
    sync_asterisk_config()

def delete_company(company_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM companies WHERE id = %s', (company_id,))
    cursor.execute('UPDATE users SET company_id = NULL WHERE company_id = %s', (company_id,))
    cursor.execute('DELETE FROM devices WHERE company_id = %s', (company_id,))
    cursor.execute('DELETE FROM rooms WHERE company_id = %s', (company_id,))
    conn.commit()
    conn.close()
    # Trigger Asterisk sync
    sync_asterisk_config()

def sync_asterisk_config():
    import logging
    import socket
    import paramiko
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT extension FROM devices WHERE extension IS NOT NULL")
    extensions = [row[0] for row in cursor.fetchall() if row[0]]
    
    cursor.execute("SELECT ai_extension FROM companies WHERE ai_extension IS NOT NULL")
    ai_extensions = [row[0] for row in cursor.fetchall() if row[0]]
    conn.close()
    
    def get_lan_ip():
        try:
            hostname = socket.gethostname()
            ips = socket.gethostbyname_ex(hostname)[2]
            for ip in ips:
                if ip.startswith("10.7.11."): return ip
            for ip in ips:
                if ip.startswith("10.7."): return ip
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return '127.0.0.1'
    lan_ip = get_lan_ip()
    
    pjsip_lines = [
        "; Dynamic Transports from Host LAN IP",
        "[transport-udp]",
        "type=transport",
        "protocol=udp",
        "bind=0.0.0.0:5060",
        f"external_media_address={lan_ip}",
        f"external_signaling_address={lan_ip}",
        "external_signaling_port=5061",
        "",
        "[transport-tcp]",
        "type=transport",
        "protocol=tcp",
        "bind=0.0.0.0:5060",
        f"external_media_address={lan_ip}",
        f"external_signaling_address={lan_ip}",
        "external_signaling_port=5061",
        "",
    ]
    for ext in extensions:
        pjsip_lines.append(f"[{ext}](endpoint-template)")
        pjsip_lines.append(f"auth=auth{ext}")
        pjsip_lines.append(f"aors={ext}")
        pjsip_lines.append(f"[auth{ext}](auth-template)")
        pjsip_lines.append(f"username={ext}")
        pjsip_lines.append(f"[{ext}](aor-template)")
        pjsip_lines.append("")
        
    ext_lines = []
    for ai_ext in ai_extensions:
        # Route AI extensions to livekit running on the internal docker network
        ext_lines.append(f"exten => {ai_ext},1,Dial(PJSIP/livekit/sip:{ai_ext}@livekit-sip:5060)")
        ext_lines.append(f"exten => {ai_ext},n,Hangup()")
        ext_lines.append("")
        
    for ext in extensions:
        ext_lines.append(f"exten => {ext},1,Dial(PJSIP/{ext})")
        ext_lines.append(f"exten => {ext},n,Hangup()")
        ext_lines.append("")
        
    # Write to local Asterisk folder
    try:
        import os
        import subprocess
        
        # Determine paths relative to backend directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pjsip_path = os.path.join(base_dir, "asterisk", "pjsip_custom.conf")
        ext_path = os.path.join(base_dir, "asterisk", "extensions_custom.conf")
        
        with open(pjsip_path, 'w') as f:
            f.write("\n".join(pjsip_lines))
        with open(ext_path, 'w') as f:
            f.write("\n".join(ext_lines))
        
        # Reload local Asterisk container
        docker_cmd = ["wsl", "docker"] if os.name == 'nt' else ["docker"]
        cmd = docker_cmd + ["exec", "voiceagent-asterisk-1", "asterisk", "-rx", "core reload"]
        subprocess.run(cmd, check=True)
        logging.info(f"[Asterisk Sync]: Successfully synced to local Docker and reloaded configuration.")
    except Exception as e:
        logging.error(f"[Asterisk Sync Error]: Failed to sync to local Docker: {e}")

def get_user_metrics(user_id):
    devices = get_user_devices(user_id)
    extensions = [d["extension"] for d in devices if d["extension"]]
    
    if not extensions:
        return {
            "total_chats": 0,
            "live_chats": 0,
            "avg_latency_ms": 0,
            "rooms": {}
        }
        
    conn = get_db()
    cursor = conn.cursor()
    
    # Format placeholders for SQLite IN clause
    placeholders = ",".join("%s" for _ in extensions)
    
    # Total chats matching user device extensions
    cursor.execute(f'SELECT COUNT(*) FROM rooms WHERE extension IN ({placeholders})', extensions)
    total_chats = cursor.fetchone()[0]
    
    # Live chats (active in last 5 minutes) matching extensions
    current_time = time.time()
    five_mins_ago = current_time - 300
    cursor.execute(f'SELECT COUNT(*) FROM rooms WHERE last_active >= %s AND extension IN ({placeholders})', [five_mins_ago] + extensions)
    live_chats = cursor.fetchone()[0]
    
    # Average latency matching extensions
    cursor.execute(f'''
        SELECT AVG(m.latency_ms) 
        FROM messages m 
        JOIN rooms r ON m.room_id = r.room_id 
        WHERE m.latency_ms IS NOT NULL AND r.extension IN ({placeholders})
    ''', extensions)
    avg_latency_raw = cursor.fetchone()[0]
    avg_latency = int(avg_latency_raw) if avg_latency_raw else 0
    
    # Fetch rooms history map matching extensions
    cursor.execute(f'SELECT room_id, last_active FROM rooms WHERE extension IN ({placeholders}) ORDER BY last_active DESC', extensions)
    rows = cursor.fetchall()
    
    rooms_history = {}
    for r_id, last_active in rows:
        cursor.execute('SELECT role, content, latency_ms FROM messages WHERE room_id = %s ORDER BY timestamp ASC', (r_id,))
        messages = [{"role": row[0], "content": row[1], "latency_ms": row[2]} for row in cursor.fetchall()]
        rooms_history[r_id] = {
            "messages": messages,
            "last_active": last_active
        }
        
    conn.close()
    
    return {
        "total_chats": total_chats,
        "live_chats": live_chats,
        "avg_latency_ms": avg_latency,
        "rooms": rooms_history
    }
