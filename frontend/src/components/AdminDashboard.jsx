import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Search, LogOut, RefreshCw, X, MessageSquare,
  Activity, Clock, Phone, TrendingUp, BarChart2,
  ShieldCheck, ChevronRight, Inbox, Download, AlertTriangle, Circle
} from 'lucide-react';

const fmt  = ms => (ms > 999 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);
const C    = {
  bg:         '#050508',
  surface:    '#0e0e14',
  card:       '#141420',
  cardHover:  '#1c1c2c',
  border:     'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  text:       '#f1f1f5',
  sub:        '#9494a8',
  muted:      '#5c5c74',
  accent:     '#6366f1',
  accentSub:  'rgba(99,102,241,0.12)',
  accentText: '#a5b4fc',
  green:      '#22c55e',
  greenSub:   'rgba(34,197,94,0.12)',
  violet:     '#a78bfa',
  amber:      '#f59e0b',
  red:        '#f87171',
};

/* ═══ Transcript Modal ═══ */
function TranscriptModal({ roomId, history, onClose }) {
  const msgs = (history || []).filter(m => m.role !== 'system');

  const exportTxt = () => {
    const txt = msgs.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = `transcript-${roomId.substring(0, 8)}.txt`;
    a.click();
  };

  return (
    <div style={M.overlay}>
      <div style={M.modal}>
        {/* Header */}
        <div style={M.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
              <MessageSquare size={15} color={C.accentText} />
              Call Transcript
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', marginTop: 3,
              maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {roomId}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={M.iconBtn} onClick={exportTxt} title="Export"><Download size={14} /></button>
            <button style={M.iconBtn} onClick={onClose}><X size={14} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={M.body}>
          {msgs.length === 0 && (
            <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '48px 0' }}>
              No messages recorded for this room.
            </p>
          )}
          {msgs.map((msg, i) => {
            const isBot = msg.role === 'assistant';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', marginBottom: 14 }}>
                {isBot && (
                  <div style={{ ...M.avatar, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', marginRight: 8 }}>
                    <Bot size={13} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: '75%', borderRadius: 14, padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                  background: isBot ? C.card : 'rgba(99,102,241,0.18)',
                  border: `1px solid ${isBot ? C.border : 'rgba(99,102,241,0.3)'}`,
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  {isBot && msg.latency_ms && (
                    <p style={{ margin: '8px 0 0', fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 4,
                      borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                      <Clock size={10} /> {fmt(msg.latency_ms)} latency
                    </p>
                  )}
                </div>
                {!isBot && (
                  <div style={{ ...M.avatar, background: C.card, border: `1px solid ${C.border}`, marginLeft: 8 }}>
                    <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>U</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={M.footer}>
          <span style={{ fontSize: 12, color: C.muted }}>{msgs.length} messages</span>
          <button style={M.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const M = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
    padding: 16,
  },
  modal: {
    width: '100%', maxWidth: 600,
    background: 'rgba(20,20,32,0.97)', border: `1px solid ${C.borderStrong}`,
    borderRadius: 18, display: 'flex', flexDirection: 'column',
    maxHeight: '88vh', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  body: { flex: 1, overflowY: 'auto', padding: 20 },
  footer: {
    padding: '12px 20px', borderTop: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: C.sub,
  },
  avatar: {
    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  closeBtn: {
    padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
    background: 'transparent', color: C.sub, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
  },
};

/* ═══ SIP Panel ═══ */
const SIP_EXTS = Array.from({ length: 11 }, (_, i) => ({ ext: String(100 + i), pass: 'secret' }));

function SIPPanel() {
  const [copied, setCopied] = useState('');
  const copy = (val, key) => {
    navigator.clipboard.writeText(val).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1500); });
  };

  return (
    <div>
      {/* Server info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { k: 'SIP Server',   v: 'localhost' },
          { k: 'SIP Port',     v: '5060' },
          { k: 'AI Extension', v: '200' },
          { k: 'Codec',        v: 'G.711 µ-law' },
          { k: 'Transport',    v: 'UDP / TCP' },
          { k: 'RTP Range',    v: '10000–10050' },
        ].map(({ k, v }) => (
          <div key={k} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: C.accentText, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Extensions table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 100px 120px 1fr', gap: 0,
          padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          {['Ext', 'Username', 'Password', 'SIP URI'].map(h => (
            <div key={h} style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {SIP_EXTS.map(({ ext, pass }) => {
          const uri = `sip:${ext}@localhost:5060`;
          return (
            <div key={ext} style={{ display: 'grid', gridTemplateColumns: '80px 100px 120px 1fr',
              padding: '9px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontFamily: 'monospace',
              transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <span style={{ fontWeight: 700, color: C.text }}>{ext}</span>
              <span style={{ color: C.sub }}>{ext}</span>
              <button onClick={() => copy(pass, ext)} title="Copy"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace',
                  fontSize: 12, color: copied === ext ? C.green : C.sub, textAlign: 'left', padding: 0 }}>
                {copied === ext ? '✓ copied' : pass}
              </button>
              <button onClick={() => copy(uri, `u-${ext}`)} title="Copy URI"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace',
                  fontSize: 12, color: copied === `u-${ext}` ? C.green : C.sub, textAlign: 'left',
                  padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {copied === `u-${ext}` ? '✓ copied' : uri}
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 10 }}>
        Dial <code style={{ color: C.accentText }}>200</code> to reach the Ventra AI voice agent
      </p>
    </div>
  );
}

/* ═══ Main Dashboard ═══ */
export default function AdminDashboard({ onBack }) {
  const [metrics, setMetrics]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tab, setTab]                   = useState('calls');
  const [autoRefresh, setAutoRefresh]   = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8001/api/admin/rooms');
      if (!res.ok) throw new Error();
      setMetrics(await res.json());
      setError('');
    } catch {
      setError('Cannot reach backend on port 8001.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, [fetchData, autoRefresh]);

  const rooms = metrics?.rooms ? Object.entries(metrics.rooms) : [];
  const filtered = rooms.filter(([id]) => id.toLowerCase().includes(search.toLowerCase()));
  const totalMsgs = rooms.reduce((a, [, h]) => a + (h?.filter(m => m.role !== 'system').length || 0), 0);

  const TABS = [
    { id: 'calls',    label: 'Call Logs',  icon: Phone },
    { id: 'overview', label: 'Overview',   icon: BarChart2 },
    { id: 'sip',      label: 'SIP Phones', icon: ShieldCheck },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden',
      background: C.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: C.text }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: C.surface, borderRight: `1px solid ${C.border}`, overflow: 'hidden' }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Ventra AI</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Control Center</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, width: '100%', textAlign: 'left',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                fontFamily: 'inherit', transition: 'background 0.15s',
                background: tab === id ? C.accentSub : 'transparent',
                color: tab === id ? C.accentText : C.sub,
                borderLeft: tab === id ? `2px solid ${C.accent}` : '2px solid transparent',
              }}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </nav>

        {/* Auto-refresh */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: C.muted }}>Auto-refresh</span>
            <div onClick={() => setAutoRefresh(v => !v)}
              style={{ width: 36, height: 20, borderRadius: 999, position: 'relative', cursor: 'pointer',
                background: autoRefresh ? C.accent : C.card, border: `1px solid ${C.border}`,
                transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 2,
                left: autoRefresh ? 16 : 2,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
          <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Every 5 seconds</p>
        </div>

        {/* Exit */}
        <div style={{ padding: '10px' }}>
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.sub, cursor: 'pointer', fontSize: 13,
              fontWeight: 500, fontFamily: 'inherit' }}>
            <LogOut size={14} /> Exit Dashboard
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
          background: C.surface, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={14} color={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search room ID…"
              style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`,
                color: C.text, borderRadius: 10, padding: '8px 32px 8px 32px',
                fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>

          <button onClick={() => { setLoading(true); fetchData(); }}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`,
              background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.sub, flexShrink: 0 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            background: C.greenSub, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 999,
            fontSize: 12, fontWeight: 600, color: C.green, flexShrink: 0 }}>
            <Circle size={7} fill={C.green} color={C.green} />
            System Live
          </div>

          <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff' }}>
            AD
          </div>
        </header>

        {/* Error */}
        {error && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: C.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Page */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── CALL LOGS ── */}
          {tab === 'calls' && (
            <div>
              {/* Header + 3 stat pills */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Call History Logs</h2>
                  <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                    {filtered.length} room{filtered.length !== 1 ? 's' : ''} {search ? 'matching' : 'total'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { icon: Phone,    label: 'Total',   value: loading ? '—' : (metrics?.total_chats ?? 0), color: '#818cf8' },
                    { icon: Activity, label: 'Live',    value: loading ? '—' : (metrics?.live_chats ?? 0),  color: C.green },
                    { icon: Clock,    label: 'Avg Lat', value: loading ? '—' : (metrics?.avg_latency_ms > 0 ? fmt(metrics.avg_latency_ms) : '—'), color: C.violet },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={15} color={color} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                {/* Head */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 90px 130px',
                  padding: '11px 16px', borderBottom: `1px solid ${C.border}`,
                  background: C.surface, gap: 8 }}>
                  {['Room ID', 'Messages', 'Last Latency', 'Status', ''].map(h => (
                    <div key={h} style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase',
                      letterSpacing: '0.06em', fontWeight: 700 }}>{h}</div>
                  ))}
                </div>

                {/* Shimmer rows */}
                {loading && Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 90px 130px',
                    padding: '14px 16px', borderBottom: `1px solid ${C.border}`, gap: 8 }}>
                    {[1,2,3,4,5].map(j => (
                      <div key={j} style={{ height: 14, borderRadius: 6, background: C.cardHover,
                        animation: 'shimmer 1.5s infinite',
                        backgroundImage: `linear-gradient(90deg, ${C.card} 25%, ${C.cardHover} 50%, ${C.card} 75%)`,
                        backgroundSize: '400px 100%' }} />
                    ))}
                  </div>
                ))}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                  <div style={{ padding: '48px 16px', textAlign: 'center', color: C.muted }}>
                    <Inbox size={36} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
                    <p style={{ fontSize: 13 }}>{search ? 'No rooms match your search.' : 'No call history yet.'}</p>
                  </div>
                )}

                {/* Rows */}
                {!loading && filtered.map(([roomId, hist]) => {
                  const msgs    = (hist || []).filter(m => m.role !== 'system');
                  const latency = msgs[msgs.length - 1]?.latency_ms ?? 0;
                  const isLive  = (metrics?.rooms_last_active?.[roomId] ?? 0) > (Date.now() / 1000 - 300);
                  return (
                    <div key={roomId}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 90px 130px',
                        padding: '13px 16px', borderBottom: `1px solid ${C.border}`,
                        alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.cardHover}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.text }} title={roomId}>
                        {roomId}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                          background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageSquare size={12} color={C.accentText} />
                        </div>
                        <span style={{ fontSize: 13, color: C.sub }}>{msgs.length} msgs</span>
                      </div>
                      <div style={{ fontSize: 13, fontFamily: 'monospace', color: C.violet }}>
                        {latency > 0 ? fmt(latency) : '—'}
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                          background: isLive ? C.greenSub : 'rgba(255,255,255,0.04)',
                          color: isLive ? C.green : C.muted,
                          border: `1px solid ${isLive ? 'rgba(34,197,94,0.2)' : C.border}` }}>
                          {isLive ? 'Live' : 'Ended'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedRoom({ roomId, hist })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color: '#fff', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit' }}>
                          Transcript <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>System Overview</h2>
              <p style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Live health metrics and usage summary.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: Phone,      label: 'Total Calls',     value: loading ? '—' : (metrics?.total_chats ?? 0),  color: '#818cf8' },
                  { icon: Activity,   label: 'Live Now',        value: loading ? '—' : (metrics?.live_chats ?? 0),   color: C.green },
                  { icon: Clock,      label: 'Avg Latency',     value: loading ? '—' : (metrics?.avg_latency_ms > 0 ? fmt(metrics.avg_latency_ms) : '—'), color: C.violet },
                  { icon: TrendingUp, label: 'Total Messages',  value: loading ? '—' : totalMsgs,                    color: C.amber },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 12,
                      background: `${color}18`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} color={color} />
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { title: 'Agent Config', icon: Bot, rows: [
                    ['Model', 'gemini-3.5-flash'], ['Backend Port', '8001'],
                    ['Framework', 'FastAPI + GenAI'], ['Active Rooms', String(rooms.length)],
                  ]},
                  { title: 'SIP / LiveKit', icon: Phone, rows: [
                    ['SIP Port', '5060'], ['LiveKit URL', 'ws://livekit:7880'],
                    ['API Key', 'devkey'], ['Codec', 'G.711 µ-law'],
                    ['Extensions', '100–110 (11 phones)'],
                  ]},
                ].map(({ title, icon: Icon, rows }) => (
                  <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontWeight: 600, fontSize: 13 }}>
                      <Icon size={14} color={C.accentText} /> {title}
                    </div>
                    {rows.map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                        borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                        <span style={{ color: C.muted }}>{k}</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SIP ── */}
          {tab === 'sip' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>SIP Phone Credentials</h2>
              <p style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>All registered extensions and server connection details.</p>
              <SIPPanel />
            </div>
          )}
        </div>
      </div>

      {selectedRoom && (
        <TranscriptModal roomId={selectedRoom.roomId} history={selectedRoom.hist} onClose={() => setSelectedRoom(null)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      `}</style>
    </div>
  );
}
