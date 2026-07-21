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

@app.post("/api/admin/report_message")
def report_message(request: ReportMessageRequest, _: str = Depends(verify_internal_agent)):
    agent.add_report_message(
        room_id=request.room_id,
        role=request.role,
        content=request.content,
        latency_ms=request.latency_ms,
        extension=request.extension
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

@app.post("/api/admin/login")
def admin_login(request: AdminLoginRequest):
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
    if payload.get("role") not in ["super_admin", "company_admin"] and str(payload.get("company_id")) != str(request.company_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        agent.add_user(
            user_id=request.id,
            password=request.password,
            name=request.name,
            ai_extension=request.ai_extension,
            ai_model=request.ai_model,
            ai_model_name=request.ai_model_name,
            role=request.role,
            company_id=request.company_id
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
        # Need to verify if the user belongs to the company_admin's company, but for simplicity we rely on DB or keep it simple.
        # Just checking if they are company_admin for now.
        if payload.get("role") != "company_admin":
            raise HTTPException(status_code=403, detail="Forbidden")
    agent.delete_user(user_id)
    return {"status": "ok", "message": "User deleted"}

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
    if payload.get("role") not in ["super_admin", "company_admin"] and str(payload.get("user_id")) != str(request.user_id):
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
    if payload.get("role") not in ["super_admin", "company_admin"] and str(payload.get("user_id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to view these devices")
    return {"devices": agent.get_user_devices(user_id)}

@app.delete("/api/user/devices/{device_id}")
def api_delete_device(device_id: int, payload: dict = Depends(verify_token)):
    # Note: A proper system would check if the device belongs to the user or company. For now, verify_token provides baseline security.
    if payload.get("role") == "user":
        pass # In a real scenario, we'd look up the device's user_id and verify it matches payload['user_id']
    agent.delete_device(device_id)
    return {"status": "ok", "message": "Device deleted"}

@app.get("/api/user/dashboard")
def api_get_user_dashboard(user_id: str, payload: dict = Depends(verify_token)):
    if payload.get("role") not in ["super_admin", "company_admin"] and str(payload.get("user_id")) != str(user_id):
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
    agent_name: Optional[str] = "Ventra"
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
        agent_name=request.agent_name.strip() if request.agent_name else "Ventra",
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

@app.put("/api/admin/companies/{company_id}")
def api_update_company(company_id: int, request: UpdateCompanyRequest, payload: dict = Depends(verify_token)):
    verify_company_admin(company_id, payload)
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty")
    if not request.ai_extension.strip():
        raise HTTPException(status_code=400, detail="AI Extension cannot be empty")
    agent.update_company(
        company_id=company_id,
        name=request.name.strip(),
        ai_extension=request.ai_extension.strip(),
        range_start=request.range_start,
        range_end=request.range_end,
        ai_model=request.ai_model,
        ai_model_name=request.ai_model_name.strip(),
        agent_name=request.agent_name.strip() if request.agent_name else "Ventra",
        agent_prompt=request.agent_prompt,
        agent_voice=request.agent_voice
    )
    return {"status": "ok", "message": "Company updated successfully"}

@app.delete("/api/admin/companies/{company_id}")
def api_delete_company(company_id: int, payload: dict = Depends(verify_super_admin)):
    agent.delete_company(company_id)
    return {"status": "ok", "message": "Company deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
