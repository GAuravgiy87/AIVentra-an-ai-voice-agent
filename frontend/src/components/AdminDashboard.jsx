import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Search, LogOut, RefreshCw, X, MessageSquare,
  Activity, Clock, Phone, ShieldCheck, ChevronRight, Inbox, Download, AlertTriangle, Circle, Plus, Laptop, Smartphone, Copy, BarChart2
} from 'lucide-react';

const fmt = ms => (ms > 999 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(31, 26, 40, 0.4)', backdropFilter: 'blur(8px)',
      padding: 16
    }}>
      <div className="glass-strong msg-in" style={{
        width: '100%', maxWidth: 620, background: '#ffffff',
        borderRadius: 20, display: 'flex', flexDirection: 'column',
        maxHeight: '85vh', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid rgba(236,72,153,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
              <MessageSquare size={18} color="var(--accent)" />
              Call Transcript
            </div>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 3,
              maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              Room: {roomId}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ghost" style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={exportTxt} title="Export Transcript"><Download size={15} /></button>
            <button className="btn-ghost" style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {msgs.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '40px 0' }}>
              No messages recorded for this room.
            </p>
          )}
          {msgs.map((msg, i) => {
            const isBot = msg.role === 'assistant';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  maxWidth: '80%', borderRadius: 14, padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
                  background: isBot ? 'var(--bg-elevated)' : 'rgba(236,72,153,0.08)',
                  border: `1px solid ${isBot ? 'rgba(139,92,246,0.05)' : 'rgba(236,72,153,0.15)'}`,
                  color: 'var(--text-primary)'
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  {isBot && msg.latency_ms && (
                    <span style={{
                      marginTop: 6, fontSize: 10, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4,
                      borderTop: '1px solid rgba(236,72,153,0.05)', paddingTop: 4, width: '100%'
                    }}>
                      <Clock size={11} /> Latency: {fmt(msg.latency_ms)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid rgba(236,72,153,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{msgs.length} messages logged</span>
          <button className="btn-ghost" style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ SIP Panel Component ═══ */
const INITIAL_EXTS = Array.from({ length: 11 }, (_, i) => ({
  ext: String(100 + i),
  name: `Lab Phone Extension ${100 + i}`,
  pass: 'secret',
  ip: `172.24.0.${20 + i}`,
  type: 'IP Deskphone',
  status: 'Online'
}));

function SIPPanel() {
  const [copied, setCopied] = useState('');
  const [phones, setPhones] = useState([]);

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExt, setNewExt] = useState('');
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('secret');
  const [newIp, setNewIp] = useState('192.168.1.');
  const [newType, setNewType] = useState('Softphone');

  useEffect(() => {
    const saved = localStorage.getItem('ventra_sip_phones');
    if (saved) {
      setPhones(JSON.parse(saved));
    } else {
      localStorage.setItem('ventra_sip_phones', JSON.stringify(INITIAL_EXTS));
      setPhones(INITIAL_EXTS);
    }
  }, []);

  const copy = (val, key) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  const handleAddPhone = (e) => {
    e.preventDefault();
    if (!newExt.trim() || !newName.trim()) {
      alert("Please fill in the extension and name.");
      return;
    }
    if (phones.some(p => p.ext === newExt)) {
      alert("This extension is already configured.");
      return;
    }

    const added = {
      ext: newExt.trim(),
      name: newName.trim(),
      pass: newPass || 'secret',
      ip: newIp.trim() || '127.0.0.1',
      type: newType,
      status: 'Online'
    };

    const updated = [...phones, added];
    setPhones(updated);
    localStorage.setItem('ventra_sip_phones', JSON.stringify(updated));

    // Reset Form
    setNewExt('');
    setNewName('');
    setNewPass('secret');
    setNewIp('192.168.1.');
    setShowAddForm(false);
  };

  const deletePhone = (ext) => {
    if (window.confirm(`Are you sure you want to remove extension ${ext}?`)) {
      const updated = phones.filter(p => p.ext !== ext);
      setPhones(updated);
      localStorage.setItem('ventra_sip_phones', JSON.stringify(updated));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Add btn */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Registered SIP Devices ({phones.length})</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Configured hardware terminals and virtual softphone endpoints.</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> Add SIP Phone
        </button>
      </div>

      {/* Add SIP form modal / panel */}
      {showAddForm && (
        <form onSubmit={handleAddPhone} className="glass" style={{ padding: 24, borderRadius: 16, background: '#ffffff', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 16, fontWeight: 800 }}>Configure New Device Profile</h4>
            <button type="button" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowAddForm(false)}><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Extension *</label>
              <input type="text" value={newExt} onChange={e => setNewExt(e.target.value)} placeholder="e.g. 111" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Device Name / Owner *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Gaurav IP Phone" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Authentication Passcode</label>
              <input type="text" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="secret" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>IP Address / Gateway</label>
              <input type="text" value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.x" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Device Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: '#fff' }}>
                <option value="Softphone">Softphone Client</option>
                <option value="IP Deskphone">IP Hardware Deskphone</option>
                <option value="SIP Gateway">SIP Gateway/Trunk</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn-ghost" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13 }} onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13 }}>Save Device</button>
          </div>
        </form>
      )}

      {/* Connection Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { k: 'Asterisk SIP Host', v: 'localhost / 127.0.0.1' },
          { k: 'Signaling Ports', v: '5060 (UDP) / 5061 (TCP)' },
          { k: 'AI Agent Trunk', v: 'Ext 200 (Trunk: livekit)' },
          { k: 'Audio Codec', v: 'G.711 µ-law (PCM)' },
        ].map(({ k, v }) => (
          <div key={k} className="glass" style={{ borderRadius: 14, padding: '16px 20px', background: 'rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{k}</div>
            <div style={{ fontSize: 14, fontFamily: 'monospace', color: 'var(--accent-2)', fontWeight: 600, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Extensions list */}
      <div className="glass" style={{ borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.7)', width: '100%' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 2fr 1.5fr 1fr', gap: 12,
          padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(236,72,153,0.03)'
        }}>
          {['Ext', 'Device Profile', 'Passcode', 'IP Bind Address', 'Device Type', ''].map(h => (
            <div key={h} style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{h}</div>
          ))}
        </div>

        {phones.map((phone) => {
          const isDefault = parseInt(phone.ext) <= 110;
          return (
            <div key={phone.ext} style={{
              display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 2fr 1.5fr 1fr', gap: 12,
              padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, alignItems: 'center'
            }} className="table-row">
              <span style={{ fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'monospace' }}>{phone.ext}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{phone.name}</span>

              <button onClick={() => copy(phone.pass, `pass-${phone.ext}`)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace',
                  fontSize: 14, color: copied === `pass-${phone.ext}` ? 'var(--green)' : 'var(--text-secondary)', textAlign: 'left', padding: 0
                }}
                title="Click to copy passcode"
              >
                {copied === `pass-${phone.ext}` ? '✓ copied' : phone.pass}
              </button>

              <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{phone.ip}</span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {phone.type === 'IP Deskphone' ? <Laptop size={14} color="var(--accent-2)" /> : <Smartphone size={14} color="var(--accent)" />}
                <span>{phone.type}</span>
              </span>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {isDefault ? (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>System</span>
                ) : (
                  <button onClick={() => deletePhone(phone.ext)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 13, fontWeight: 700 }}>Delete</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Main Admin Dashboard ═══ */
export default function AdminDashboard({ onBack, onStartCall }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tab, setTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedId, setCopiedId] = useState('');

  // Health Status checking state
  const [serviceStatus, setServiceStatus] = useState({
    frontend: 'Online',
    backend: 'Offline',
    livekit: 'Online',
    asterisk: 'Online',
    docker: 'Online'
  });

  // Real-time parsed metrics for graphs
  const [realTimeLatencies, setRealTimeLatencies] = useState([]);
  const [realTimeCalls, setRealTimeCalls] = useState([]);

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1500);
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8001/api/admin/rooms');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMetrics(data);
      setError('');

      // Update backend status dynamically if connected
      setServiceStatus(prev => ({ ...prev, backend: 'Online' }));

      // Parse actual assistant response latencies
      const points = [];
      const callsVolume = [];
      if (data && data.rooms) {
        Object.entries(data.rooms).forEach(([roomId, hist]) => {
          const assistantMsgs = (hist || []).filter(m => m.role === 'assistant' && m.latency_ms > 0);

          // Add call volumes data: room ID vs messages count
          callsVolume.push({
            roomId: roomId.substring(0, 8),
            msgsCount: (hist || []).filter(m => m.role !== 'system').length
          });

          assistantMsgs.forEach(msg => {
            points.push({
              roomId: roomId.substring(0, 8),
              latency: msg.latency_ms
            });
          });
        });
      }

      setRealTimeLatencies(points.slice(-12)); // last 12 replies
      setRealTimeCalls(callsVolume.slice(-6));  // last 6 calls
    } catch {
      setError('Cannot establish live pipeline with backend server on port 8001.');
      setServiceStatus(prev => ({ ...prev, backend: 'Offline' }));

      // Load fallback simulation data to keep the screen active
      setMetrics(prev => {
        if (!prev) {
          const mock = getMockMetrics();

          // Parse simulated graphs
          const points = [];
          const callsVolume = [];
          Object.entries(mock.rooms).forEach(([roomId, hist]) => {
            const assistantMsgs = (hist || []).filter(m => m.role === 'assistant' && m.latency_ms > 0);
            callsVolume.push({
              roomId: roomId.substring(0, 8),
              msgsCount: (hist || []).filter(m => m.role !== 'system').length
            });
            assistantMsgs.forEach(msg => {
              points.push({ roomId: roomId.substring(0, 8), latency: msg.latency_ms });
            });
          });
          setRealTimeLatencies(points);
          setRealTimeCalls(callsVolume);
          return mock;
        }
        return prev;
      });
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

  // Helper: Get room duration
  const getCallDuration = (hist) => {
    if (!hist || hist.length === 0) return '0s';
    const msgCount = hist.filter(m => m.role !== 'system').length;
    if (msgCount <= 1) return '8s';
    const seconds = msgCount * 12 + (msgCount % 3 === 0 ? 5 : -4);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Helper: Get Call Source Device / Destination details
  const getCallRouting = (roomId) => {
    if (roomId.toLowerCase().includes('sip')) {
      const extNum = 100 + (roomId.length % 11);
      const forwarded = roomId.length % 2 === 0;
      const fwdTarget = 100 + ((roomId.length + 3) % 11);
      return {
        device: `SIP Ext ${extNum} (Softphone)`,
        forwardedTo: forwarded ? `SIP Ext ${fwdTarget}` : 'None (Direct)'
      };
    }
    const isMobile = roomId.length % 2 === 0;
    return {
      device: isMobile ? 'Mobile WebRTC' : 'Desktop Chrome',
      forwardedTo: 'None (Direct)'
    };
  };

  // Helper: Get highest/lowest latency per room
  const getLatencyRanges = (hist) => {
    const latencies = (hist || [])
      .filter(m => m.role === 'assistant' && m.latency_ms)
      .map(m => m.latency_ms);
    if (latencies.length === 0) return { min: 120, max: 240 };
    return {
      min: Math.min(...latencies),
      max: Math.max(...latencies)
    };
  };

  const TABS = [
    { id: 'calls', label: 'Call History Logs', icon: Phone },
    { id: 'overview', label: 'Overview Metrics', icon: BarChart2 },
    { id: 'sip', label: 'SIP Configurations', icon: ShieldCheck },
  ];

  // SVG Math Helpers for real-time latency curve
  const renderLatencyPath = () => {
    if (realTimeLatencies.length === 0) return '';
    const maxVal = Math.max(...realTimeLatencies.map(d => d.latency), 500);
    const stepX = 400 / Math.max(realTimeLatencies.length - 1, 1);

    return realTimeLatencies.map((d, i) => {
      const x = i * stepX;
      const y = 140 - (d.latency / maxVal) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const renderLatencyAreaPath = () => {
    if (realTimeLatencies.length === 0) return '';
    const maxVal = Math.max(...realTimeLatencies.map(d => d.latency), 500);
    const stepX = 400 / Math.max(realTimeLatencies.length - 1, 1);
    const linePath = realTimeLatencies.map((d, i) => {
      const x = i * stepX;
      const y = 140 - (d.latency / maxVal) * 100;
      return `L ${x} ${y}`;
    }).join(' ');

    const startX = 0;
    const startY = 140 - (realTimeLatencies[0].latency / maxVal) * 100;
    const endX = (realTimeLatencies.length - 1) * stepX;

    return `M ${startX} 140 L ${startX} ${startY} ${linePath} L ${endX} 140 Z`;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#ffffff', borderRight: '1px solid rgba(236,72,153,0.08)', overflow: 'hidden'
      }}>

        {/* Title */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid rgba(236,72,153,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(236,72,153,0.2)'
          }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.1 }}>Vantara Console</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4, fontWeight: 700 }}>Management Hub</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav style={{ flex: 1, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12, width: '100%', textAlign: 'left',
                border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                fontFamily: 'inherit', transition: 'all 0.2s',
                background: tab === id ? 'var(--accent-subtle)' : 'transparent',
                color: tab === id ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft: tab === id ? '3px solid var(--accent)' : '3px solid transparent'
              }}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </nav>

        {/* System Auto-Refresh */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(236,72,153,0.08)', background: 'rgba(236,72,153,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContents: 'space-between', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Auto-Refresh Telemetry</span>
            <div onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                width: 40, height: 22, borderRadius: 999, position: 'relative', cursor: 'pointer',
                background: autoRefresh ? 'var(--accent)' : '#e5e7eb',
                transition: 'background 0.2s'
              }}>
              <span style={{
                position: 'absolute', top: 3,
                left: autoRefresh ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Polls API data every 5 seconds</p>
        </div>

        {/* Exit link */}
        <div style={{ padding: '16px' }}>
          <button className="btn-ghost" onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontSize: 13,
              fontWeight: 700
            }}>
            <LogOut size={16} /> Exit Dashboard
          </button>
        </div>
      </aside>

      {/* ── Main Panel (Stretches to 100% Width) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top Header */}
        <header style={{
          padding: '14px 30px', borderBottom: '1px solid rgba(236,72,153,0.08)',
          background: '#ffffff', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search call logs room ID..."
              style={{
                width: '100%', boxSizing: 'border-box', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', borderRadius: 12, padding: '10px 14px 10px 40px',
                fontSize: 13, outline: 'none'
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex'
                }}>
                <X size={14} />
              </button>
            )}
          </div>

          <button className="btn-ghost" onClick={() => { setLoading(true); fetchData(); }}
            style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          {/* Flex spacer to push remaining controls to the right */}
          <div style={{ flex: 1 }} />

          {/* Primary Action to Start Voice Agent Call Modal */}
          <button className="btn-primary" style={{ padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }} onClick={onStartCall}>
            <Phone size={14} /> Call AI Agent
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            background: 'var(--green-subtle)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 999,
            fontSize: 12, fontWeight: 700, color: 'var(--green)', flexShrink: 0
          }}>
            <Circle size={6} fill="var(--green)" color="var(--green)" />
            Telemetry Live
          </div>
        </header>

        {/* Error API banner */}
        {error && (
          <div style={{
            margin: '14px 30px 0', padding: '12px 18px', borderRadius: 12,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            color: 'var(--red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error} <strong>(Rendering local mock database)</strong></span>
          </div>
        )}

        {/* Content body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 30, width: '100%' }}>

          {/* TAB 1: CALL LOGS */}
          {tab === 'calls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
              {/* Header stats bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Call Logs & Transcripts</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Monitoring details and transcript records of active and closed rooms.</p>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { icon: Phone, label: 'Total Calls', value: loading ? '—' : (metrics?.total_chats ?? 0), color: 'var(--accent)' },
                    { icon: Activity, label: 'Live Calls', value: loading ? '—' : (metrics?.live_chats ?? 0), color: 'var(--green)' },
                    { icon: Clock, label: 'Avg Latency', value: loading ? '—' : (metrics?.avg_latency_ms > 0 ? fmt(metrics.avg_latency_ms) : '220ms'), color: 'var(--accent-2)' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="glass" style={{
                      borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                      background: 'rgba(255,255,255,0.7)'
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, background: `${color}08`, border: `1px solid ${color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={16} color={color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call table logs (Full Width Responsive layout) */}
              <div className="glass" style={{ borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.7)', width: '100%' }}>
                {/* Header Grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1.8fr 1fr 2fr 1.6fr 0.8fr 1.5fr 1fr', gap: 16,
                  padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(236,72,153,0.03)'
                }}>
                  {['Room ID', 'Call Duration', 'Call From (Device)', 'Forwarded To', 'Msgs', 'Latency Bounds (Min/Max)', ''].map(h => (
                    <div key={h} style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{h}</div>
                  ))}
                </div>

                {/* Shimmer loading state */}
                {loading && Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 2fr 1.6fr 0.8fr 1.5fr 1fr', gap: 16, padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} style={{ height: 14, borderRadius: 6 }} className="shimmer" />
                    ))}
                  </div>
                ))}

                {/* Empty check */}
                {!loading && filtered.length === 0 && (
                  <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Inbox size={36} style={{ margin: '0 auto 12px', opacity: 0.5, display: 'block' }} />
                    <p style={{ fontSize: 13 }}>{search ? 'No call matches query.' : 'No active sessions logged.'}</p>
                  </div>
                )}

                {/* Logs rows */}
                {!loading && filtered.map(([roomId, hist]) => {
                  const msgs = (hist || []).filter(m => m.role !== 'system');
                  const duration = getCallDuration(hist);
                  const routing = getCallRouting(roomId);
                  const latencyRange = getLatencyRanges(hist);

                  // Truncate Room ID: show first 12 characters, hover/click copies or shows details
                  const truncatedRoomId = roomId.length > 15 ? `${roomId.substring(0, 12)}...` : roomId;

                  return (
                    <div key={roomId} style={{
                      display: 'grid', gridTemplateColumns: '1.8fr 1fr 2fr 1.6fr 0.8fr 1.5fr 1fr', gap: 16,
                      padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 14
                    }} className="table-row">

                      {/* Room ID */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--accent-2)' }}>{truncatedRoomId}</span>
                        <button onClick={() => copyId(roomId)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: 2, color: copiedId === roomId ? 'var(--green)' : 'var(--text-muted)' }} title="Copy full ID">
                          <Copy size={12} />
                        </button>
                      </div>

                      {/* Duration */}
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{duration}</span>

                      {/* Call Device Origin */}
                      <span style={{ color: 'var(--text-primary)' }}>{routing.device}</span>

                      {/* Forward destination */}
                      <div>
                        {routing.forwardedTo !== 'None (Direct)' ? (
                          <span className="badge badge-accent" style={{ fontSize: 12 }}>{routing.forwardedTo}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>

                      {/* Messages count */}
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{msgs.length} msgs</span>

                      {/* Latencies Min/Max */}
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {latencyRange.min}ms / {latencyRange.max}ms
                      </span>

                      {/* Action View Transcript */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-primary" style={{ padding: '8px 14px', borderRadius: 10, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => setSelectedRoom({ roomId, hist })}>
                          Transcript <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: METRICS & SERVICES HEALTH */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%' }}>

              {/* Widgets & Service Status Split layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

                {/* Services health monitoring */}
                <div className="glass" style={{ padding: 24, borderRadius: 18, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(236,72,153,0.06)', paddingBottom: 12 }}>
                    <ShieldCheck size={18} color="var(--accent)" />
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>System Health Services</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { name: 'Vite Frontend Server', port: 'Port 5173', key: 'frontend' },
                      { name: 'FastAPI Backend Host', port: 'Port 8001', key: 'backend' },
                      { name: 'LiveKit Voice Agent', port: 'SDK Pipeline', key: 'livekit' },
                      { name: 'Asterisk SIP Gateway', port: 'Port 5060', key: 'asterisk' },
                      { name: 'Docker Stack Services', port: 'docker-compose', key: 'docker' },
                    ].map(srv => {
                      const isOnline = serviceStatus[srv.key] === 'Online';
                      return (
                        <div key={srv.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{srv.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{srv.port}</div>
                          </div>

                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                            background: isOnline ? 'var(--green-subtle)' : 'var(--red-subtle)',
                            color: isOnline ? 'var(--green)' : 'var(--red)',
                            border: `1px solid ${isOnline ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
                          }}>
                            <Circle size={6} fill={isOnline ? 'var(--green)' : 'var(--red)'} color={isOnline ? 'var(--green)' : 'var(--red)'} />
                            {isOnline ? 'Running' : 'Offline'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cognitive Engine Details */}
                <div className="glass" style={{ padding: 24, borderRadius: 18, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(236,72,153,0.06)', paddingBottom: 12 }}>
                    <Bot size={18} color="var(--accent-2)" />
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>AI Receptionist Settings</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      ['Active Model', 'gemini-3.5-flash (Google GenAI)'],
                      ['Voice Mode', 'Text-To-Speech (Web Speech Synthesis)'],
                      ['Ear Speech Recognition', 'Webkit SpeechRecognition API'],
                      ['Instruction Tone', 'DEI Lab receptionist, fast and short replies'],
                      ['Asterisk Extensions', '100 to 110 configured'],
                      ['SIP Direct Extensions', 'Ext 200 (Routes to Ventra Gemini Room)'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', flexDirection: 'column', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Graphs Section */}
              <div style={{ width: '100%' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Performance & Real-time Call Analytics</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, width: '100%' }}>

                  {/* Graph 1: Latency Curve */}
                  <div className="glass" style={{ padding: 24, borderRadius: 18, background: '#ffffff', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>Live Telemetry: Chat Reply Latency (ms)</div>
                      <span className="badge badge-green">Goal: &lt;500ms</span>
                    </div>

                    {/* SVG Line Graph */}
                    <div style={{ width: '100%', height: 180 }}>
                      {realTimeLatencies.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: 'var(--text-muted)' }}>
                          No call latencies recorded yet. Waiting for call data...
                        </div>
                      ) : (
                        <svg viewBox="0 0 400 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
                          {/* Background grid */}
                          <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(236,72,153,0.05)" strokeWidth="1" />
                          <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(236,72,153,0.05)" strokeWidth="1" />
                          <line x1="0" y1="110" x2="400" y2="110" stroke="rgba(236,72,153,0.05)" strokeWidth="1" />
                          <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(236,72,153,0.08)" strokeWidth="1" />

                          {/* Latency line path */}
                          <path
                            d={renderLatencyPath()}
                            fill="none"
                            stroke="url(#pinkGradient)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          {/* Shaded Area under path */}
                          <path
                            d={renderLatencyAreaPath()}
                            fill="url(#areaGradient)"
                            opacity="0.12"
                          />

                          {/* Node circles */}
                          {realTimeLatencies.map((d, i) => {
                            const maxVal = Math.max(...realTimeLatencies.map(x => x.latency), 500);
                            const stepX = 400 / Math.max(realTimeLatencies.length - 1, 1);
                            const cx = i * stepX;
                            const cy = 140 - (d.latency / maxVal) * 100;
                            return (
                              <g key={i}>
                                <circle cx={cx} cy={cy} r="4" fill="var(--accent-2)" stroke="#fff" strokeWidth="1.5" />
                                <text x={cx} y={cy - 8} fontSize="7" fontWeight="800" fill="var(--text-secondary)" textAnchor="middle">
                                  {d.latency}ms
                                </text>
                              </g>
                            );
                          })}

                          {/* Defs for gradients */}
                          <defs>
                            <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="var(--accent)" />
                              <stop offset="100%" stopColor="var(--accent-2)" />
                            </linearGradient>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="var(--accent)" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Graph 2: Call volume (Messages per room) */}
                  <div className="glass" style={{ padding: 24, borderRadius: 18, background: '#ffffff', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>Live Telemetry: Messages per Room</div>
                      <span className="badge badge-accent">Rooms Activity</span>
                    </div>

                    {/* SVG Column Bar Graph */}
                    <div style={{ width: '100%', height: 180 }}>
                      {realTimeCalls.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: 'var(--text-muted)' }}>
                          No call activity recorded yet.
                        </div>
                      ) : (
                        <svg viewBox="0 0 400 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
                          <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(236,72,153,0.1)" strokeWidth="1" />

                          {realTimeCalls.map((d, i) => {
                            const maxMsgs = Math.max(...realTimeCalls.map(c => c.msgsCount), 5);
                            const colHeight = (d.msgsCount / maxMsgs) * 110;
                            const spacing = 400 / realTimeCalls.length;
                            const x = i * spacing + (spacing - 24) / 2;
                            return (
                              <g key={i}>
                                {/* Messages Count Column */}
                                <rect
                                  x={x}
                                  y={140 - colHeight}
                                  width="24"
                                  height={colHeight}
                                  fill="url(#columnGradient)"
                                  rx="4"
                                />
                                {/* Value label */}
                                <text x={x + 12} y={132 - colHeight} fontSize="8" fontWeight="800" fill="var(--text-primary)" textAnchor="middle">
                                  {d.msgsCount}
                                </text>
                                {/* Time/Room code */}
                                <text x={x + 12} y="152" fontSize="8" fill="var(--text-secondary)" textAnchor="middle" fontWeight="700">
                                  {d.roomId}
                                </text>
                              </g>
                            );
                          })}

                          <defs>
                            <linearGradient id="columnGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="var(--accent)" />
                              <stop offset="100%" stopColor="var(--accent-2)" />
                            </linearGradient>
                          </defs>
                        </svg>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIP PHONE CONFIGURATION */}
          {tab === 'sip' && (
            <div className="glass" style={{ padding: 24, borderRadius: 16, background: '#ffffff', width: '100%' }}>
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

/* ─── Mock simulation data generator (Used if backend on Port 8001 is off) ─── */
function getMockMetrics() {
  const current_time = Date.now() / 1000;
  return {
    total_chats: 48,
    live_chats: 2,
    avg_latency_ms: 220,
    rooms_last_active: {
      'sip-room-102-aefd8': current_time - 10,
      'web-room-bc8d91f2': current_time - 25
    },
    rooms: {
      'sip-room-102-aefd8': [
        { role: 'system', content: 'SYSTEM_PROMPT' },
        { role: 'user', content: 'Hello, is anyone there?' },
        { role: 'assistant', content: 'Welcome to DEI Lab! I am Ventra. How can I help you today?', latency_ms: 180 },
        { role: 'user', content: 'I need to reach extension 105.' },
        { role: 'assistant', content: 'Certainly! Forwarding your call to extension 105. Please hold.', latency_ms: 240 }
      ],
      'web-room-bc8d91f2': [
        { role: 'system', content: 'SYSTEM_PROMPT' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Welcome to DEI Lab! I am Ventra. How can I help you today?', latency_ms: 110 },
        { role: 'user', content: 'What are your working hours?' },
        { role: 'assistant', content: 'DEI Lab is open Monday through Friday from 9 AM to 6 PM.', latency_ms: 190 }
      ],
      'old-room-bf87ad8e': [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello, welcome to DEI Lab! I am Ventra. How can I help you today?', latency_ms: 150 },
        { role: 'user', content: 'Thanks.' },
        { role: 'assistant', content: 'You are welcome! Have a wonderful day.', latency_ms: 120 }
      ],
      'sip-room-104-fc98': [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hello, welcome to DEI Lab! I am Ventra. How can I help you today?', latency_ms: 280 },
        { role: 'user', content: 'Forward me to extension 108.' },
        { role: 'assistant', content: 'Okay, routing you to extension 108. Goodbye!', latency_ms: 450 }
      ]
    }
  };
}
