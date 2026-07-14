import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, Activity, Users, MessageSquare, Zap } from 'lucide-react';

const AdminDashboard = ({ onBack }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/admin/rooms');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (selectedRoom && metrics) {
    const history = metrics.rooms[selectedRoom] || [];
    return (
      <div className="glass-panel" style={{ height: '80vh', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginBottom: '0.5rem' }} onClick={() => setSelectedRoom(null)}>
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Conversation Transcript</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Room: {selectedRoom}</p>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
          {history.filter(m => m.role !== 'system').map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--primary-color)' : 'white',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              maxWidth: '85%',
              border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{msg.content}</p>
              
              {msg.latency_ms && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  marginTop: '0.5rem', 
                  fontSize: '0.75rem',
                  color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                }}>
                  <Clock size={12} />
                  {msg.latency_ms}ms
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ height: '80vh', maxWidth: '1000px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={24} color="var(--primary-color)" />
          Admin Dashboard
        </h2>
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={onBack}>
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ background: '#e0f2fe', padding: '0.75rem', borderRadius: '50%' }}>
            <Users size={24} color="var(--primary-color)" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Conversations</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics ? metrics.total_chats : '-'}</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ background: '#dcfce7', padding: '0.75rem', borderRadius: '50%' }}>
            <MessageSquare size={24} color="#16a34a" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Live Chats (5m)</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics ? metrics.live_chats : '-'}</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '50%' }}>
            <Zap size={24} color="#d97706" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg Latency</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics ? `${metrics.avg_latency_ms}ms` : '-'}</p>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Conversation History</h3>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading && <p>Loading dashboard...</p>}
        {!loading && metrics && Object.keys(metrics.rooms).length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No conversations recorded yet.</p>
        )}
        
        {!loading && metrics && Object.entries(metrics.rooms).reverse().map(([roomId, history]) => (
          <div 
            key={roomId} 
            onClick={() => setSelectedRoom(roomId)}
            style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '1rem', 
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Room: <span style={{ fontFamily: 'monospace', fontWeight: 400 }}>{roomId}</span></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{history.length - 1} messages</p>
            </div>
            <ArrowRight size={18} color="var(--text-secondary)" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
