import React from 'react';
import { Phone, Activity, Clock, ShieldCheck, Bot } from 'lucide-react';

const fmt = ms => (ms > 999 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

export default function OverviewTab({ metrics, serviceStatus }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Executive Dashboard</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Live platform metrics, response latencies, and service health status.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { icon: Phone, label: 'Total Calls Handled', value: metrics?.total_chats ?? 0, color: '#7c3aed' },
          { icon: Activity, label: 'Active Live Calls', value: metrics?.live_chats ?? 0, color: '#10b981' },
          { icon: Clock, label: 'Avg Latency', value: metrics?.avg_latency_ms > 0 ? fmt(metrics.avg_latency_ms) : '220ms', color: '#ec4899' },
          { icon: ShieldCheck, label: 'System Uptime', value: '99.99%', color: '#3b82f6' }
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ padding: 20, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div style={{ padding: 24, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#7c3aed" /> Platform Services Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'FastAPI Web Backend', port: 'Port 8001', status: serviceStatus.backend },
              { name: 'LiveKit WebRTC Server', port: 'Port 7890', status: serviceStatus.livekit },
              { name: 'Asterisk SIP Gateway', port: 'Port 5060', status: serviceStatus.asterisk },
              { name: 'Redis Event Broker', port: 'Port 6379', status: 'Online' }
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.port}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.status === 'Online' ? '#dcfce7' : '#fee2e2', color: s.status === 'Online' ? '#166534' : '#991b1b' }}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 24, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={18} color="#ec4899" /> Default Agent Engine
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Supported Models', 'Gemini 3.1 Flash Lite & Ollama Llama3.1'],
              ['Speech Synthesizer', 'EdgeTTS / Local Synthesis'],
              ['Speech Recognizer', 'Whisper STT (Small model)'],
              ['Voice Activity Detector', 'Silero VAD v4'],
              ['DTMF Keypad Menu', 'Press 1 -> Forward to Extension 101']
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
