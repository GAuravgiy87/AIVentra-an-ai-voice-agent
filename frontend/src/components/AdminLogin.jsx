import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldCheck, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onBack }) {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { onLoginSuccess(); }
      else {
        const n = attempts + 1;
        setAttempts(n);
        setError(n >= 3 ? `Invalid passcode. ${n} failed attempts.` : 'Invalid passcode. Please try again.');
        setPassword('');
      }
    } catch {
      setError('Cannot reach server. Ensure the backend is running on port 8001.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      {/* Back */}
      <div style={{ padding: '20px 28px' }}>
        <button style={S.backBtn} onClick={onBack}>
          <ArrowLeft size={15} /> Back to Home
        </button>
      </div>

      {/* Centered card */}
      <div style={S.centerWrap}>
        <div style={S.card}>

          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={S.iconRing}>
              <div style={S.iconBox}><ShieldCheck size={30} color="#fff" /></div>
            </div>
            <h1 style={S.title}>Admin Portal</h1>
            <p style={S.subtitle}>Authenticate to access live metrics,<br />call logs, and system controls.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Master Passcode</label>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <span style={S.inputIcon}><Lock size={15} color="#5c5c74" /></span>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter passcode…"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                style={S.input}
                autoFocus
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={S.eyeBtn} tabIndex={-1}>
                {showPass ? <EyeOff size={15} color="#5c5c74" /> : <Eye size={15} color="#5c5c74" />}
              </button>
            </div>

            {error && (
              <div style={S.errorMsg}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{ ...S.submitBtn, ...(loading || !password.trim() ? S.submitDisabled : {}) }}
            >
              {loading
                ? <><span style={S.spinner} /> Authenticating…</>
                : <>Unlock Dashboard <ArrowRight size={15} /></>}
            </button>
          </form>

          {/* Footer note */}
          <div style={S.cardFooter}>
            <p>Default passcode: <code style={{ color: '#818cf8', fontWeight: 700 }}>admin123</code></p>
            <p style={{ marginTop: 4 }}>Ventra AI · DEI Lab Admin · {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%), #050508',
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#f1f1f5',
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: '#9494a8', padding: '7px 14px', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
  },
  centerWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 24px 60px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'rgba(22,22,31,0.9)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: '36px 36px 28px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  iconRing: {
    display: 'flex', justifyContent: 'center', marginBottom: 18,
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 18,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 32px rgba(99,102,241,0.35)',
  },
  title: { fontSize: 22, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { fontSize: 13, color: '#9494a8', lineHeight: 1.6, margin: 0 },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#9494a8', textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 8, marginTop: 20,
  },
  inputIcon: {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)', pointerEvents: 'none',
    display: 'flex',
  },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: '#0e0e14', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f1f5', borderRadius: 12,
    padding: '13px 44px 13px 40px',
    fontSize: 14, fontFamily: 'inherit',
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 4,
  },
  errorMsg: {
    display: 'flex', alignItems: 'flex-start', gap: 6,
    color: '#f87171', fontSize: 12, fontWeight: 500, marginBottom: 12,
    marginTop: 6,
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', marginTop: 20,
    padding: '14px', borderRadius: 12,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff', fontWeight: 600, fontSize: 14,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 0 24px rgba(99,102,241,0.3)',
    transition: 'opacity 0.2s',
  },
  submitDisabled: { opacity: 0.45, cursor: 'not-allowed', boxShadow: 'none' },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  cardFooter: {
    marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)',
    textAlign: 'center', fontSize: 12, color: '#5c5c74',
  },
};
