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
- 🔒 **Secure Admin Dashboard**: A password-protected monitoring portal (`admin123`) that tracks live KPIs including Total Conversations, Live Chats (active in the last 5 minutes), and exact millisecond system Latency.

## 🚀 Getting Started

Ventra operates on a hybrid architecture: the heavy SIP/WebRTC infrastructure runs in Docker (WSL), while the AI agents and UI run locally on Windows.

### 1. Docker Infrastructure (Run in WSL)
To support real phone calls, we must spin up the SIP and WebRTC media servers. Open your WSL terminal in the project root:
```bash
docker-compose up -d
```
**Containers Created:**
- 📞 **Asterisk**: The PBX SIP server that listens for your softphone connection on port `5061`.
- 🌐 **LiveKit Server**: The WebRTC media engine for ultra-low latency audio streaming.
- 🗄️ **Redis**: Required by LiveKit for state management.
- 🌉 **LiveKit SIP Gateway**: A bridge that converts incoming Asterisk SIP calls into LiveKit WebRTC rooms.

### 2. Local Windows Applications (Run in PowerShell/CMD)
Once the Docker containers are running, open your Windows terminal to start the application layers.

**Start the Web Backend (Admin Dashboard API):**
```bash
cd backend
python main.py
```
*Runs on `localhost:8001`.*

**Start the Ventra LiveKit Agent (AI Voice Brain):**
```bash
cd backend
python livekit_agent.py
```
*This connects to the Docker LiveKit server and waits for incoming SIP calls to transcribe and respond using Gemini.*

**Start the Frontend UI (Admin Dashboard):**
```bash
cd frontend
npm run dev
```
*Runs on `localhost:5173`. Click the Admin button and use passcode `admin123` to view live call metrics.*

---

## 🧪 Full Testing Phase (How to Call Ventra)

Want to talk to Ventra using a real phone dialer? Follow these steps:

1. **Download Zoiper** (or any SIP softphone) on your Windows machine or mobile phone on the same network.
2. **Create a SIP Account in Zoiper**:
   - **Username**: `100`
   - **Password**: `secret`
   - **Domain/Host**: `127.0.0.1:5061` (Use your computer's local IP address if calling from a mobile phone on the same WiFi).
3. **Make the Call**:
   - Dial extension **`200`** in Zoiper.
   - Asterisk will instantly bridge your call to the LiveKit Server.
   - The Python `livekit_agent.py` will answer the phone line, process your speech using STT, and reply natively over the call using Gemini!

---

<div align="center">
  <h3>"Hello, welcome to D E I Lab! I am Ventra. How can I help you today?"</h3>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=timeGradient&height=200&section=footer&text=Built%20for%20Speed" />
</div>
