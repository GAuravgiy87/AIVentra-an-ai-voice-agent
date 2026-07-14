import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Send, Bot, User, LogOut,
  Phone, Volume2, VolumeX, RotateCcw, Clock, ChevronDown
} from 'lucide-react';

export default function VoiceAgent({ roomId, onLeave }) {
  const [messages, setMessages]   = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted]         = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef     = useRef(null);
  const scrollBoxRef   = useRef(null);
  const hasGreetedRef  = useRef(false);
  const inputRef       = useRef(null);

  /* ── Speech Recognition ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (ev) => handleSend(ev.results[0][0].transcript);
      rec.onerror  = () => setIsListening(false);
      rec.onend    = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  /* ── Initial history ── */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`http://localhost:8001/api/rooms/${roomId}/history`);
        const data = await res.json();
        const hist = data.history || [];
        setMessages(hist);
        if (hist.length <= 1 && !hasGreetedRef.current) {
          hasGreetedRef.current = true;
          await sendToBackend('hello', true);
        }
      } catch { /* ignore */ }
    })();
  }, [roomId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Scroll button visibility ── */
  const onScroll = () => {
    const el = scrollBoxRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  /* ── TTS ── */
  const speak = (text) => {
    if (!('speechSynthesis' in window) || muted) return;
    window.speechSynthesis.cancel();
    const wake = new SpeechSynthesisUtterance('');
    wake.volume = 0;
    window.speechSynthesis.speak(wake);
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance('... ' + text);
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English')) || voices[0];
      if (v) utt.voice = v;
      utt.rate  = 1.0;
      utt.pitch = 1.0;
      utt.onstart = () => setIsSpeaking(true);
      utt.onend   = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
    }, 300);
  };

  /* ── Send to backend ── */
  const sendToBackend = async (text, hidden = false) => {
    if (!hidden) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    }
    setIsTyping(true);
    try {
      const res  = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, latency_ms: data.latency_ms }]);
      speak(data.response);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting to the server right now.",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (text) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    setTextInput('');
    sendToBackend(trimmed);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel();
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const visibleMessages = messages.filter(m => m.role !== 'system');

  /* ── Status bar ── */
  const statusLabel = isListening ? 'Listening…' : isSpeaking ? 'Speaking…' : isTyping ? 'Thinking…' : 'Ready';
  const statusColor = isListening ? 'bg-red-500' : isSpeaking ? 'bg-indigo-500' : isTyping ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div className="gradient-bg min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="glass border-b border-[var(--border)] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-card)] pulse-dot" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--text-primary)] text-sm leading-tight">Ventra AI</h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">Room {roomId.substring(0, 8)}…</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute TTS */}
          <button
            onClick={() => { setMuted(m => !m); window.speechSynthesis.cancel(); }}
            title={muted ? 'Unmute voice' : 'Mute voice'}
            className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clear */}
          <button
            onClick={() => setMessages([])}
            title="Clear chat"
            className="btn-ghost w-9 h-9 rounded-lg flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Leave */}
          <button
            onClick={onLeave}
            className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40 ml-1"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </header>

      {/* ── Chat area ── */}
      <div
        ref={scrollBoxRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4"
      >
        {visibleMessages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Phone className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">No messages yet</h3>
            <p className="text-sm text-[var(--text-secondary)]">Click the mic or type a message to start talking with Ventra.</p>
          </div>
        )}

        {visibleMessages.map((msg, i) => {
          const isBot = msg.role === 'assistant';
          return (
            <div key={i} className={`flex gap-3 fade-in ${isBot ? 'justify-start' : 'justify-end'}`}>
              {/* Avatar — bot only */}
              {isBot && (
                <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[75%] sm:max-w-[60%] ${isBot ? '' : 'items-end flex flex-col'}`}>
                {/* Label */}
                <span className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${isBot ? 'text-indigo-400' : 'text-[var(--text-muted)] text-right'}`}>
                  {isBot ? 'Ventra AI' : 'You'}
                </span>

                {/* Bubble */}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isBot
                    ? 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Latency badge */}
                {isBot && msg.latency_ms && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--text-muted)]">
                    <Clock className="w-2.5 h-2.5" />
                    {msg.latency_ms}ms
                  </div>
                )}
              </div>

              {/* Avatar — user only */}
              {!isBot && (
                <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 justify-start fade-in">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-5 py-4 flex items-center gap-1.5">
              <span className="typing-dot w-2 h-2 rounded-full bg-[var(--text-muted)] inline-block" />
              <span className="typing-dot w-2 h-2 rounded-full bg-[var(--text-muted)] inline-block" />
              <span className="typing-dot w-2 h-2 rounded-full bg-[var(--text-muted)] inline-block" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-28 right-6 w-9 h-9 glass border border-[var(--border)] rounded-full flex items-center justify-center shadow-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* ── Input bar ── */}
      <div className="glass border-t border-[var(--border)] px-4 sm:px-8 py-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">

            {/* Mic */}
            <button
              onClick={toggleListen}
              title={isListening ? 'Stop listening' : 'Start voice input'}
              className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-all font-medium ${
                isListening
                  ? 'bg-red-500/20 border border-red-500/60 text-red-400 shadow-lg shadow-red-500/20'
                  : 'btn-ghost border'
              }`}
            >
              {isListening
                ? <Mic className="w-5 h-5 animate-pulse" />
                : <MicOff className="w-5 h-5" />
              }
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={isListening ? 'Listening…' : 'Type a message…'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(textInput); } }}
                disabled={isListening}
                className="input-base w-full px-4 py-3 rounded-xl text-sm pr-4"
              />
            </div>

            {/* Send */}
            <button
              onClick={() => handleSend(textInput)}
              disabled={!textInput.trim() || isTyping}
              className="btn-primary w-12 h-12 shrink-0 rounded-xl flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Status strip */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`w-2 h-2 rounded-full ${statusColor} ${isListening || isTyping ? 'pulse-dot' : ''}`} />
            <span className="text-xs text-[var(--text-muted)] font-medium">{statusLabel}</span>
            {muted && <span className="badge badge-amber ml-2">Voice muted</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
