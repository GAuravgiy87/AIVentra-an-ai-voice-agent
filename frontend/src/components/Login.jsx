import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Login({ onLoginSuccess, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data);
      } else {
        setError(data.detail || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Cannot contact server. Confirm the backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', zIndex: 1 }}>
      
      {/* Back to Home */}
      <div style={{ marginBottom: 16, width: '100%', maxWidth: 440, display: 'flex', justifyContent: 'flex-start' }}>
        <button className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }} onClick={onBack}>
          <ArrowLeft size={14} /> Back to Home
        </button>
      </div>

      <div className="glass msg-in" style={{
        width: '100%', maxWidth: 440, borderRadius: 24,
        padding: '40px 36px 36px', background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(236,72,153,0.15)',
        boxShadow: '0 20px 50px rgba(139, 92, 246, 0.08)'
      }}>
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)'
            }}>
              <ShieldCheck size={28} color="#fff" />
            </div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Vantara Sign In
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Sign in with your credentials to manage your SIP extensions, monitor live calls, or access the admin panel.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* User ID input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              User ID
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
                <User size={15} color="var(--text-muted)" />
              </span>
              <input
                type="text"
                placeholder="Enter User ID"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                style={{
                  width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)',
                  background: '#ffffff', color: 'var(--text-primary)', borderRadius: 12,
                  padding: '13px 14px 13px 40px', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
                <Lock size={15} color="var(--text-muted)" />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                style={{
                  width: '100%', boxSizing: 'border-box', border: '1px solid var(--border)',
                  background: '#ffffff', color: 'var(--text-primary)', borderRadius: 12,
                  padding: '13px 42px 13px 40px', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', padding: 4, color: 'var(--text-secondary)'
                }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="badge-red" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 8, fontSize: 12,
              fontWeight: 600, color: 'var(--red)'
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="btn-primary"
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              fontSize: 14, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, fontWeight: 700, marginTop: 8
            }}
          >
            {loading ? (
              <>Signing in...</>
            ) : (
              <>Sign In <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
