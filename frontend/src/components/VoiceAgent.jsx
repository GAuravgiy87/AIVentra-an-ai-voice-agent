import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, MessageSquare } from 'lucide-react';

const VoiceAgent = ({ roomId, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const hasGreetedRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [roomId]);

  // Fetch initial history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/rooms/${roomId}/history`);
        const data = await response.json();
        setMessages(data.history || []);
        
        // If history is just the system prompt, trigger greeting
        if (data.history && data.history.length === 1 && data.history[0].role === 'system') {
          if (!hasGreetedRef.current) {
            hasGreetedRef.current = true;
            handleSendMessage("hello", true); // hidden initial ping to trigger greeting
          }
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    fetchHistory();
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // Wake up the Windows TTS engine with a silent/empty utterance
      const wakeup = new SpeechSynthesisUtterance('');
      wakeup.volume = 0;
      window.speechSynthesis.speak(wakeup);
      
      // Wait for the engine to fully initialize, then pad the text with a pause
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance("... " + text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google US English')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }, 300);
    }
  };

  const handleSendMessage = async (text, isHidden = false) => {
    if (!text.trim()) return;
    
    if (!isHidden) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    }
    setTextInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, message: text }),
      });
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      speak(data.response);
      
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I am having trouble connecting." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // stop speech before listening
      window.speechSynthesis.cancel();
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={24} color="var(--primary-color)" />
          Room: {roomId.substring(0, 8)}
        </h2>
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={onLeave}>
          Leave Room
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--bg-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isListening ? '0 0 0 15px rgba(239, 68, 68, 0.2)' : isSpeaking ? '0 0 0 15px rgba(14, 165, 233, 0.2)' : '0 0 20px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ventra Face Avatar */}
          <img 
            src="/ventra.png" 
            alt="Ventra Avatar" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: (isTyping || isListening || isSpeaking) ? 0.3 : 1,
              transition: 'opacity 0.3s ease'
            }} 
          />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
          {isTyping ? (
            <div className="waveform thinking">
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
            </div>
          ) : isListening ? (
            <div className="waveform listening">
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
            </div>
          ) : isSpeaking ? (
            <div className="waveform speaking">
              <div className="waveform-bar" style={{ backgroundColor: '#0ea5e9' }}></div>
              <div className="waveform-bar" style={{ backgroundColor: '#0ea5e9' }}></div>
              <div className="waveform-bar" style={{ backgroundColor: '#0ea5e9' }}></div>
              <div className="waveform-bar" style={{ backgroundColor: '#0ea5e9' }}></div>
              <div className="waveform-bar" style={{ backgroundColor: '#0ea5e9' }}></div>
            </div>
          ) : null}
          </div>
        </div>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 500 }}>
          {isListening ? "Listening to you..." : isTyping ? "Ventra is thinking..." : isSpeaking ? "Ventra is speaking..." : "Ready"}
        </h3>
      </div>

      <div className="controls">
        <button 
          className={`mic-btn ${isListening ? 'listening' : ''}`} 
          onClick={toggleListen}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        <input 
          type="text" 
          className="input-field" 
          placeholder="Type your message..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(textInput)}
        />
        
        <button 
          className="mic-btn" 
          style={{ background: 'var(--primary-color)', borderColor: 'var(--primary-color)', color: 'white' }}
          onClick={() => handleSendMessage(textInput)}
        >
          <Send size={20} color="white" />
        </button>
      </div>
      
      <div className="status-indicator">
        <div className={`dot ${isListening ? 'active' : ''}`}></div>
        {isListening ? 'Listening...' : 'Microphone ready'}
      </div>
    </div>
  );
};

export default VoiceAgent;
