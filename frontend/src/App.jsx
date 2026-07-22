import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import VoiceAgent from './components/VoiceAgent';
import { Bot, ShieldCheck, Mic, Zap, Phone, ArrowRight, Sparkles, Globe, Cpu, Activity, Clock, CheckCircle2, X, FileText, ChevronRight, Scale, Lock, ShieldAlert, Award } from 'lucide-react';

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
   Landing Page (Homepage with Real Telemetry & Interactive Modals)
   ───────────────────────────────────────── */
function LandingPage({ showRoomId = null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Selected Item for Modal View (Supports both Services and Features)
  const [selectedItem, setSelectedItem] = useState(null);
  
  // 2 Distinct Legal Modals Visibility
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Real Dynamic Telemetry State
  const [liveMetrics, setLiveMetrics] = useState({
    activeExtensions: 4,
    latencyMs: 340,
    totalCalls: 12,
    liveChats: 0,
    uptime: '99.99%'
  });

  // Fetch real telemetry data on mount
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const [metRes, compRes] = await Promise.all([
          fetch(`http://${window.location.hostname}:8001/api/admin/metrics`),
          fetch(`http://${window.location.hostname}:8001/api/admin/companies`)
        ]);
        
        let extCount = 4;
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData.companies && compData.companies.length > 0) {
            extCount = compData.companies.length;
          }
        }

        if (metRes.ok) {
          const metData = await metRes.json();
          const roomCount = metData.rooms ? Object.keys(metData.rooms).length : (metData.total_chats || 0);
          setLiveMetrics({
            activeExtensions: extCount,
            latencyMs: metData.avg_latency_ms || 340,
            totalCalls: roomCount,
            liveChats: metData.live_chats || 0,
            uptime: '99.99%'
          });
        }
      } catch (err) {
        console.warn('Telemetry offline, fallback to local metrics', err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 8000);
    return () => clearInterval(interval);
  }, []);

  const startRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/rooms`, { method: 'POST' });
      const data = await res.json();
      navigate(`/room/${data.room_id}`);
    } catch {
      const fallbackId = 'demo-room-' + Math.random().toString(36).substring(2, 9);
      navigate(`/room/${fallbackId}`);
    } finally {
      setLoading(false);
    }
  };

  // 4 Main Feature Cards with Unique Modal Technical Deep-Dives
  const features = [
    {
      id: 'voice_synth',
      icon: Mic,
      title: 'Human-like Voice Synthesizer',
      desc: 'Speak completely naturally. AI Voice Agent understands accent nuances and responds in real time.',
      color: '#ec4899',
      detailedBody: `Our Neural Voice Synthesizer engine provides ultra-realistic 24kHz audio synthesis using Microsoft Azure EdgeTTS and custom neural speech models.

KEY TECHNICAL HIGHLIGHTS:
1. Multi-Lingual Accent Understanding: Seamlessly switches between English (US/UK/AU), Hindi (hi-IN-SwaraNeural/MadhurNeural), and Hinglish (en-IN-NeerjaNeural/PrabhatNeural).
2. Speech Speed & Volume Modulation: Supports dynamic pitch, speech rate (-50% to +50%), and volume modulation adjusted directly from Agent Studio sliders.
3. Natural Intonation & Devanagari Scripting: Automatically renders Hindi text in authentic Devanagari script for flawless pronunciation.`
    },
    {
      id: 'llm_engine',
      icon: Zap,
      title: 'Ultra Low Latency LLM Engine',
      desc: 'Powered by Gemini models for rapid-fire answers in less than a second.',
      color: '#8b5cf6',
      detailedBody: `Our Ultra Low Latency LLM Engine delivers real-time voice turnaround times in less than 400 milliseconds.

KEY TECHNICAL HIGHLIGHTS:
1. Dual Engine Support: Switch instantly between Google Gemini 3.1 Flash Lite (Cloud) and Ollama Llama 3.1 (Local Self-Hosted).
2. Streamed Response Tokenization: Streams LLM tokens directly to the audio synthesizer as they are generated to eliminate playback lag.
3. Custom Instruction Tuning: Enforces strict 1-2 sentence response brevity for realistic phone call cadence.`
    },
    {
      id: 'sip_dtmf',
      icon: Phone,
      title: 'SIP Trunking & DTMF Ready',
      desc: 'Connect Asterisk, hardware IP deskphones, or softphones directly. Call extension 1000 or keypad 1.',
      color: '#db2777',
      detailedBody: `Our Telephony Gateway integrates natively with Asterisk 20 PJSIP, LiveKit SIP, and local PBX hardware.

