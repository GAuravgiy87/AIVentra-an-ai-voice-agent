import React from 'react';
import { Phone, Bot } from 'lucide-react';

export default function CallAgentsTab({ companies = [], onStartCall }) {
  // If no custom companies created yet, show real default agent line
  const linesToDisplay = companies.length > 0
    ? companies.map(c => ({
        ext: c.ai_extension || '200',
        name: `${c.name} AI Agent Line`,
        agent: c.agent_name || `${c.name} Inbound`,
        model: c.ai_model || 'gemini',
        status: 'Active'
      }))
    : [
        { ext: '200', name: 'Global AI Voice Agent Line', agent: 'AI Voice Agent', model: 'gemini', status: 'Active' }
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Call Agents</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Live active voice agent extensions deployed on Asterisk & LiveKit.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {linesToDisplay.map(item => (
          <div key={item.ext} style={{ padding: 20, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="badge badge-accent" style={{ background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 800 }}>Ext {item.ext}</span>
              <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>{item.status}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bot size={13} color="#7c3aed" /> Agent: {item.agent}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>LLM Model: <span style={{ fontWeight: 700, color: '#7c3aed' }}>{item.model}</span></div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 16, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={onStartCall}>
              <Phone size={14} /> Launch In-Browser Test Call
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
