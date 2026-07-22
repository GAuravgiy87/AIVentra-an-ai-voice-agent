import React from 'react';
import { Check, X } from 'lucide-react';

export default function RolesPermissionsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Roles & Permissions Matrix</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Granular access permissions for Super Admin, Company Admin, and User / Agent accounts.</p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', paddingBottom: 12, borderBottom: '2px solid #f1f5f9', fontWeight: 800, fontSize: 13 }}>
          <span>Platform Feature & Permission</span>
          <span>Super Admin</span>
          <span>Company Admin</span>
          <span>User / Agent</span>
        </div>
        {[
          ['View Call Logs & Room Transcripts', true, true, true],
          ['Test Call AI Voice Line (In-Browser WebRTC)', true, true, true],
          ['Edit Agent System Prompt & Voice Studio', true, true, false],
          ['Configure DTMF Keypad Forwarding Rules', true, true, false],
          ['Create & Manage Extension Users', true, true, false],
          ['View Own Company Itemized Call Spending & Time Logs', true, true, false],
          ['View All Tenant Companies Billing & Revenue', true, false, false],
          ['Create & Delete Organisations / Companies', true, false, false],
          ['Access System Deployment Config & Server Diagnostics', true, false, false]
        ].map(([feat, sa, ca, u]) => (
          <div key={feat} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{feat}</span>
            <span>{sa ? <Check size={18} color="#10b981" /> : <X size={18} color="#ef4444" />}</span>
            <span>{ca ? <Check size={18} color="#10b981" /> : <X size={18} color="#ef4444" />}</span>
            <span>{u ? <Check size={18} color="#10b981" /> : <X size={18} color="#ef4444" />}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