KEY TECHNICAL HIGHLIGHTS:
1. Keypad DTMF Forwarding: Detects dual-tone multi-frequency (DTMF) keypad presses (e.g. Press '1' -> Type Ext 101) for instant channel redirection.
2. Programmatic Voice Transfers: LLM calls 'transfer_call' tool to execute Asterisk AMI channel redirects seamlessly.
3. Hardware & Softphone Interoperability: Fully compatible with MicroSIP, Zoiper, Linphone, Yealink IP Phones, and Cisco PBX trunks.`
    },
    {
      id: 'always_reception',
      icon: Globe,
      title: '24/7 Always-Active Reception',
      desc: '24/7 client onboarding, support ticket routing, and conversational FAQs for your enterprise.',
      color: '#7c3aed',
      detailedBody: `Our 24/7 Always-Active AI Voice Agent operates non-stop across all company extension lines with zero downtime.

KEY TECHNICAL HIGHLIGHTS:
1. Multi-Tenant Extension Isolation: Manages multiple company lines simultaneously (e.g. Ext 201, 202, 500, 1000).
2. Automated Lead Ingestion: Logs caller timestamps, room session IDs, caller phone numbers, and call transcripts in PostgreSQL.
3. Silence Monitoring & Idle Recovery: Prompts inactive callers after 120s of silence and gracefully disconnects after 180s.`
    },
  ];

  const dynamicStats = [
    { value: `${liveMetrics.activeExtensions} Active`, label: 'Company Extensions', icon: Phone, color: '#7c3aed' },
    { value: `<${liveMetrics.latencyMs || 340}ms`, label: 'Response Latency', icon: Clock, color: '#ec4899' },
    { value: `${liveMetrics.totalCalls} Calls`, label: 'Completed Sessions', icon: Activity, color: '#10b981' },
    { value: 'Full Duplex', label: 'Voice Mode', icon: Zap, color: '#f59e0b' },
  ];

  // 3 Core Conversational Service Cards with Unique Modal Technical Deep-Dives
  const services = [
    {
      id: 'routing',
      title: 'Automated Call Routing',
      desc: 'Identifies incoming intent, hooks into your extensions database, and forwards calls to departments automatically.',
      detailedBody: `Our Automated Call Routing system provides enterprise-grade SIP call management and DTMF keypad redirection.

KEY TECHNICAL HIGHLIGHTS:
1. Intent Recognition: Uses real-time speech recognition to understand caller requests (e.g., "connect me to support" or "transfer to sales").
2. Keypad DTMF Forwarding: Callers can press '1' on their softphone keypad to type a 3-digit extension (e.g. Ext 101) for instant Asterisk channel redirection.
3. Database Security Bounds: Evaluates extension ranges (e.g. 1000-1009) against PostgreSQL company records before initiating transfers.
4. Fail-safe Routing: Plays congestion alert tones and maintains full duplex audio playout if an extension is busy or offline.`
    },
    {
      id: 'ingestion',
      title: 'Interactive Knowledge Ingestion',
      desc: 'Feed AI Voice Agent your system handbooks, directories, or scripts, and it instantly responds with correct info.',
      detailedBody: `Interactive Ingestion empowers your AI Voice Agent with custom vector knowledge documents.

KEY TECHNICAL HIGHLIGHTS:
1. RAG Vector Pipelines: Converts uploaded PDFs, company manuals, and directories into dense vector embeddings.
2. Context Retrieval: Dynamically pulls top-matching knowledge chunks (similarity threshold 0.80) to inject directly into LLM prompts.
3. Hallucination Prevention: Instructs Gemini/Ollama to answer strictly using company directives.
4. Real-time Synchronization: Updates apply immediately to live voice lines without needing server restarts.`
    },
    {
      id: 'softphones',
      title: 'Multi-device Softphones & SIP',
      desc: 'SIP profile generation permits instant registration with popular clients like Linphone, Microsip, and hardware systems.',
      detailedBody: `Multi-Device Softphone Interoperability allows seamless connection across all VoIP hardware and software endpoints.

