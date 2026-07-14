import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import VoiceAgent from './components/VoiceAgent';
import { Bot, ShieldCheck, Mic, Zap, Phone, ArrowRight, Sparkles, Globe } from 'lucide-react';

/* ─────────────────────────────────────────
   Landing Page
───────────────────────────────────────── */
function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startRoom = async () => {
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:8001/api/rooms', { method: 'POST' });
      const data = await res.json();
      navigate(`/room/${data.room_id}`);
    } catch {
      alert('Backend not reachable. Make sure the FastAPI server is running on port 8001.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Mic,   title: 'Voice Enabled',   desc: 'Speak naturally — Ventra listens and responds in real time.' },
    { icon: Zap,   title: 'Low Latency',      desc: 'Gemini-powered responses in milliseconds, not seconds.' },
    { icon: Phone, title: 'SIP Integration',  desc: 'Dial extension 200 from any SIP phone to connect.' },
    { icon: Globe, title: 'Always Available', desc: '24/7 AI receptionist for your organisation.' },
  ];

  const stats = [
    { value: '11',    label: 'SIP Extensions' },
    { value: '<1s',   label: 'Avg Response' },
    { value: '24/7',  label: 'Uptime' },
    { value: 'G.711', label: 'Audio Codec' },
  ];

  return (
    <div style={S.page}>
      {/* Navbar */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navLogo}>
            <div style={S.logoIcon}><Bot size={18} color="#fff" /></div>
            <span style={S.logoText}>Ventra <span style={{ color: '#818cf8' }}>AI</span></span>
          </div>
          <button style={S.ghostBtn} onClick={() => navigate('/admin/login')}>
            <ShieldCheck size={15} />
            <span>Admin Portal</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main style={S.main}>
        <div style={S.heroWrap}>

          {/* Badge */}
          <div style={S.badge}>
            <Sparkles size={12} />
            <span>Powered by Google Gemini · DEI Lab</span>
          </div>

          {/* Heading */}
          <h1 style={S.h1}>
            Your AI Voice<br />
            <span style={S.h1Grad}>Assistant is Ready</span>
          </h1>

          <p style={S.sub}>
            Ventra handles your calls, answers questions, and connects callers — all without lifting a finger.
            Start a conversation or dial in via SIP.
          </p>

          {/* CTA */}
          <div style={S.ctaRow}>
            <button style={S.primaryBtn} onClick={startRoom} disabled={loading}>
              {loading
                ? <><span style={S.spinner} /> Creating room…</>
                : <><Bot size={17} /> Start Conversation <ArrowRight size={15} /></>}
            </button>
            <button style={S.ghostBtn2} onClick={() => navigate('/admin/login')}>
              <ShieldCheck size={17} /> Admin Dashboard
            </button>
          </div>

          {/* Stats */}
          <div style={S.statsGrid}>
            {stats.map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={S.statValue}>{s.value}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={S.featGrid}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={S.featCard}>
                <div style={S.featIcon}><Icon size={17} color="#818cf8" /></div>
                <div>
                  <div style={S.featTitle}>{title}</div>
                  <div style={S.featDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={S.footer}>
        © 2026 DEI Lab · Ventra AI Voice Agent · Backend on{' '}
        <code style={{ color: '#818cf8', fontSize: 11 }}>localhost:8001</code>
      </footer>
    </div>
  );
}

/* ─── Styles ─── */
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), #050508',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#f1f1f5',
  },
  nav: {
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    padding: '0 24px',
  },
  navInner: {
    maxWidth: 900,
    margin: '0 auto',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 34, height: 34, borderRadius: 10,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 16px rgba(99,102,241,0.3)',
  },
  logoText: { fontWeight: 700, fontSize: 17 },
  ghostBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: '#9494a8', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '60px 24px 40px',
    overflowY: 'auto',
  },
  heroWrap: {
    width: '100%',
    maxWidth: 640,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
    color: '#a5b4fc', borderRadius: 999,
    padding: '5px 14px', fontSize: 12, fontWeight: 600,
    marginBottom: 24,
  },
  h1: {
    fontSize: 52, fontWeight: 800, lineHeight: 1.15,
    margin: '0 0 18px', letterSpacing: '-0.02em',
  },
  h1Grad: {
    background: 'linear-gradient(90deg,#818cf8,#a78bfa,#c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  sub: {
    color: '#9494a8', fontSize: 16, lineHeight: 1.7,
    maxWidth: 500, margin: '0 auto 36px',
  },
  ctaRow: {
    display: 'flex', gap: 12, marginBottom: 44,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px', borderRadius: 12,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff', fontWeight: 600, fontSize: 14,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 0 24px rgba(99,102,241,0.35)',
    transition: 'all 0.2s',
  },
  ghostBtn2: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px', borderRadius: 12,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
    color: '#9494a8', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,0.25)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    gap: 12, width: '100%', marginBottom: 16,
  },
  statCard: {
    background: 'rgba(28,28,40,0.8)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '16px 8px', textAlign: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 700, color: '#818cf8', lineHeight: 1 },
  statLabel: { fontSize: 10, color: '#5c5c74', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  featGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2,1fr)',
    gap: 12, width: '100%', marginTop: 12,
  },
  featCard: {
    background: 'rgba(28,28,40,0.8)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left',
  },
  featIcon: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  featTitle: { fontWeight: 600, fontSize: 13, color: '#f1f1f5', marginBottom: 4 },
  featDesc:  { fontSize: 12, color: '#9494a8', lineHeight: 1.6 },
  footer: {
    textAlign: 'center', padding: '20px 24px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    fontSize: 12, color: '#5c5c74',
  },
};

/* ─── Wrappers ─── */
function AdminLoginWrapper()     { const n = useNavigate(); return <AdminLogin onLoginSuccess={() => n('/admin')} onBack={() => n('/')} />; }
function AdminDashboardWrapper() { const n = useNavigate(); return <AdminDashboard onBack={() => n('/')} />; }
function VoiceAgentWrapper()     { const { roomId } = useParams(); const n = useNavigate(); return <VoiceAgent roomId={roomId} onLeave={() => n('/')} />; }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<LandingPage />} />
        <Route path="/admin/login"  element={<AdminLoginWrapper />} />
        <Route path="/admin"        element={<AdminDashboardWrapper />} />
        <Route path="/room/:roomId" element={<VoiceAgentWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}
