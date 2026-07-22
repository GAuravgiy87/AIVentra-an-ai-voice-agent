import React from 'react';
import { Plus } from 'lucide-react';

export default function UsersTab({ usersList, onAddUser }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Users</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage SIP extension users and softphone credentials.</p>
        </div>
        <button className="btn-primary" onClick={onAddUser} style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> + Add User
        </button>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1.2fr 0.8fr', padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          <span>User ID</span>
          <span>Name</span>
          <span>Extension</span>
          <span>Role</span>
          <span>Company ID</span>
          <span>Actions</span>
        </div>
        {usersList.map(u => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1.2fr 0.8fr', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
            <div style={{ fontWeight: 800, fontFamily: 'monospace' }}>{u.id}</div>
            <div style={{ fontWeight: 700 }}>{u.name}</div>
            <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#6b21a8' }}>{u.ai_extension || '—'}</span></div>
            <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: u.role === 'super_admin' ? '#fee2e2' : '#e0f2fe', color: u.role === 'super_admin' ? '#991b1b' : '#075985' }}>{u.role}</span></div>
            <div>{u.company_id ? `Company #${u.company_id}` : 'Global'}</div>
            <div><button className="btn-ghost" style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>Edit</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
