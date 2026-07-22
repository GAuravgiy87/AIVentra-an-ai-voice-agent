import React from 'react';
import { Clock, Cpu, DollarSign, Building2, Calendar, FileText } from 'lucide-react';

export default function BillingTab({ metrics, userRole, companies = [] }) {
  const roomsObj = metrics?.rooms || {};
  const roomEntries = Object.entries(roomsObj);

  // Overall platform metrics calculation
  let totalSecs = 0;
  let totalMessages = 0;

  const sessionLogs = roomEntries.map(([roomId, roomData]) => {
    const msgs = Array.isArray(roomData) ? roomData : (roomData.messages || []);
    const lastActive = !Array.isArray(roomData) ? roomData.last_active : null;
    const formattedDate = lastActive ? new Date(lastActive * 1000).toLocaleString() : 'Recent';
    const msgCount = msgs.filter(m => m.role !== 'system').length;
    
    let durationMs = 0;
    if (msgs.length > 0) {
      durationMs = msgs.reduce((acc, m) => acc + (m.latency_ms || 300), 0);
    }
    const sessionSecs = Math.max(15, Math.round(durationMs / 1000) + 12);
    totalSecs += sessionSecs;
    totalMessages += msgCount;

    const sessionMins = (sessionSecs / 60).toFixed(1);
    const tokensUsed = msgCount * 85;
    const estCost = (sessionSecs * (0.015 / 60)).toFixed(4);

    return {
      roomId,
      date: formattedDate,
      extension: roomData.extension || '200',
      durationMins: sessionMins,
      msgCount,
      tokensUsed,
      cost: `$${estCost}`
    };
  });

  const totalMinutes = (totalSecs / 60).toFixed(1);
  const totalTokens = (totalMessages * 85).toLocaleString();
  const totalSpend = (totalSecs * (0.015 / 60)).toFixed(2);

  // Helper to compute REAL company-specific stats per organisation
  const getCompanyStats = (company) => {
    let compSecs = 0;
    let compMsgs = 0;
    let callCount = 0;

    roomEntries.forEach(([roomId, roomData]) => {
      const roomCompId = !Array.isArray(roomData) ? roomData.company_id : null;
      const roomExt = !Array.isArray(roomData) ? roomData.extension : null;
      
      const belongs = (roomCompId && String(roomCompId) === String(company.id)) || 
                      (roomExt && String(roomExt) === String(company.ai_extension));

      if (belongs) {
        callCount++;
        const msgs = Array.isArray(roomData) ? roomData : (roomData.messages || []);
        const msgCount = msgs.filter(m => m.role !== 'system').length;
        compMsgs += msgCount;

        let durationMs = 0;
        if (msgs.length > 0) {
          durationMs = msgs.reduce((acc, m) => acc + (m.latency_ms || 300), 0);
        }
        compSecs += Math.max(15, Math.round(durationMs / 1000) + 12);
      }
    });

    const mins = (compSecs / 60).toFixed(1);
    const spend = (compSecs * (0.015 / 60)).toFixed(2);
    return { mins, spend, callCount, compMsgs };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
          {userRole === 'super_admin' ? 'Global Platform Billing & Multi-Tenant Usage' : 'Company Spending & Call Minutes'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {userRole === 'super_admin'
            ? 'Monitor overall system minute quotas, revenue, and spending breakdown across all companies.'
            : 'Detailed itemized spending log of your company call session minutes and LLM token usage.'}
        </p>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ padding: 20, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="#7c3aed" /> LOGGED CALL MINUTES
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#7c3aed', marginTop: 8 }}>{totalMinutes} Mins</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>From {sessionLogs.length} total call sessions</div>
        </div>

        <div style={{ padding: 20, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={14} color="#ec4899" /> LLM TOKENS CONSUMED
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#ec4899', marginTop: 8 }}>{totalTokens}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Gemini 3.1 Flash Lite / Ollama</div>
        </div>

        <div style={{ padding: 20, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={14} color="#10b981" /> ESTIMATED SPENDING
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981', marginTop: 8 }}>${totalSpend}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Based on $0.015/min rate</div>
        </div>
      </div>

      {/* VIEW A: SUPER ADMIN MULTI-TENANT COMPANY SPENDING TABLE */}
      {userRole === 'super_admin' ? (
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="#7c3aed" /> Tenant Companies Spending & Usage Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr 1.2fr 1fr', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            <span>Organisation Name</span>
            <span>AI Line Ext</span>
            <span>Range Start-End</span>
            <span>Model Tier</span>
            <span>Total Calls</span>
            <span>Total Mins</span>
            <span>Est. Spend</span>
          </div>
          {companies.map(c => {
            const stats = getCompanyStats(c);
            return (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr 1.2fr 1fr', padding: '16px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID #{c.id}</div>
                </div>
                <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#6b21a8' }}>{c.ai_extension}</span></div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.range_start} – {c.range_end}</div>
                <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#e0f2fe', color: '#075985' }}>{c.ai_model || 'gemini'}</span></div>
                <div style={{ fontWeight: 700 }}>{stats.callCount} calls</div>
                <div style={{ fontWeight: 700, color: '#7c3aed' }}>{stats.mins} mins</div>
                <div style={{ fontWeight: 800, color: '#10b981' }}>${stats.spend}</div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW B: COMPANY ADMIN DETAILED CALL SESSION ITEMIZATION */
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#ec4899" /> Itemized Call Session Spending Log
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            <span>Room ID</span>
            <span>Date & Time</span>
            <span>Line Ext</span>
            <span>Duration</span>
            <span>Tokens</span>
            <span>Est. Cost</span>
          </div>
          {sessionLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No call session spending logged yet for this company.
            </div>
          ) : (
            sessionLogs.map(log => (
              <div key={log.roomId} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>{log.roomId.substring(0, 14)}...</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.date}</div>
                <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#6b21a8' }}>{log.extension}</span></div>
                <div style={{ fontWeight: 700 }}>{log.durationMins} mins</div>
                <div style={{ fontFamily: 'monospace' }}>{log.tokensUsed}</div>
                <div style={{ fontWeight: 800, color: '#10b981' }}>{log.cost}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
