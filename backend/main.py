from fastapi import FastAPI, HTTPException
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
def report_message(request: ReportMessageRequest):
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
        return {"success": True, "role": user["role"], "name": user["name"], "id": user["id"]}
    raise HTTPException(status_code=401, detail="Invalid username or password")

class AdminLoginRequest(BaseModel):
    password: str

@app.post("/api/admin/login")
def admin_login(request: AdminLoginRequest):
    if request.password == "admin":
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid password")

@app.get("/api/admin/rooms")
def get_admin_rooms():
    return agent.get_admin_metrics()

# --- ADMIN USER CRUD ---
class CreateUserRequest(BaseModel):
    id: str
    password: str
    name: str
    ai_extension: Optional[str] = None
    ai_model: Optional[str] = "gemini"
    ai_model_name: Optional[str] = "gemini-3.1-flash-lite"

@app.post("/api/admin/users")
def api_create_user(request: CreateUserRequest):
    try:
        agent.add_user(
            user_id=request.id,
            password=request.password,
            name=request.name,
            ai_extension=request.ai_extension,
            ai_model=request.ai_model,
            ai_model_name=request.ai_model_name
        )
        return {"status": "ok", "message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create user: {e}")

@app.get("/api/admin/users")
def api_list_users():
    return {"users": agent.get_users()}

@app.delete("/api/admin/users/{user_id}")
def api_delete_user(user_id: str):
    agent.delete_user(user_id)
    return {"status": "ok", "message": "User deleted"}

@app.get("/api/admin/devices")
def api_list_all_devices():
    return {"devices": agent.get_all_devices()}

# --- USER DEVICE CRUD ---
class CreateDeviceRequest(BaseModel):
    user_id: str
    name: str
    ip_address: str
    extension: str
    type: str
    status: str

@app.post("/api/user/devices")
def api_create_device(request: CreateDeviceRequest):
    try:
        agent.add_device(
            user_id=request.user_id,
            name=request.name,
            ip_address=request.ip_address,
            extension=request.extension,
            device_type=request.type,
            status=request.status
        )
        return {"status": "ok", "message": "Device added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add device: {e}")

@app.get("/api/user/devices")
def api_list_user_devices(user_id: str):
    return {"devices": agent.get_user_devices(user_id)}

@app.delete("/api/user/devices/{device_id}")
def api_delete_device(device_id: int):
    agent.delete_device(device_id)
    return {"status": "ok", "message": "Device deleted"}

@app.get("/api/user/dashboard")
def api_get_user_dashboard(user_id: str):
    return agent.get_user_metrics(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
