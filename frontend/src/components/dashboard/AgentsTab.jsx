import React from 'react';
import { Plus } from 'lucide-react';

export default function AgentsTab({ companies = [], onEditAgent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Voice Agents</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage active AI voice agent profiles, prompts, models, and voice settings.</p>
      </div>

      {/* Voice Agents Table matching user screenshot */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.5fr 0.8fr 1.2fr 1fr', padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          <span>Agent Name</span>
          <span>Status</span>
          <span>Type</span>
          <span>LLM</span>
          <span>Voice</span>
          <span>Language</span>
          <span>Last Updated</span>
          <span>Actions</span>
        </div>

        {companies.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No custom agents found. Default AI Voice Agent is active on extension 200.
          </div>
        ) : (
          companies.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.5fr 0.8fr 1.2fr 1fr', padding: '16px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{c.agent_name || c.name} Inbound</div>
                <div style={{ fontSize: 11, color: '#7c3aed', fontFamily: 'monospace' }}>ID: {c.ai_extension}</div>
              </div>
              <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>active</span></div>
              <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#6b21a8' }}>Single Prompt</span></div>
              <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#e0f2fe', color: '#075985' }}>{c.ai_model || 'gemini'}</span></div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>🎙️ {c.agent_voice || 'en-US-AriaNeural'}</div>
              <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>EN/HI</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Today</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-primary" style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, background: '#7c3aed' }} onClick={() => onEditAgent(c)}>
                  Edit Studio
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
