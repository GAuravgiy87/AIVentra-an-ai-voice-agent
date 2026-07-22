import React from 'react';

export default function DeploymentConfigTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Deployment Config & Health</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Microservices status and system pipeline diagnostics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {[
          { name: 'FastAPI Backend Host', host: 'http://localhost:8001', status: 'Online' },
          { name: 'LiveKit Server', host: 'ws://127.0.0.1:7890', status: 'Online' },
          { name: 'Asterisk PBX Container', host: '10.7.11.141:5061', status: 'Online' },
          { name: 'PostgreSQL Database', host: 'localhost:5433 (ventra)', status: 'Online' }
        ].map(d => (
          <div key={d.name} style={{ padding: 20, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SERVICE NAME</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{d.name}</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#7c3aed', marginTop: 4 }}>{d.host}</div>
            <span style={{ display: 'inline-block', marginTop: 12, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>{d.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
