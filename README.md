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

Ventra is split into a robust Python FastAPI backend and a beautiful React frontend.

### 1. Start the Backend (Brain)
```bash
cd backend
python main.py
```
*The backend runs on `localhost:8000` and manages all Gemini AI sessions, API keys, and latency tracking.*

### 2. Start the Frontend (Face)
```bash
cd frontend
npm run dev
```
*The frontend runs on Vite and contains Ventra's interactive animated UI and Admin Dashboard.*

---

<div align="center">
  <h3>"Hello, welcome to D E I Lab! I am Ventra. How can I help you today?"</h3>
  <img src="https://capsule-render.vercel.app/api?type=waving&color=timeGradient&height=200&section=footer&text=Built%20for%20Speed" />
</div>
