import React from 'react';
import { Plus } from 'lucide-react';

export default function OrganisationsTab({ companies = [], onCreateCompany, onManageCompany }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Organisations</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Multi-tenant SaaS company profiles and extension range bounds.</p>
        </div>
        <button className="btn-primary" onClick={onCreateCompany} style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> + New Organisation
        </button>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.2fr 1.5fr 1fr', padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          <span>Organisation Name</span>
          <span>AI Ext</span>
          <span>Range Start-End</span>
          <span>Model</span>
          <span>Agent Voice</span>
          <span>Action</span>
        </div>
        {companies.map(c => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.2fr 1.5fr 1fr', padding: '16px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
            <div style={{ fontWeight: 800 }}>{c.name}</div>
            <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#6b21a8' }}>{c.ai_extension}</span></div>
            <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.range_start} – {c.range_end}</div>
            <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#e0f2fe', color: '#075985' }}>{c.ai_model}</span></div>
            <div style={{ fontSize: 12 }}>{c.agent_voice}</div>
            <div>
              <button
                className="btn-primary"
                onClick={() => onManageCompany && onManageCompany(c)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#7c3aed', border: 'none', cursor: 'pointer' }}
              >
                Manage & Configure →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
