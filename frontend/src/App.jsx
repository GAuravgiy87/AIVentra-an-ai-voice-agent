import React, { useState } from 'react';
import VoiceAgent from './components/VoiceAgent';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { Bot, PlusCircle, ShieldAlert } from 'lucide-react';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/rooms', {
        method: 'POST'
      });
      const data = await response.json();
      setCurrentRoom(data.room_id);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to connect to backend. Is FastAPI running?");
    } finally {
      setLoading(false);
    }
  };

  if (isAdminView) {
    if (!isAuthenticated) {
      return (
        <div className="app-container">
          <AdminLogin 
            onLoginSuccess={() => setIsAuthenticated(true)} 
            onBack={() => setIsAdminView(false)} 
          />
        </div>
      );
    }
    
    return (
      <div className="app-container">
        <AdminDashboard onBack={() => {
          setIsAdminView(false);
          setIsAuthenticated(false);
        }} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {!currentRoom ? (
        <div className="glass-panel" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
          
          <button 
            onClick={() => setIsAdminView(true)}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
          >
            <ShieldAlert size={16} /> Admin
          </button>

          <div className="header">
            <Bot size={64} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
            <h1>DEI Lab Agent</h1>
            <p>Your intelligent voice assistant</p>
          </div>
          
          <div className="room-selector">
            <button className="btn" onClick={createRoom} disabled={loading}>
              <PlusCircle size={20} />
              {loading ? 'Starting...' : 'Start New Conversation'}
            </button>
            <p style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
              Ensure Ollama and FastAPI backend are running before starting.
            </p>
          </div>
        </div>
      ) : (
        <VoiceAgent roomId={currentRoom} onLeave={() => setCurrentRoom(null)} />
      )}
    </div>
  );
}

export default App;
