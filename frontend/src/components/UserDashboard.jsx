import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Search, LogOut, RefreshCw, X, MessageSquare,
  Activity, Clock, Phone, ShieldCheck, ChevronRight, Inbox, Plus, Laptop, Smartphone, Copy, BarChart2
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
            <button className="btn-ghost" style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={exportTxt} title="Export Transcript"><Copy size={15} /></button>
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

/* ═══ Main User Dashboard ═══ */
export default function UserDashboard({ onBack }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem('ventra_user_id') || '';
  const userName = localStorage.getItem('ventra_user_name') || 'User';

  const [metrics, setMetrics] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tab, setTab] = useState(() => localStorage.getItem('ventra_user_tab') || 'devices'); // 'devices', 'calls'
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    if (tab) {
      localStorage.setItem('ventra_user_tab', tab);
    }
  }, [tab]);

  // Device Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExt, setNewExt] = useState('');
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('192.168.1.');
  const [newType, setNewType] = useState('Softphone');

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1500);
    });
  };

  const fetchDashboardData = useCallback(async () => {
    if (!userId || document.hidden) return;
    try {
      // 1. Fetch user devices
      const devRes = await fetch(`http://${window.location.hostname}:8001/api/user/devices?user_id=${userId}`, { headers: { "Authorization": `Bearer ${localStorage.getItem("ventra_token")}` } });
      if (!devRes.ok) throw new Error();
      const devData = await devRes.json();
      setDevices(devData.devices || []);

      // 2. Fetch call metrics and logs
      const metRes = await fetch(`http://${window.location.hostname}:8001/api/user/dashboard?user_id=${userId}`, { headers: { "Authorization": `Bearer ${localStorage.getItem("ventra_token")}` } });
      if (!metRes.ok) throw new Error();
      const metData = await metRes.json();
      setMetrics(metData);
      setError('');
    } catch (err) {
      setError('Could not connect to database API. Showing empty state.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Telemetry auto-polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newExt.trim() || !newName.trim()) return;

    if (devices.some(d => d.extension === newExt.trim())) {
      alert('Extension is already in use by another device.');
      return;
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/user/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` },
        body: JSON.stringify({
          user_id: userId,
          name: newName.trim(),
          ip_address: newIp.trim(),
          extension: newExt.trim(),
          type: newType,
          status: 'Online'
        })
      });
      if (res.ok) {
        setNewExt('');
        setNewName('');
        setNewIp('192.168.1.');
        setShowAddForm(false);
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to add device');
      }
    } catch {
      alert('Error connecting to backend');
    }
  };

  const handleDeleteDevice = async (id, ext) => {
    if (!window.confirm(`Are you sure you want to remove device extension ${ext}?`)) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/user/devices/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` } });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch {
      alert('Error deleting device');
    }
  };

  // Filtered call logs
  const roomsList = metrics?.rooms ? Object.entries(metrics.rooms) : [];
  const filteredRooms = roomsList.filter(([roomId, hist]) => {
    if (!search.trim()) return true;
    return roomId.toLowerCase().includes(search.toLowerCase());
  });

  const getCallDuration = (hist) => {
    const times = (hist || []).map(m => m.timestamp).filter(Boolean);
    if (times.length < 2) return '0:12';
    const diff = Math.max(...times) - Math.min(...times);
    const m = Math.floor(diff / 60);
    const s = Math.floor(diff % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/');
  };

  const TABS = [
    { id: 'devices', label: 'My Devices', icon: Smartphone },
    { id: 'calls', label: 'My Call History', icon: Phone },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      
      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#ffffff', borderRight: '1px solid rgba(236,72,153,0.08)', overflow: 'hidden'
      }}>
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
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.1 }}>User Portal</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4, fontWeight: 700 }}>{userName}</div>
          </div>
        </div>

        {/* Navigation */}
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

        {/* Auto Refresh */}
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(236,72,153,0.08)', background: 'rgba(236,72,153,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Auto-Refresh</span>
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
        </div>

        {/* Exit & Sign Out */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            Back to Home
          </button>
          <button className="btn-ghost" onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        {/* Top Header */}
        <header style={{
          padding: '14px 30px', borderBottom: '1px solid rgba(236,72,153,0.08)',
          background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Welcome, <span style={{ color: 'var(--accent)' }}>{userName}</span>
          </h2>
          <button className="btn-ghost" onClick={() => { setLoading(true); fetchDashboardData(); }} style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </header>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 30, width: '100%' }}>
          
          {/* TAB: DEVICES */}
          {tab === 'devices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>My SIP Phones / Devices ({devices.length})</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Add and configure your deskphones or softphones to receive and log AI calls.</p>
                </div>
                <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus size={16} /> Add Device
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddDevice} className="glass" style={{ padding: 24, borderRadius: 16, background: '#ffffff', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Register New Terminal</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Device Extension *</label>
                      <input type="text" value={newExt} onChange={e => setNewExt(e.target.value)} placeholder="e.g. 101" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Device Friendly Name *</label>
                      <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Living Room Deskphone" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }} required />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>IP Bind Address</label>
                      <input type="text" value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.x" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Device Type</label>
                      <select value={newType} onChange={e => setNewType(e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: '#fff' }}>
                        <option value="Softphone">Softphone Client</option>
                        <option value="IP Deskphone">IP Hardware Deskphone</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" className="btn-ghost" style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13 }} onClick={() => setShowAddForm(false)}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13 }}>Register Phone</button>
                  </div>
                </form>
              )}

              {/* Devices Grid List */}
              <div className="glass" style={{ borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.7)', width: '100%' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 2.5fr 2fr 2fr 1fr', gap: 12,
                  padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(236,72,153,0.03)'
                }}>
                  {['Extension', 'Device Name', 'IP Bind Address', 'Device Type', ''].map(h => (
                    <div key={h} style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{h}</div>
                  ))}
                </div>

                {devices.length === 0 && (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No devices registered. Click "Add Device" to get started.
                  </div>
                )}

                {devices.map((dev) => (
                  <div key={dev.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 2.5fr 2fr 2fr 1fr', gap: 12,
                    padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, alignItems: 'center'
                  }} className="table-row">
                    <span style={{ fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'monospace' }}>{dev.extension}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dev.name}</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{dev.ip_address || '—'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {dev.type === 'IP Deskphone' ? <Laptop size={14} color="var(--accent-2)" /> : <Smartphone size={14} color="var(--accent)" />}
                      <span>{dev.type}</span>
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDeleteDevice(dev.id, dev.extension)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 13, fontWeight: 700 }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CALL LOGS & TRANSCRIPTS */}
          {tab === 'calls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Header stats bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>My Call Transcripts</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Real-time transcription history for your registered extensions.</p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { icon: Phone, label: 'Total Calls', value: metrics?.total_chats ?? 0, color: 'var(--accent)' },
                    { icon: Activity, label: 'Live Calls', value: metrics?.live_chats ?? 0, color: 'var(--green)' },
                    { icon: Clock, label: 'Avg Latency', value: metrics?.avg_latency_ms > 0 ? fmt(metrics.avg_latency_ms) : '—', color: 'var(--accent-2)' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="glass" style={{ borderRadius: 14, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.7)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} color={color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', maxWidth: 360 }}>
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
              </div>

              {/* Table */}
              <div className="glass" style={{ borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.7)', width: '100%' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', gap: 16,
                  padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(236,72,153,0.03)'
                }}>
                  {['Call Room ID', 'Duration', 'Messages Logged', ''].map(h => (
                    <div key={h} style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{h}</div>
                  ))}
                </div>

                {filteredRooms.length === 0 && (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Inbox size={32} style={{ margin: '0 auto 8px', opacity: 0.5, display: 'block' }} />
                    <p style={{ fontSize: 13 }}>No calls logged for your device extensions.</p>
                  </div>
                )}

                {filteredRooms.map(([roomId, hist]) => {
                  const msgs = (hist || []).filter(m => m.role !== 'system');
                  const duration = getCallDuration(hist);
                  const truncated = roomId.length > 20 ? `${roomId.substring(0, 16)}...` : roomId;

                  return (
                    <div key={roomId} style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr', gap: 16,
                      padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 14
                    }} className="table-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--accent-2)' }}>{truncated}</span>
                        <button onClick={() => copyId(roomId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === roomId ? 'var(--green)' : 'var(--text-muted)', display: 'inline-flex' }}>
                          <Copy size={12} />
                        </button>
                      </div>
                      <span style={{ fontWeight: 700 }}>{duration}</span>
                      <span>{msgs.length} msgs</span>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-primary" style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => setSelectedRoom({ roomId, hist })}>
                          View Live Transcribe <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedRoom && (
        <TranscriptModal roomId={selectedRoom.roomId} history={selectedRoom.hist} onClose={() => setSelectedRoom(null)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
