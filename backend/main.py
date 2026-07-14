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

class AdminLoginRequest(BaseModel):
    password: str

class RoomResponse(BaseModel):
    room_id: str
    message: str

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

@app.post("/api/admin/login")
def admin_login(request: AdminLoginRequest):
    if request.password == "admin123":
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid password")

@app.get("/api/admin/rooms")
def get_admin_rooms():
    return agent.get_admin_metrics()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
