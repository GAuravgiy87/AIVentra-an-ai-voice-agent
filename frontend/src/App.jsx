import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import VoiceAgent from './components/VoiceAgent';
import { Bot, ShieldCheck, Mic, Zap, Phone, ArrowRight, Sparkles, Globe, Cpu } from 'lucide-react';

/* ─────────────────────────────────────────
   Background Animated Blobs Wrapper
   ───────────────────────────────────────── */
function PageBackground({ children }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      <div className="animated-bg">
        <div className="blob blob-pink"></div>
        <div className="blob blob-purple"></div>
        <div className="blob blob-peach"></div>
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Landing Page (Homepage)
   ───────────────────────────────────────── */
function LandingPage({ showRoomId = null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/rooms`, { method: 'POST' });
      const data = await res.json();
      navigate(`/room/${data.room_id}`);
    } catch {
      // Fallback room ID if backend is down for offline client simulation
      const fallbackId = 'demo-room-' + Math.random().toString(36).substring(2, 9);
      navigate(`/room/${fallbackId}`);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Mic,
      title: 'Human-like Voice',
      desc: 'Speak completely naturally. AI Voice Agent understands language nuance and responds in real time.',
      color: '#ec4899'
    },
    {
      icon: Zap,
      title: 'Ultra Low Latency',
      desc: 'Powered by Gemini models for rapid-fire answers in less than a second.',
      color: '#8b5cf6'
    },
    {
      icon: Phone,
      title: 'SIP Trunking Ready',
      desc: 'Connect Asterisk, hardware IP deskphones, or softphones directly. Just call extension 200.',
      color: '#db2777'
    },
    {
      icon: Globe,
      title: 'Always Active Reception',
      desc: '24/7 client onboarding, support ticket routing, and conversational FAQs for your enterprise.',
      color: '#7c3aed'
    },
  ];

  const stats = [
    { value: '11+', label: 'Active Extensions' },
    { value: '<600ms', label: 'Response Latency' },
    { value: '99.99%', label: 'System Uptime' },
    { value: 'Full Duplex', label: 'Voice Mode' },
  ];

  const services = [
    { title: 'Automated Call Routing', desc: 'Identifies incoming intent, hooks into your extensions database, and forwards calls to departments automatically.' },
    { title: 'Interactive Ingestion', desc: 'Feed AI Voice Agent your system handbooks, directories, or scripts, and it instantly responds with correct info.' },
    { title: 'Multi-device Softphones', desc: 'SIP profile generation permits instant registration with popular clients like Linphone, Microsip, and hardware systems.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Navbar */}
      <nav style={{ padding: '0 30px', borderBottom: '1px solid rgba(236,72,153,0.08)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ width: '100%', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.25)'
            }}>
              <Bot size={20} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              AI Voice <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Agent</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            {localStorage.getItem('ventra_user_role') ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Hello, {localStorage.getItem('ventra_user_name')}
                </span>
                <button className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }} onClick={() => {
                  const role = localStorage.getItem('ventra_user_role');
                  navigate(role === 'super_admin' || role === 'company_admin' ? '/admin' : '/dashboard');
                }}>
                  Dashboard
                </button>
                <button className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }} onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button className="btn-ghost" style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/login')}>
                <ShieldCheck size={16} />
                <span>Login / Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: '60px 24px', width: '100%' }}>
        {/* Hero Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 60 }}>
          <div className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <Sparkles size={12} />
            <span>AI Voice Agent V1.0 · Developed by Gaurav Chauhan</span>
          </div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 20, maxWidth: 800 }}>
            Your Intelligent <span style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Voice Receptionist</span> is Ready
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 600, lineHeight: 1.7, marginBottom: 36 }}>
            AI Voice Agent handles business phone lines, answers queries instantly, manages customer bookings, and routes calls seamlessly over SIP. Click below to initiate a voice call directly.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '14px 32px', borderRadius: 14, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={startRoom} disabled={loading}>
              {loading
                ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pulse-dot 1s linear infinite' }} /> Establishing Link...</>
                : <><Bot size={18} /> Initiate Voice Call <ArrowRight size={16} /></>
              }
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 60 }}>
          {stats.map((s, idx) => (
            <div key={idx} className="stat-card" style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-2)', fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Services & Description */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40, color: 'var(--text-primary)' }}>
            Core Conversational Services
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {services.map((ser, i) => (
              <div key={i} className="glass" style={{ padding: 28, borderRadius: 16, background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-2)'
                }}>
                  <Cpu size={18} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{ser.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ser.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 30 }}>
          {features.map(({ icon: Icon, title, desc, color }, idx) => (
            <div key={idx} className="glass" style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(236,72,153,0.1)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, backgroundColor: `${color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                border: `1px solid ${color}20`
              }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(236,72,153,0.08)', padding: '24px', background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContents: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
        <span>© 2026 DEI Lab · AI Voice Agent System (Developed by Gaurav Chauhan) · Powered by Google Gemini</span>
      </footer>

      {/* Call Overlay Modal */}
      {showRoomId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(31, 26, 40, 0.4)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContents: 'center', justifyContent: 'center', padding: 16
        }}>
          {/* Half screen popup modal, responsive size */}
          <div className="glass-strong msg-in" style={{
            width: '100%', maxWidth: 600, height: '80vh', minHeight: 520,
            borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(139, 92, 246, 0.15)'
          }}>
            <VoiceAgent roomId={showRoomId} onLeave={() => navigate('/')} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Wrappers ─── */
function LoginWrapper() { 
  const n = useNavigate(); 
  return (
    <PageBackground>
      <Login 
        onLoginSuccess={(user) => {
          localStorage.setItem('ventra_token', user.token || '');
          localStorage.setItem('ventra_user_role', user.role);
          localStorage.setItem('ventra_user_id', user.id);
          localStorage.setItem('ventra_user_name', user.name);
          localStorage.setItem('ventra_company_id', user.company_id !== null && user.company_id !== undefined ? String(user.company_id) : '');
          if (user.role === 'super_admin' || user.role === 'company_admin') {
            n('/admin');
          } else {
            n('/dashboard');
          }
        }} 
        onBack={() => n('/')} 
      />
    </PageBackground>
  ); 
}
function AdminDashboardWrapper() { const n = useNavigate(); return <PageBackground><AdminDashboard onBack={() => n('/')} /></PageBackground>; }
function UserDashboardWrapper() { const n = useNavigate(); return <PageBackground><UserDashboard onBack={() => n('/')} /></PageBackground>; }
function VoiceAgentOverlay() { const { roomId } = useParams(); return <LandingPage showRoomId={roomId} />; }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageBackground><LandingPage /></PageBackground>} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/admin" element={<AdminDashboardWrapper />} />
        <Route path="/dashboard" element={<UserDashboardWrapper />} />
        <Route path="/room/:roomId" element={<PageBackground><VoiceAgentOverlay /></PageBackground>} />
      </Routes>
    </BrowserRouter>
  );
}
