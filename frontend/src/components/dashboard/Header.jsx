import React from 'react';
import { Search, RefreshCw, Phone } from 'lucide-react';

export default function Header({ search, setSearch, loading, onRefresh, onStartCall }) {
  return (
    <header style={{
      padding: '14px 28px', borderBottom: '1px solid rgba(236,72,153,0.08)',
      background: '#ffffff', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0
    }}>
      {/* Search Input */}
      <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search resources, calls, extensions..."
          style={{
            width: '100%', boxSizing: 'border-box', background: '#f1f5f9', border: '1px solid var(--border)',
            color: 'var(--text-primary)', borderRadius: 12, padding: '9px 14px 9px 40px',
            fontSize: 13, outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn-ghost" onClick={onRefresh} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>

        <button className="btn-primary" style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: '#7c3aed' }} onClick={onStartCall}>
          <Phone size={14} /> Test AI Line
        </button>
      </div>
    </header>
  );
}