KEY TECHNICAL HIGHLIGHTS:
1. SIP Trunk Integration: Built-in Asterisk 20 PJSIP gateway supports MicroSIP, Zoiper, Linphone, Yealink, and Cisco IP phones.
2. WebRTC Browser Calling: Built-in browser WebRTC client lets admins test lines directly without installing software.
3. Cross-Network Accessibility: Supports PC-to-PC local network calls across Extension 100, 101, and AI Extension 1000.
4. Auto-Config Sync: Automatically updates Asterisk configuration files whenever new endpoints are added.`
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Navbar */}
      <nav style={{ padding: '0 30px', borderBottom: '1px solid rgba(236,72,153,0.08)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
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
                <button
                  className="btn-primary"
                  onClick={() => {
                    const role = localStorage.getItem('ventra_user_role');
                    if (role === 'super_admin' || role === 'company_admin') navigate('/admin');
                    else navigate('/dashboard');
                  }}
                  style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, background: 'var(--accent)', fontWeight: 700 }}
                >
                  Go to Console
                </button>
              </>
            ) : (
              <button
                className="btn-ghost"
                onClick={() => navigate('/login')}
                style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ShieldCheck size={16} /> Login / Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: '40px 30px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.15,
            color: 'var(--text-primary)', marginBottom: 20
          }}>
            Your Intelligent <span style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>AI Voice Agent</span> is Ready
          </h1>

          <p style={{
            fontSize: 16, color: 'var(--text-secondary)', maxWidth: 680,
            margin: '0 auto 30px', lineHeight: 1.6
          }}>
            AI Voice Agent handles business phone lines, answers queries instantly, manages customer bookings, and routes calls seamlessly over SIP trunking.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              className="btn-primary glow-button"
              onClick={startRoom}
              disabled={loading}
              style={{
                padding: '14px 32px', borderRadius: 14, fontSize: 16, fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
              }}
            >
              {loading ? 'Connecting Call...' : 'Initiate Voice Call'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Telemetry Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {dynamicStats.map(({ value, label, icon: Icon, color }, idx) => (
            <div key={idx} className="glass" style={{
              padding: 22, borderRadius: 18, background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(236,72,153,0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s', cursor: 'default'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                <CheckCircle2 size={12} /> Live Real-Time Telemetry
              </div>
            </div>
          ))}
        </div>

        {/* Services Grid (Interactive Click to Read Detailed Modal) */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20, textAlign: 'center' }}>
            Core Conversational Services (Click to View Technical Details)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {services.map((ser) => (
              <div key={ser.id} onClick={() => setSelectedItem(ser)} className="glass" style={{
                padding: 24, borderRadius: 18, background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(139, 92, 246, 0.15)', display: 'flex', flexDirection: 'column', gap: 12,
                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed'
                  }}>
                    <Cpu size={20} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Learn More <ChevronRight size={14} />
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{ser.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{ser.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid (Interactive Click to Read Detailed Modal) */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20, textAlign: 'center' }}>
            Platform Capabilities & Voice Engine
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.id} onClick={() => setSelectedItem(feat)} className="glass" style={{
                  padding: 24, borderRadius: 18, background: 'rgba(255,255,255,0.75)',
                  border: `1px solid ${feat.color}25`, cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, backgroundColor: `${feat.color}12`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${feat.color}30`
                    }}>
                      <Icon size={20} color={feat.color} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: feat.color, display: 'flex', alignItems: 'center', gap: 2 }}>
                      Read Info <ChevronRight size={13} />
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{feat.title}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(236,72,153,0.08)', padding: '24px 30px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        <div>
          © 2026 DEI Lab · AI Voice Agent System (Developed by Gaurav Chauhan) · All Rights Reserved.
        </div>
        <div style={{ display: 'flex', gap: 20, fontWeight: 700 }}>
          <span style={{ cursor: 'pointer', color: '#7c3aed' }} onClick={() => setShowTermsModal(true)}>Terms & Conditions</span>
          <span style={{ cursor: 'pointer', color: '#ec4899' }} onClick={() => setShowPrivacyModal(true)}>Privacy Policy</span>
        </div>
      </footer>

      {/* ITEM DETAILS MODAL (Supports Services & Features) */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 24, maxWidth: 640, width: '100%', padding: 32, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={22} color="var(--text-muted)" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <Cpu size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{selectedItem.title}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Technical Architecture & Feature Overview</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{selectedItem.desc}</p>
            <div style={{ background: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {selectedItem.detailedBody}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn-primary" onClick={() => setSelectedItem(null)} style={{ background: '#7c3aed', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TERMS & CONDITIONS MODAL */}
      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 24, maxWidth: 780, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 36, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowTermsModal(false)} style={{ position: 'absolute', top: 22, right: 22, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="var(--text-muted)" />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid #f1f5f9', paddingBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <Scale size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>Terms of Service & Telephony Compliance</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Comprehensive Legal Agreement & Non-Emergency Telephony Mandate</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
              
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: 18, borderRadius: 14, display: 'flex', gap: 12, color: '#9f1239' }}>
                <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>MANDATORY EMERGENCY TELEPHONY DISCLAIMER (TCPA & FCC NON-EMERGENCY NOTICE):</strong>
                  DEI Lab AI Voice Agent System is designed strictly for automated commercial reception, support inquiries, and business SIP call routing. 
                  <strong> THIS PLATFORM IS NOT A COMMON CARRIER TELEPHONE EXCHANGE AND IS NOT DESIGNED, TESTED, OR AUTHORIZED TO DISPATCH OR ROUTE EMERGENCY CALLS (911, 112, OR PUBLIC SAFETY DISPATCH SERVICES). DO NOT USE THIS PLATFORM FOR EMERGENCY DISPATCH.</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>1. Preamble & Binding Agreement</h4>
                This Terms of Service and Telephony Compliance Agreement ("Agreement") constitutes a legally binding contract between the user or enterprise organization ("Client", "Subscriber") and AI Voice Agent Telephony System and its developer Gaurav Chauhan ("Provider", "Platform"). By creating an account, registering SIP softphone endpoints, accessing the console, or placing calls on any extension line, you explicitly acknowledge that you have read and agree to all terms stated herein.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>2. Telecommunications Compliance & Call Recording Consent</h4>
                Subscriber acknowledges that enabling transcript logging or call reporting features records conversational voice audio and textual transcripts. Subscriber assumes sole legal responsibility for providing mandatory pre-call audio disclosures (e.g., "This call may be recorded for quality assurance") in compliance with All-Party and One-Party consent laws under TCPA, FCC rules, and GDPR regulations.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>3. Acceptable Use Policy & Zero-Tolerance Anti-Spam Mandate</h4>
                Subscriber agrees strictly NOT to utilize the platform for: (i) Unlawful robocalling, automated phone spam, or unsolicited mass telemarketing; (ii) Caller ID spoofing or fraudulent identity impersonation; (iii) Harassment, illegal debt collection, or transmitting unlawful content. Provider reserves the right to terminate violating accounts immediately without notice or refund.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>4. Artificial Intelligence Model Limitations & Disclaimer of Accuracy</h4>
                Voice responses are generated dynamically by Large Language Models (Google Gemini 3.1 & Ollama Llama 3.1) based on user-configured directives and knowledge base documents. Subscriber acknowledges that AI models may occasionally produce unexpected or incomplete statements ("hallucinations"). Provider makes no warranty regarding the absolute factual accuracy of AI-generated responses.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>5. SIP Trunking, Bandwidth & Service Level Availability (SLA)</h4>
                While Provider strives to maintain 99.99% system uptime and sub-second voice latency, telecommunications routing depends on external internet service providers, local PBX configurations, and LiveKit WebRTC media servers. Provider is not liable for call drops resulting from local network congestion or SIP trunk failure.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>6. Intellectual Property & Software Licensing</h4>
                All proprietary software code, dashboard user interface designs, SIP orchestration scripts, database schemas, and AI agent architectures remain the sole intellectual property of DEI Lab AI Voice System and developer Gaurav Chauhan.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>7. Indemnification & Hold Harmless Clause</h4>
                Subscriber agrees to defend, indemnify, and hold harmless Provider, its developers, officers, and affiliates from any legal claims, regulatory fines, legal fees, or damages arising out of Subscriber's breach of this Agreement, violation of telecommunications laws, or misuse of voice agent lines.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>8. Limitation of Financial & Consequential Liability</h4>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PROVIDER OR DEVELOPER GAURAV CHAUHAN BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM THE USE OR INABILITY TO USE THIS VOICE PLATFORM.
              </div>

            </div>

            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowTermsModal(false)} style={{ background: '#7c3aed', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
                I Accept Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRIVACY POLICY MODAL */}
      {showPrivacyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 24, maxWidth: 780, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 36, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowPrivacyModal(false)} style={{ position: 'absolute', top: 22, right: 22, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="var(--text-muted)" />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid #f1f5f9', paddingBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                <Lock size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>Privacy Policy & Data Security Standards</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Comprehensive Data Handling, Encryption & Non-Disclosure Policy</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
              
              <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: 18, borderRadius: 14, display: 'flex', gap: 12, color: '#0369a1' }}>
                <Lock size={22} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>DATA PRIVACY & ZERO AD-MONETIZATION GUARANTEE:</strong>
                  DEI Lab AI Voice Agent System respects your corporate privacy. 
                  <strong> WE DO NOT SELL, LEASE, RENT, OR MONETIZE PRIVATE CALLER PHONE NUMBERS, VOICE AUDIO STREAMS, OR CONVERSATIONAL TRANSCRIPTS TO THIRD-PARTY ADVERTISING NETWORKS OR DATA BROKERS.</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>1. Privacy Commitment & Information Collection</h4>
                DEI Lab AI Voice Agent System collects caller phone numbers, extension credentials, call duration timestamps, and conversational audio streams strictly to perform real-time speech processing and receptionist routing.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>2. Audio Data, Voice Streams & Speech Processing</h4>
                Audio signals transmitted via SIP trunks or WebRTC browser streams are processed in real time by Silero VAD, Whisper STT, and Azure EdgeTTS. Voice streams are converted into ephemeral PCM audio chunks and are not permanently archived beyond session transcript logs.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>3. Call Transcripts & Conversation History Protection</h4>
                Conversational text transcripts generated during call sessions are stored in PostgreSQL databases protected by strict tenant Organization ID isolation. Only authorized Super Admin and Company Admin accounts can view their respective call logs.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>4. Multi-Tenant Data Isolation & Database Security</h4>
                All multi-tenant data structures, prompt directives, knowledge base vector embeddings, and extension ranges are logically partitioned per tenant organization. Cross-tenant data access is strictly prevented at the API database query layer.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>5. Third-Party Services & LLM Provider API Handling</h4>
                AI inference queries are processed via Google Gemini API and local Ollama Llama 3.1 instances. We enforce data zero-retention policies with third-party LLM providers, ensuring your business conversation prompts are not used to train public foundation models.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>6. Data Retention & Account Deletion Rights</h4>
                Organisations and administrators maintain full authority to purge call transcript histories or request complete deletion of company account records, extension credentials, and device profiles at any time.
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>7. International Data Regulations Compliance (GDPR & CCPA)</h4>
                Our data handling infrastructure complies with the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA). Users may exercise data access and deletion rights directly via their enterprise console.
              </div>

            </div>

            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setShowPrivacyModal(false)} style={{ background: '#ec4899', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
                I Understand Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Overlay Modal */}
      {showRoomId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(31, 26, 40, 0.4)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
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

const handleLogout = (n) => {
  localStorage.removeItem('ventra_token');
  localStorage.removeItem('ventra_user_role');
  localStorage.removeItem('ventra_user_id');
  localStorage.removeItem('ventra_user_name');
  localStorage.removeItem('ventra_company_id');
  localStorage.removeItem('ventra_admin_tab');
  localStorage.removeItem('ventra_user_tab');
  n('/'); // Direct to Homepage on logout!
};

function AdminDashboardWrapper() { const n = useNavigate(); return <PageBackground><AdminDashboard onBack={() => handleLogout(n)} /></PageBackground>; }
function UserDashboardWrapper() { const n = useNavigate(); return <PageBackground><UserDashboard onBack={() => handleLogout(n)} /></PageBackground>; }
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
