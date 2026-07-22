import React from 'react';
import { MessageSquare, Clock, Download, X } from 'lucide-react';

const fmt = ms => (ms > 999 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

export default function TranscriptModal({ roomId, history, onClose }) {
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
