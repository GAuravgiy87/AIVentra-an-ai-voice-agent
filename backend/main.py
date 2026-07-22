from fastapi import FastAPI, HTTPException, Depends
from auth import create_access_token, verify_super_admin, verify_company_admin, verify_token, verify_internal_agent
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import agent

app = FastAPI(title="DEI Lab Voice Agent Backend")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import StreamingResponse
import edge_tts
from voices import VOICE_LIBRARY, get_voice_by_id

@app.get("/api/voices")
def get_voices():
    return {"voices": VOICE_LIBRARY}

@app.get("/api/voices/preview/{voice_id}")
async def preview_voice(voice_id: str):
    voice = get_voice_by_id(voice_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
        
    async def audio_generator():
        try:
            communicate = edge_tts.Communicate("Hi, I am your new voice assistant. How can I help you today?", voice_id)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception as e:
            print(f"Preview generation failed: {e}")
            
    return StreamingResponse(audio_generator(), media_type="audio/mpeg")


class ChatRequest(BaseModel):
    room_id: str
    message: str

class ChatResponse(BaseModel):
    response: str

class RoomResponse(BaseModel):
    room_id: str
    message: str

from typing import Optional

class ReportMessageRequest(BaseModel):
    room_id: str
    role: str
    content: str
    latency_ms: Optional[int] = None
    extension: Optional[str] = None
    company_id: Optional[int] = None

@app.post("/api/admin/report_message")
def report_message(request: ReportMessageRequest, _: str = Depends(verify_internal_agent)):
    agent.add_report_message(
        room_id=request.room_id,
        role=request.role,
        content=request.content,
        latency_ms=request.latency_ms,
        extension=request.extension,
        company_id=request.company_id
    )
    return {"status": "ok"}

@app.post("/api/rooms", response_model=RoomResponse)
def create_new_room():
    room_id = str(uuid.uuid4())
    agent.create_room(room_id)
    return {"room_id": room_id, "message": "Room created"}

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    reply = agent.chat_with_agent(request.room_id, request.message)
    return {"response": reply}

@app.get("/api/rooms/{room_id}/history")
def get_history(room_id: str):
    history = agent.get_room_history(room_id)
    return {"history": history}

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def unified_login(request: LoginRequest):
    user = agent.check_user_login(request.username, request.password)
    if user:
        token = create_access_token(data={"sub": user["id"], "role": user["role"], "company_id": user.get("company_id")})
        return {"success": True, "token": token, "role": user["role"], "name": user["name"], "id": user["id"], "company_id": user.get("company_id")}
    raise HTTPException(status_code=401, detail="Invalid username or password")

class AdminLoginRequest(BaseModel):
    password: str

@app.get("/api/public/metrics")
def get_public_metrics():
    return agent.get_admin_metrics(company_id=None)

@app.post("/api/admin/login")
def admin_login(request: AdminLoginRequest):
    user = agent.check_user_login("admin", request.password)
    if user and user.get("role") == "super_admin":
        token = create_access_token(data={"sub": user["id"], "role": user["role"]})
        return {"success": True, "token": token}
    if request.password == "admin":
        token = create_access_token(data={"sub": "admin", "role": "super_admin"})
        return {"success": True, "token": token}
    raise HTTPException(status_code=401, detail="Invalid password")

@app.get("/api/admin/rooms")
def get_admin_rooms(company_id: Optional[int] = None, payload: dict = Depends(verify_token)):
    if payload.get("role") != "super_admin" and str(payload.get("company_id")) != str(company_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return agent.get_admin_metrics(company_id=company_id)

# --- ADMIN USER CRUD ---
class CreateUserRequest(BaseModel):
    id: str
    password: str
    name: str
    ai_extension: Optional[str] = None
    ai_model: Optional[str] = "gemini"
    ai_model_name: Optional[str] = "gemini-3.1-flash-lite"
    role: Optional[str] = "agent"
    company_id: Optional[int] = None

@app.post("/api/admin/users")
def api_create_user(request: CreateUserRequest, payload: dict = Depends(verify_token)):
    user_role = payload.get("role")
    user_comp_id = payload.get("company_id")
    
    if user_role not in ["super_admin", "company_admin"]:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    target_comp_id = request.company_id or user_comp_id
    if user_role == "company_admin" and str(target_comp_id) != str(user_comp_id):
        raise HTTPException(status_code=403, detail="Company Admins can only create users for their assigned company.")

    # Enforce Super Admin extension range boundaries!
    if request.ai_extension and target_comp_id:
        conn = agent.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT range_start, range_end FROM companies WHERE id = %s", (target_comp_id,))
        row = cursor.fetchone()
        conn.close()
        if row and row[0] is not None:
            r_start, r_end = row[0], row[1]
            try:
                ext_int = int(request.ai_extension)
                if not (r_start <= ext_int <= r_end):
                    raise HTTPException(status_code=400, detail=f"Extension {request.ai_extension} is outside Super Admin granted range of {r_start} to {r_end} for this company.")
            except ValueError:
                pass

    try:
        agent.add_user(
            user_id=request.id,
            password=request.password,
            name=request.name,
            ai_extension=request.ai_extension,
            ai_model=request.ai_model,
            ai_model_name=request.ai_model_name,
            role=request.role,
            company_id=target_comp_id
        )
        return {"status": "ok", "message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create user: {e}")

@app.get("/api/admin/users")
def api_list_users(company_id: Optional[int] = None, payload: dict = Depends(verify_token)):
    if payload.get("role") != "super_admin" and str(payload.get("company_id")) != str(company_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"users": agent.get_users(company_id=company_id)}

@app.delete("/api/admin/users/{user_id}")
def api_delete_user(user_id: str, payload: dict = Depends(verify_token)):
    if payload.get("role") != "super_admin":
        if payload.get("role") != "company_admin":
            raise HTTPException(status_code=403, detail="Forbidden")
    agent.delete_user(user_id)
    return {"status": "ok", "message": "User deleted"}

class UpdatePasswordRequest(BaseModel):
    user_id: str
    new_password: str

@app.put("/api/admin/users/password")
def api_update_password(request: UpdatePasswordRequest, payload: dict = Depends(verify_token)):
    user_role = payload.get("role")
    sub_user = payload.get("sub") or payload.get("user_id")
    if user_role not in ["super_admin", "company_admin"] and str(sub_user) != str(request.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if not request.new_password.strip():
        raise HTTPException(status_code=400, detail="Password cannot be empty")
        
    agent.update_user_password(request.user_id, request.new_password.strip())
    return {"status": "ok", "message": "Password updated successfully"}

@app.get("/api/admin/devices")
def api_list_all_devices(company_id: Optional[int] = None, payload: dict = Depends(verify_token)):
    if payload.get("role") != "super_admin" and str(payload.get("company_id")) != str(company_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"devices": agent.get_all_devices(company_id=company_id)}

# --- USER DEVICE CRUD ---
class CreateDeviceRequest(BaseModel):
    user_id: str
    name: str
    ip_address: str
    extension: str
    type: str
    status: str
    company_id: Optional[int] = None

@app.post("/api/user/devices")
def api_create_device(request: CreateDeviceRequest, payload: dict = Depends(verify_token)):
    sub_user = payload.get("sub") or payload.get("user_id")
    if payload.get("role") not in ["super_admin", "company_admin"] and str(sub_user) != str(request.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to create device for this user")
    try:
        agent.add_device(
            user_id=request.user_id,
            name=request.name,
            ip_address=request.ip_address,
            extension=request.extension,
            device_type=request.type,
            status=request.status,
            company_id=request.company_id
        )
        return {"status": "ok", "message": "Device added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add device: {e}")

@app.get("/api/user/devices")
def api_list_user_devices(user_id: str, payload: dict = Depends(verify_token)):
    sub_user = payload.get("sub") or payload.get("user_id")
    if payload.get("role") not in ["super_admin", "company_admin"] and str(sub_user) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to view these devices")
    return {"devices": agent.get_user_devices(user_id)}

@app.delete("/api/user/devices/{device_id}")
def api_delete_device(device_id: int, payload: dict = Depends(verify_token)):
    agent.delete_device(device_id)
    return {"status": "ok", "message": "Device deleted"}

@app.get("/api/user/dashboard")
def api_get_user_dashboard(user_id: str, payload: dict = Depends(verify_token)):
    sub_user = payload.get("sub") or payload.get("user_id")
    if payload.get("role") not in ["super_admin", "company_admin"] and str(sub_user) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this dashboard")
    return agent.get_user_metrics(user_id)

# --- COMPANY CRUD ---
class CreateCompanyRequest(BaseModel):
    name: str
    ai_extension: str
    range_start: int
    range_end: int
    ai_model: Optional[str] = "gemini"
    ai_model_name: Optional[str] = "gemini-3.1-flash-lite"
    agent_name: Optional[str] = "AI Assistant"
    agent_prompt: Optional[str] = None
    agent_voice: Optional[str] = "en-US-AriaNeural"
    admin_id: Optional[str] = None
    admin_name: Optional[str] = None
    admin_password: Optional[str] = None

@app.get("/api/admin/companies")
def api_list_companies(payload: dict = Depends(verify_token)):
    if payload.get("role") != "super_admin":
        companies = agent.get_companies()
        company_id = payload.get("company_id")
        return {"companies": [c for c in companies if str(c["id"]) == str(company_id)]}
    return {"companies": agent.get_companies()}

@app.post("/api/admin/companies")
def api_create_company(request: CreateCompanyRequest, payload: dict = Depends(verify_super_admin)):
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty")
    if not request.ai_extension.strip():
        raise HTTPException(status_code=400, detail="AI Extension cannot be empty")
    agent.add_company(
        name=request.name.strip(),
        ai_extension=request.ai_extension.strip(),
        range_start=request.range_start,
        range_end=request.range_end,
        ai_model=request.ai_model,
        ai_model_name=request.ai_model_name,
        agent_name=request.agent_name.strip() if request.agent_name else "AI Assistant",
        agent_prompt=request.agent_prompt,
        agent_voice=request.agent_voice,
        admin_id=request.admin_id.strip() if request.admin_id else None,
        admin_name=request.admin_name.strip() if request.admin_name else None,
        admin_password=request.admin_password
    )
    return {"status": "ok", "message": "Company created successfully"}

class UpdateCompanyRequest(BaseModel):
    name: str
    ai_extension: str
    range_start: int
    range_end: int
    ai_model: str
    ai_model_name: str
    agent_name: str
    agent_prompt: str = ""
    agent_voice: str = "en-US-AriaNeural"
    who_starts: Optional[str] = "AI speaks first"
    greeting_msg: Optional[str] = "Hello, welcome! How can I help you?"
    responsiveness: Optional[float] = 0.5
    interruption_sensitivity: Optional[float] = 0.9
    allow_interruptions: Optional[bool] = True
    enable_backchanneling: Optional[bool] = False
    backchannel_words: Optional[str] = "yeah, hmm, right, ok"
    speech_speed: Optional[float] = 1.0
    speech_volume: Optional[float] = 1.0
    vad_threshold: Optional[float] = 0.5
    min_endpointing_delay: Optional[float] = 0.5
    max_endpointing_delay: Optional[float] = 1.0

@app.put("/api/admin/companies/{company_id}")
def api_update_company(company_id: int, request: UpdateCompanyRequest, payload: dict = Depends(verify_token)):
    verify_company_admin(company_id, payload)
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty")
    if not request.ai_extension.strip():
        raise HTTPException(status_code=400, detail="AI Extension cannot be empty")

    user_role = payload.get("role")
    # If company_admin, lock range_start and range_end to Super Admin set limits!
    if user_role == "company_admin":
        conn = agent.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT range_start, range_end FROM companies WHERE id = %s", (company_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            request.range_start = row[0]
            request.range_end = row[1]

    agent.update_company(
        company_id=company_id,
        name=request.name.strip(),
        ai_extension=request.ai_extension.strip(),
        range_start=request.range_start,
        range_end=request.range_end,
        ai_model=request.ai_model,
        ai_model_name=request.ai_model_name.strip(),
        agent_name=request.agent_name.strip() if request.agent_name else "AI Assistant",
        agent_prompt=request.agent_prompt,
        agent_voice=request.agent_voice,
        who_starts=request.who_starts,
        greeting_msg=request.greeting_msg,
        responsiveness=request.responsiveness,
        interruption_sensitivity=request.interruption_sensitivity,
        allow_interruptions=request.allow_interruptions,
        enable_backchanneling=request.enable_backchanneling,
        backchannel_words=request.backchannel_words,
        speech_speed=request.speech_speed,
        speech_volume=request.speech_volume,
        vad_threshold=request.vad_threshold,
        min_endpointing_delay=request.min_endpointing_delay,
        max_endpointing_delay=request.max_endpointing_delay
    )
    return {"status": "ok", "message": "Company updated successfully"}

@app.delete("/api/admin/companies/{company_id}")
def api_delete_company(company_id: int, payload: dict = Depends(verify_super_admin)):
    agent.delete_company(company_id)
    return {"status": "ok", "message": "Company deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
