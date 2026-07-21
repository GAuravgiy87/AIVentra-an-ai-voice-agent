import React, { useState, useEffect, useRef } from 'react';
import { Bot, Phone, PhoneOff, Mic, MicOff, Send, Volume2, VolumeX, Sparkles, MessageSquare, Loader } from 'lucide-react';

export default function VoiceAgent({ roomId, onLeave }) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  const recogRef = useRef(null);
  const chatEndRef = useRef(null);
  const hasGreetedRef = useRef(false);

  /* Speech recognition */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = ev => handleSend(ev.results[0][0].transcript);
    rec.onerror = rec.onend = () => setIsListening(false);
    recogRef.current = rec;
  }, []);

  /* Simulate incoming connection dialing */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  /* Load history & greet */
  useEffect(() => {
    if (isConnecting) return;
    (async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:8001/api/rooms/${roomId}/history`);
        const data = await res.json();
        const hist = (data.history || []);
        setMessages(hist);
        if (hist.length <= 1 && !hasGreetedRef.current) {
          hasGreetedRef.current = true;
          await sendToBackend('hello', true);
        }
      } catch {
        // Mock fallback greeting for local demonstration without backend
        if (!hasGreetedRef.current) {
          hasGreetedRef.current = true;
          const greetingText = "Hello, welcome to D E I Lab! I am Vantara, How can I assist you today?";
          setMessages([{ role: 'assistant', content: greetingText }]);
          speak(greetingText);
        }
      }
    })();
  }, [roomId, isConnecting]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const speak = text => {
    if (!window.speechSynthesis || muted) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.toLowerCase().includes('google us english') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
      if (femaleVoice) u.voice = femaleVoice;
      u.onstart = () => setIsSpeaking(true);
      u.onend = u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }, 250);
  };

  const sendToBackend = async (text, hidden = false) => {
    if (!hidden) setMessages(p => [...p, { role: 'user', content: text }]);
    setIsTyping(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, message: text }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.response, latency_ms: data.latency_ms }]);
      speak(data.response);
    } catch {
      // Simulate client response if backend is offline
      setTimeout(() => {
        let simulatedReply = "This is a simulated response. The Vantara backend is currently unreachable, but the speech and chat modules are fully functional.";
        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
          simulatedReply = "Hello! I am Vantara AI, developed by Gaurav Chauhan. I can help route calls to extensions 100 to 110, or answer questions about DEI Lab. How can I help you?";
        } else if (text.toLowerCase().includes('extension') || text.toLowerCase().includes('route')) {
          simulatedReply = "I can forward you to extension 101 or 105. Please let me know who you'd like to contact.";
        }
        setMessages(p => [...p, { role: 'assistant', content: simulatedReply, latency_ms: 120 }]);
        speak(simulatedReply);
        setIsTyping(false);
      }, 1000);
    } finally {
      // If server succeeded, it set it. Otherwise fallback takes care of it
      if (hasGreetedRef.current && !isTyping) {
        setIsTyping(false);
      }
    }
  };

  const handleSend = text => {
    const t = text?.trim();
    if (!t) return;
    setTextInput('');
    sendToBackend(t);
  };

  const toggleListen = () => {
    if (!recogRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recogRef.current.stop();
    } else {
      window.speechSynthesis.cancel();
      setIsListening(true);
      recogRef.current.start();
    }
  };

  const handleMute = () => {
    setMuted(!muted);
    window.speechSynthesis.cancel();
  };

  const visibleMsgs = messages.filter(m => m.role !== 'system');
  const showWaveform = isSpeaking || isListening || isTyping;

  if (isConnecting) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', padding: 24, textAlign: 'center', position: 'relative' }}>
        {/* Ringing circle animation */}
        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(236,72,153,0.08)',
            border: '2px solid rgba(236,72,153,0.3)',
            animation: 'dialPulse 1.8s infinite ease-out'
          }} />
          <div style={{
            position: 'absolute', inset: 20, borderRadius: '50%',
            background: 'rgba(139,92,246,0.06)',
            border: '2px solid rgba(139,92,246,0.2)',
            animation: 'dialPulse 1.8s infinite ease-out 0.6s'
          }} />
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)',
            zIndex: 2
          }}>
            <Phone size={28} color="#fff" style={{ animation: 'shake 0.5s infinite alternate' }} />
          </div>
        </div>

        <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          Calling Vantara AI
        </h3>
        <p className="badge badge-accent" style={{ marginBottom: 12 }}>
          Extension 200 · Developed by Gaurav Chauhan
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.6 }}>
          Connecting to Gemini cognitive engines and establishing secure neural speech links...
        </p>

        <button onClick={onLeave} className="btn-ghost" style={{
          position: 'absolute', bottom: 32,
          padding: '12px 28px', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600
        }}>
          <PhoneOff size={16} /> Cancel Call
        </button>

        <style>{`
          @keyframes dialPulse {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes shake {
            0% { transform: rotate(-10deg); }
            100% { transform: rotate(10deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', position: 'relative' }}>

      {/* Header */}
      <header style={{
        padding: '14px 20px', borderBottom: '1px solid rgba(236,72,153,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Vantara AI Voice Agent</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} className="pulse-dot" />
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Secure Voice Link · By Gaurav Chauhan
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={handleMute} title={muted ? "Unmute Voice" : "Mute Voice"} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: muted ? 'var(--red)' : 'var(--text-secondary)'
          }}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button onClick={onLeave} className="btn-ghost" style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700
          }}>
            <PhoneOff size={12} /> Hang Up
          </button>
        </div>
      </header>

      {/* Visualizer Area (Half Middle Display) */}
      <div style={{
        padding: '24px 20px', background: 'linear-gradient(180deg, #fdfafd 0%, #ffffff 100%)',
        borderBottom: '1px solid rgba(236,72,153,0.06)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {/* Female Avatar Container */}
        <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 14 }}>
          {/* Pulsing ring behind the face */}
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            background: isSpeaking ? 'var(--accent)' : (isListening ? 'var(--accent-2)' : 'rgba(236,72,153,0.06)'),
            opacity: showWaveform ? 0.35 : 0.1,
            animation: showWaveform ? 'avatarPulse 1.8s infinite ease-out' : 'none',
            transition: 'all 0.3s ease'
          }} />
          <div style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            background: isSpeaking ? 'var(--accent-2)' : (isListening ? 'var(--accent)' : 'rgba(139,92,246,0.04)'),
            opacity: showWaveform ? 0.2 : 0.05,
            animation: showWaveform ? 'avatarPulse 1.8s infinite ease-out 0.6s' : 'none',
            transition: 'all 0.3s ease'
          }} />

          {/* Actual Face Avatar Image */}
          <img src="/vantara_avatar.png" alt="Vantara AI" style={{
            width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
            border: `3px solid ${isSpeaking ? 'var(--accent)' : (isListening ? 'var(--accent-2)' : 'rgba(236,72,153,0.15)')}`,
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15)',
            transform: isSpeaking ? 'scale(1.04)' : 'scale(1)',
            transition: 'all 0.3s ease',
            zIndex: 1, position: 'relative'
          }} />
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', minHeight: 18 }}>
          {isListening && <span style={{ color: 'var(--accent)' }}>Vantara is Listening... Speak now</span>}
          {isSpeaking && <span style={{ color: 'var(--accent-2)' }}>Vantara is Speaking</span>}
          {isTyping && <span style={{ color: 'var(--text-muted)' }}>Vantara is thinking...</span>}
          {!isListening && !isSpeaking && !isTyping && <span>Vantara is Ready · Say something or type below</span>}
        </div>

        <style>{`
          @keyframes avatarPulse {
            0% { transform: scale(0.9); opacity: 0.5; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </div>

      {/* Messages / Chat section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleMsgs.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, opacity: 0.5 }}>
            <MessageSquare size={32} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>No conversation records</span>
          </div>
        )}

        {visibleMsgs.map((msg, i) => {
          const isBot = msg.role === 'assistant';
          return (
            <div key={i} className="msg-in" style={{
              display: 'flex', gap: 10, maxWidth: '85%',
              marginLeft: isBot ? 0 : 'auto', flexDirection: isBot ? 'row' : 'row-reverse'
            }}>
              {/* Profile icon */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isBot ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : '#f3e8ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: isBot ? '#fff' : 'var(--accent-2)', fontSize: 11, fontWeight: 700
              }}>
                {isBot ? 'V' : 'U'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: isBot ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
                  background: isBot ? 'var(--bg-elevated)' : 'rgba(236,72,153,0.08)',
                  border: `1px solid ${isBot ? 'rgba(139,92,246,0.06)' : 'rgba(236,72,153,0.15)'}`,
                  color: 'var(--text-primary)', wordBreak: 'break-word'
                }}>
                  <p style={{ margin: 0 }}>{msg.content}</p>
                </div>
                {isBot && msg.latency_ms && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Latency: {msg.latency_ms}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', gap: 10, maxWidth: '85%' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bot size={12} color="#fff" />
            </div>
            <div style={{
              padding: '10px 14px', borderRadius: 14, background: 'var(--bg-elevated)',
              border: '1px solid rgba(139,92,246,0.06)', display: 'flex', alignItems: 'center', gap: 4
            }}>
              <Loader size={12} className="animate-spin" color="var(--accent-2)" />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Typing...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input controls */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(236,72,153,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', borderRadius: 16, padding: '6px 8px', border: '1px solid rgba(236,72,153,0.08)' }}>
          {/* Micro button */}
          <button
            onClick={toggleListen}
            style={{
              width: 38, height: 38, borderRadius: 12, border: 'none',
              background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              color: isListening ? 'var(--red)' : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContents: 'center', justifyContent: 'center',
              boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none'
            }}
            title={isListening ? "Stop listening" : "Talk via mic"}
          >
            {isListening ? <MicOff size={18} style={{ animation: 'pulse-dot 1s infinite alternate' }} /> : <Mic size={18} />}
          </button>

          <input
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { handleSend(textInput); } }}
            disabled={isListening}
            placeholder={isListening ? 'Listening...' : 'Message Vantara AI...'}
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13, color: 'var(--text-primary)', padding: '0 4px'
            }}
          />

          <button
            onClick={() => handleSend(textInput)}
            disabled={!textInput.trim() || isTyping}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: textInput.trim() && !isTyping ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent',
              color: textInput.trim() && !isTyping ? '#fff' : 'var(--text-muted)',
              cursor: textInput.trim() && !isTyping ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
