<div align="center">
  <img src="./frontend/public/ventra.png" alt="Ventra Face" width="200" style="border-radius:50%; box-shadow: 0 0 20px rgba(14, 165, 233, 0.4); margin-bottom: 20px;" />
  
  <h1>🎙️ Ventra: AI Voice Agent</h1>
  <p><em>The Next-Generation Voice Assistant for D E I Lab</em></p>

  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" /></a>

  <br />
  <br />
</div>

> **Ventra** is a high-speed, minimalist, web-based conversational AI agent. She is designed to mimic a real human phone call with extremely low latency, zero visual text fluff, and completely dynamic voice graph animations.

---

## ✨ Features

- ⚡ **Ultra-Fast Responses**: Powered by Google's `gemini-3.5-flash` model for near-instant AI replies.
- 🗣️ **Native Web Audio**: Utilizes browser-native STT (Speech-to-Text) and TTS (Text-to-Speech) engines with a specialized Windows cut-off fix for perfect pronunciation.
- 🎨 **Dynamic Waveform UI**: The user interface features zero text. Instead, Ventra's avatar pulses and transforms into an animated CSS waveform when she is listening, thinking, or speaking.
- 🔒 **Secure Admin Dashboard**: A password-protected monitoring portal (`admin`) that tracks live KPIs including Total Conversations, Live Chats (active in the last 5 minutes), and exact millisecond system Latency.

## ⚡ Quick Start (One-Click Run)

You can launch all 6 components of the Ventra AI voice suite (Docker containers, SIP registrations, UDP port-forwarder, Agent worker, FastAPI backend, and React frontend) with a single command!

Open a PowerShell terminal in the project root and run:
```powershell
.\start_all.ps1
```
*(Alternatively, you can just double-click **`start_all.bat`** from Windows Explorer!)*

## 🚀 Getting Started (Step-by-Step Setup)

Ventra operates on a hybrid architecture: the heavy SIP and WebRTC media servers run in Docker (inside WSL), while the AI agents, UI, and port forwarder run locally on Windows. 

Follow these steps **one by one** to start everything in the correct order:

---

### Step 1. Start Docker Infrastructure (Run in WSL)
To support telephony calls and WebRTC routing, you must spin up the media services. Open your WSL terminal in the project root:
```bash
docker-compose up -d
```
**Containers Created:**
- 📞 **Asterisk**: PBX SIP server (listens for softphones on port `5061` mapping to `5060`).
- 🌐 **LiveKit Server**: WebRTC media engine for ultra-low latency audio streaming.
- 🗄️ **Redis**: LiveKit state store backend.
- 🌉 **LiveKit SIP Gateway**: Bridge converting Asterisk SIP calls into WebRTC room events.

---

### Step 2. Initialize SIP Gateway (Run in Windows PowerShell)
You must register the SIP trunk and call dispatch rules in LiveKit. Open a PowerShell terminal in the project root:
```powershell
cd backend
python setup_sip.py
```
*Why this is needed:* This registers the inbound trunk and a dispatch rule (`dispatch-to-room`) so that LiveKit understands how to route calls from Asterisk to the AI room.

---

### Step 3. Run the UDP Media Forwarder (Run in Windows PowerShell)
WSL operates on a virtual network interface. To ensure voice audio packets can pass between your softphone on Windows and Asterisk inside WSL, start the UDP forwarder in a new PowerShell terminal:
```powershell
python udp_forward.py
```
*Why this is needed:* This binds to ports `20000-20005` (RTP audio ports) and forwards audio streams into the WSL container IP. Without this, **calls will pick up but remain silent.**

---

### Step 4. Start the Ventra Agent Worker (Run in Windows PowerShell)
Start the AI voice agent worker which handles the audio rooms, speech-to-text (Whisper), and responds using Gemini. Open a new PowerShell terminal:
```powershell
cd backend
python livekit_agent.py dev
```
*Why this is needed:* This connects the AI voice worker to the LiveKit server. Once connected, it goes into a standby state, waiting to answer incoming calls.

---

### Step 5. Start the Web Backend API (Run in Windows PowerShell)
Start the FastAPI server that monitors call metrics and saves call logs to the SQLite database. Open a new PowerShell terminal:
```powershell
cd backend
python main.py
```
*Runs on `localhost:8001`.*

---

### Step 6. Start the Dashboard Frontend (Run in Windows PowerShell)
Start the React/Vite web server to view the monitoring dashboard. Open a new PowerShell terminal:
```powershell
cd frontend
npm run dev
```
*Runs on `localhost:5173`. Click the Admin button and login using passcode `admin` to view live call metrics and transcripts.*

---

## 🧪 Full Testing Phase (How to Call Ventra)

Once all 6 steps are running, you can test the call using a real softphone:

1. **Download Zoiper** (or any SIP softphone like MicroSIP or Linphone) on your Windows machine.
2. **Create a SIP Account in Zoiper**:
   - **Username**: `100`
   - **Password**: `secret`
   - **Domain/Host**: `127.0.0.1:5061`
3. **Make the Call**:
   - Dial extension **`200`** in Zoiper.
   - Asterisk will instantly bridge the call to the LiveKit Server.
   - The Python agent worker will automatically pick up and greet you: *"Hello, welcome to D E I Lab! I am Ventra. How can I help you today?"*

---

<div align="center">
  <h3>"Hello, welcome to D E I Lab! I am Ventra. How can I help you today?"</h3>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=timeGradient&height=200&section=footer&text=Built%20for%20Speed" />
</div>