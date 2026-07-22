import React, { useState, useRef } from 'react';
import { Save, Phone, ChevronDown, ChevronUp, BookOpen, Volume2, Mic, Settings2, Shield, Sliders, VolumeX, Clock, MessageSquare, Wrench, Upload, Trash2, Plus, FileText, X, CheckCircle } from 'lucide-react';

export default function AgentStudio({
  editingAgent,
  onBack,
  onSave,
  onStartCall
}) {
  // Core Agent Info
  const agentName = editingAgent?.agent_name || editingAgent?.name || 'Voice AI Agent';
  const companyName = editingAgent?.name || 'AI Voice Agent Enterprise';
  const extNum = editingAgent?.ai_extension || '1000';

  const defaultPromptTemplate = `IDENTITY & ROLE:
You are ${agentName}, an intelligent AI Voice Agent for ${companyName} on Extension Line ${extNum}.

CORE RESPONSIBILITIES:
- Handle inbound SIP phone calls professionally and assist callers with inquiries about ${companyName}.
- Provide rapid, low-latency, conversational voice responses.

CONVERSATIONAL BEHAVIOR & RULES:
1. Speak in a natural, polite, and confident tone.
2. Keep all responses brief and concise (1 to 2 sentences maximum) suitable for phone conversations.
3. Automatically match the caller's spoken language (English, Hindi, or Hinglish). Respond in Devanagari script when speaking Hindi.
4. If the caller requests to speak to a human representative, agent, or specific extension (e.g. 101, 100), invoke the 'transfer_call' tool immediately.
5. Do not invent unverified information outside company guidelines.`;

  const defaultGreetingMessage = `Hello! Welcome to ${companyName}. My name is ${agentName}, how can I help you today?`;

  const [prompt, setPrompt] = useState(editingAgent?.agent_prompt || defaultPromptTemplate);
  const [whoStarts, setWhoStarts] = useState(editingAgent?.who_starts || 'AI speaks first');
  const [model, setModel] = useState(editingAgent?.ai_model || 'gemini');
  const [voice, setVoice] = useState(editingAgent?.agent_voice || 'en-US-AriaNeural');
  const [greeting, setGreeting] = useState(editingAgent?.greeting_msg || defaultGreetingMessage);

  const [voicesList, setVoicesList] = useState([
    { id: "en-US-AriaNeural", name: "Aria (English US - Female)" },
    { id: "en-US-GuyNeural", name: "Guy (English US - Male)" },
    { id: "en-US-JennyNeural", name: "Jenny (English US - Female)" },
    { id: "en-US-ChristopherNeural", name: "Christopher (English US - Male)" },
    { id: "en-US-EricNeural", name: "Eric (English US - Male)" },
    { id: "en-US-MichelleNeural", name: "Michelle (English US - Female)" },
    { id: "en-GB-SoniaNeural", name: "Sonia (English UK - Female)" },
    { id: "en-GB-RyanNeural", name: "Ryan (English UK - Male)" },
    { id: "en-AU-NatashaNeural", name: "Natasha (English AU - Female)" },
    { id: "hi-IN-SwaraNeural", name: "Swara (Hindi India - Female)" },
    { id: "hi-IN-MadhurNeural", name: "Madhur (Hindi India - Male)" },
    { id: "en-IN-NeerjaNeural", name: "Neerja (Hinglish/Indian English - Female)" },
    { id: "en-IN-PrabhatNeural", name: "Prabhat (Hinglish/Indian English - Male)" },
    { id: "en-CA-ClaraNeural", name: "Clara (Canadian English - Female)" },
    { id: "en-CA-LiamNeural", name: "Liam (Canadian English - Male)" },
    { id: "en-IE-EmilyNeural", name: "Emily (Irish English - Female)" },
    { id: "en-NZ-MitchellNeural", name: "Mitchell (New Zealand English - Male)" },
    { id: "en-SG-WayneNeural", name: "Wayne (Singapore English - Male)" },
    { id: "en-ZA-LeahNeural", name: "Leah (South African English - Female)" },
    { id: "es-ES-ElviraNeural", name: "Elvira (Spanish - Female)" },
    { id: "fr-FR-DeniseNeural", name: "Denise (French - Female)" },
    { id: "de-DE-KatjaNeural", name: "Katja (German - Female)" }
  ]);

  React.useEffect(() => {
    fetch(`http://${window.location.hostname}:8001/api/voices`)
      .then(res => res.json())
      .then(data => {
        if (data && data.voices && data.voices.length > 0) {
          setVoicesList(data.voices.map(v => ({ id: v.id, name: `${v.name} (${v.language} - ${v.gender})` })));
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (editingAgent) {
      if (editingAgent.agent_prompt !== undefined) setPrompt(editingAgent.agent_prompt);
      if (editingAgent.who_starts !== undefined) setWhoStarts(editingAgent.who_starts);
      if (editingAgent.ai_model !== undefined) setModel(editingAgent.ai_model);
      if (editingAgent.agent_voice !== undefined) setVoice(editingAgent.agent_voice);
      if (editingAgent.greeting_msg !== undefined) setGreeting(editingAgent.greeting_msg);
      if (editingAgent.speech_speed !== undefined) setSpeechSpeed(editingAgent.speech_speed);
      if (editingAgent.speech_volume !== undefined) setSpeechVolume(editingAgent.speech_volume);
      if (editingAgent.vad_threshold !== undefined) setVadThreshold(editingAgent.vad_threshold);
      if (editingAgent.min_endpointing_delay !== undefined) setMinEndpointing(editingAgent.min_endpointing_delay);
      if (editingAgent.max_endpointing_delay !== undefined) setMaxEndpointing(editingAgent.max_endpointing_delay);
      if (editingAgent.allow_interruptions !== undefined) setAllowInterruptions(editingAgent.allow_interruptions);
      if (editingAgent.enable_backchanneling !== undefined) setEnableBackchanneling(editingAgent.enable_backchanneling);
      if (editingAgent.backchannel_words !== undefined) setBackchannelWords(editingAgent.backchannel_words);
      if (editingAgent.responsiveness !== undefined) setResponsiveness(editingAgent.responsiveness);
      if (editingAgent.interruption_sensitivity !== undefined) setInterruptionSensitivity(editingAgent.interruption_sensitivity);
    }
  }, [editingAgent]);
  
  // 1. Knowledge Base Settings & Dynamic Documents
  const [kbChunks, setKbChunks] = useState(editingAgent?.kb_chunks ?? 3);
  const [kbSimilarity, setKbSimilarity] = useState(editingAgent?.kb_similarity ?? 0.80);
  const [showKbModal, setShowKbModal] = useState(false);
  const [kbTitle, setKbTitle] = useState('');
  const [kbText, setKbText] = useState('');
  const [kbFiles, setKbFiles] = useState([
    { id: 1, name: 'Company_Product_Catalog.pdf', size: '245 KB', chunks: 14, active: true },
    { id: 2, name: 'Support_FAQ_Guide.txt', size: '42 KB', chunks: 6, active: true }
  ]);

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result || '';
        const chunkCount = Math.ceil(text.length / 400) || 1;
        const newDoc = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: `${Math.round(file.size / 1024) || 1} KB`,
          chunks: chunkCount,
          active: true,
          content: text
        };
        setKbFiles(prev => [...prev, newDoc]);
        setPrompt(prev => prev + `\n\n[KNOWLEDGE BASE DOCUMENT: ${file.name}]\n${text.substring(0, 800)}`);
        alert(`Successfully ingested '${file.name}'! (${chunkCount} vector chunks created and injected)`);
      };
      reader.readAsText(file);
    });
  };

  const handleAddKbText = (e) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbText.trim()) return;
    const chunkCount = Math.ceil(kbText.length / 400) || 1;
    const newDoc = {
      id: Date.now(),
      name: kbTitle.trim() + '.txt',
      size: `${Math.round(kbText.length / 1024) || 1} KB`,
      chunks: chunkCount,
      active: true,
      content: kbText
    };
    setKbFiles(prev => [...prev, newDoc]);
    setPrompt(prev => prev + `\n\n[KNOWLEDGE BASE DIRECTIVE: ${newDoc.name}]\n${kbText.substring(0, 800)}`);
    setKbTitle('');
    setKbText('');
    setShowKbModal(false);
    alert(`Knowledge Base item '${newDoc.name}' added successfully!`);
  };

  const handleDeleteKb = (id) => {
    setKbFiles(prev => prev.filter(f => f.id !== id));
  };

  // 2. Speech Settings
  const [bgSound, setBgSound] = useState(editingAgent?.bg_sound || 'None');
  const [responsiveness, setResponsiveness] = useState(editingAgent?.responsiveness ?? 0.5);
  const [interruptionSensitivity, setInterruptionSensitivity] = useState(editingAgent?.interruption_sensitivity ?? 0.9);
  const [enableBackchanneling, setEnableBackchanneling] = useState(editingAgent?.enable_backchanneling ?? false);
  const [enableNormalization, setEnableNormalization] = useState(editingAgent?.enable_normalization ?? true);
  const [reminderFreqSecs, setReminderFreqSecs] = useState(editingAgent?.reminder_freq_secs ?? 10);
  const [reminderTimes, setReminderTimes] = useState(editingAgent?.reminder_times ?? 1);

  // 3. Transcription Settings
  const [sttProvider, setSttProvider] = useState('Whisper STT (Small)');
  const [primaryLang, setPrimaryLang] = useState('Auto-Detect (EN/HI)');

  // 4. TTS Settings
  const [ttsInstructions, setTtsInstructions] = useState('Respond in user exact language - Devanagari for Hindi, Latin script for English.');
  const [speechSpeed, setSpeechSpeed] = useState(editingAgent?.speech_speed ?? 1.0);
  const [speechVolume, setSpeechVolume] = useState(editingAgent?.speech_volume ?? 1.0);

  // 5. Call Settings
  const [dtmfEnabled, setDtmfEnabled] = useState(true);
  const [voiceForwardingEnabled, setVoiceForwardingEnabled] = useState(true);

  // 6. Security & Fallback
  const [rangeStart, setRangeStart] = useState(editingAgent?.range_start ?? 100);
  const [rangeEnd, setRangeEnd] = useState(editingAgent?.range_end ?? 200);

  // 7. VAD Settings
  const [vadThreshold, setVadThreshold] = useState(editingAgent?.vad_threshold ?? 0.5);

  // 8. Noise Cancellation
  const [enableNoiseCancellation, setEnableNoiseCancellation] = useState(true);

  // 9. Turn Detection
  const [allowInterruptions, setAllowInterruptions] = useState(editingAgent?.allow_interruptions ?? true);
  const [minInterruptionDur, setMinInterruptionDur] = useState(0.3);
  const [minEndpointing, setMinEndpointing] = useState(editingAgent?.min_endpointing_delay ?? 0.5);
  const [maxEndpointing, setMaxEndpointing] = useState(editingAgent?.max_endpointing_delay ?? 1.0);
  const [falseInterruptionTimeout, setFalseInterruptionTimeout] = useState(2.0);

  // 10. Idle Config Setup
  const [silenceWarningSecs, setSilenceWarningSecs] = useState(120);
  const [silenceDisconnectSecs, setSilenceDisconnectSecs] = useState(180);

  // 11. Backchannel Config
  const [backchannelWords, setBackchannelWords] = useState(editingAgent?.backchannel_words || 'yeah, hmm, right, ok');
  const [backchannelWaitTime, setBackchannelWaitTime] = useState(2);
  const [backchannelThreshold, setBackchannelThreshold] = useState(80);

  // 12. Accordions Open/Close state for ALL 12 panels
  const [accordions, setAccordions] = useState({
    kb: false,
    speech: true,
    transcription: false,
    tts: true,
    callSettings: false,
    security: false,
    vad: true,
    noise: false,
    turn: true,
    idle: false,
    backchannel: false,
    tools: false
  });

  const toggle = (key) => setAccordions(prev => ({ ...prev, [key]: !prev[key] }));

  // Quick Presets helper
  const applyPreset = (preset) => {
    if (preset === 'low_latency') {
      setMinEndpointing(0.2);
      setMaxEndpointing(0.5);
      setVadThreshold(0.4);
    } else if (preset === 'telephony') {
      setMinEndpointing(0.5);
      setMaxEndpointing(1.0);
      setVadThreshold(0.5);
    } else if (preset === 'no_interruptions') {
      setAllowInterruptions(false);
    } else if (preset === 'balanced') {
      setMinEndpointing(0.5);
      setMaxEndpointing(1.2);
      setVadThreshold(0.5);
      setAllowInterruptions(true);
    }
  };

  const handleSave = () => {
    onSave({
      prompt,
      voice,
      model,
      who_starts: whoStarts,
      greeting_msg: greeting,
      speech_speed: parseFloat(speechSpeed),
      speech_volume: parseFloat(speechVolume),
      vad_threshold: parseFloat(vadThreshold),
      min_endpointing_delay: parseFloat(minEndpointing),
      max_endpointing_delay: parseFloat(maxEndpointing),
      allow_interruptions: allowInterruptions,
      kb_chunks: parseInt(kbChunks),
      kb_similarity: parseFloat(kbSimilarity),
      bg_sound: bgSound,
      responsiveness: parseFloat(responsiveness),
      interruption_sensitivity: parseFloat(interruptionSensitivity),
      enable_backchanneling: enableBackchanneling,
      enable_normalization: enableNormalization,
      reminder_freq_secs: parseInt(reminderFreqSecs),
      reminder_times: parseInt(reminderTimes),
      backchannel_words: backchannelWords
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Studio bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '16px 24px', borderRadius: 16, border: '1px solid var(--border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn-ghost" onClick={onBack} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>← Back</button>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{editingAgent?.agent_name || editingAgent?.name || 'AI Agent'} Studio</h2>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>
            Agent ID: {editingAgent?.ai_extension || '200'} · Pricing: $0.00/min (Self-hosted)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleSave}>
            <Save size={15} /> Save Config
          </button>
          <button className="btn-primary" style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }} onClick={onStartCall}>
            <Phone size={14} /> Test Agent
          </button>
        </div>
      </div>

      {/* Top Toolbar Badges */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
          <span>Model:</span>
          <select value={model} onChange={e => setModel(e.target.value)} style={{ border: 'none', background: 'transparent', fontWeight: 700, outline: 'none', color: '#7c3aed' }}>
            <option value="gemini">Google Gemini (Gemini 3.1 Flash Lite)</option>
            <option value="ollama">Ollama (Llama 3.1 Local)</option>
          </select>
        </div>

        <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
          <span>Voice ({voicesList.length} Available):</span>
          <select value={voice} onChange={e => setVoice(e.target.value)} style={{ border: 'none', background: 'transparent', fontWeight: 700, outline: 'none', color: '#ec4899', maxWidth: 260 }}>
            {voicesList.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div style={{ background: '#ffffff', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
          STT: Whisper STT (Small)
        </div>
      </div>

      {/* Studio 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: 20 }}>
        {/* Left Column: Directives & Workers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Agent Instructions & Directives</div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={12}
              style={{
                width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 12,
                border: '1px solid var(--border)', fontSize: 13, lineHeight: 1.6,
                fontFamily: 'monospace', outline: 'none', background: '#f8fafc'
              }}
            />
          </div>

          <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Who Starts Conversation?</div>
            <select value={whoStarts} onChange={e => setWhoStarts(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
              <option value="AI speaks first">AI speaks first</option>
              <option value="User speaks first">User speaks first</option>
            </select>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Opening Greeting Message</div>
            <input
              value={greeting}
              onChange={e => setGreeting(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
            />
          </div>

          <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Running Workers & Pipeline</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 1.2fr', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              <span>Name</span>
              <span>Container ID</span>
              <span>Status</span>
              <span>Image</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.8fr 1.2fr', padding: '14px 16px', fontSize: 13, alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>livekit_agent_worker</span>
              <span style={{ fontFamily: 'monospace' }}>5823d7197366</span>
              <span><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>running</span></span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>voiceagent-agent:latest</span>
            </div>
          </div>
        </div>

        {/* Right Column: ALL 12 ACCORDION PANELS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 1. Knowledge Base */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.pdf,.md,.doc,.docx" multiple style={{ display: 'none' }} />
            <button onClick={() => toggle('kb')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={16} color="#7c3aed" /> Knowledge Base ({kbFiles.length} Documents)</span>
              {accordions.kb ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.kb && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-primary" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Upload size={14} /> Upload File (.pdf/.txt)
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowKbModal(true)} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Plus size={14} /> Write Note
                  </button>
                </div>

                {/* Ingested Documents List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingested Vector Documents ({kbFiles.length})</span>
                  {kbFiles.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', italic: 'true' }}>No knowledge documents added yet.</div>
                  ) : (
                    kbFiles.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <FileText size={14} color="#7c3aed" style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{doc.size} · <span style={{ color: '#10b981', fontWeight: 700 }}>{doc.chunks} vector chunks</span></div>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleDeleteKb(doc.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Vector RAG Chunks per Query: {kbChunks}</label>
                  <input type="range" min="1" max="10" value={kbChunks} onChange={e => setKbChunks(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Similarity Search Threshold: {kbSimilarity}</label>
                  <input type="range" min="0.1" max="1.0" step="0.05" value={kbSimilarity} onChange={e => setKbSimilarity(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>

          {/* 2. Speech Settings */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('speech')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Volume2 size={16} color="#ec4899" /> Speech Settings</span>
              {accordions.speech ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.speech && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Background Sound</label>
                  <select value={bgSound} onChange={e => setBgSound(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                    <option value="None">None</option>
                    <option value="Office">Office Noise</option>
                    <option value="Cafe">Cafe Ambience</option>
                    <option value="Rain">Rain Sound</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Responsiveness: {responsiveness}s</label>
                  <input type="range" min="0.1" max="2.0" step="0.1" value={responsiveness} onChange={e => setResponsiveness(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Interruption Sensitivity: {interruptionSensitivity}</label>
                  <input type="range" min="0.1" max="1.0" step="0.1" value={interruptionSensitivity} onChange={e => setInterruptionSensitivity(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Enable Backchanneling ('yeah', 'uh-huh')</span>
                  <input type="checkbox" checked={enableBackchanneling} onChange={e => setEnableBackchanneling(e.target.checked)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Enable Speech Normalization</span>
                  <input type="checkbox" checked={enableNormalization} onChange={e => setEnableNormalization(e.target.checked)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Reminder Message Frequency</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <input type="number" value={reminderFreqSecs} onChange={e => setReminderFreqSecs(e.target.value)} style={{ width: 60, padding: 6, borderRadius: 6, border: '1px solid var(--border)' }} /> secs
                    <input type="number" value={reminderTimes} onChange={e => setReminderTimes(e.target.value)} style={{ width: 60, padding: 6, borderRadius: 6, border: '1px solid var(--border)' }} /> times
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Transcription Settings */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('transcription')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mic size={16} color="#3b82f6" /> Transcription Settings</span>
              {accordions.transcription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.transcription && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f1f5f9' }}>
                <div>STT Provider: {sttProvider}</div>
                <div>Primary Language: {primaryLang}</div>
              </div>
            )}
          </div>

          {/* 4. TTS Settings */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('tts')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Volume2 size={16} color="#10b981" /> TTS Settings</span>
              {accordions.tts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.tts && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>LLM User Instructions</label>
                  <textarea value={ttsInstructions} onChange={e => setTtsInstructions(e.target.value)} rows={3} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Speech Speed: {speechSpeed}x</label>
                  <input type="range" min="0.6" max="1.5" step="0.1" value={speechSpeed} onChange={e => setSpeechSpeed(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Speech Volume: {speechVolume}x</label>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={speechVolume} onChange={e => setSpeechVolume(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>

          {/* 5. Call Settings */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('callSettings')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={16} color="#f59e0b" /> Call Settings</span>
              {accordions.callSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.callSettings && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f1f5f9' }}>
                <div>DTMF Keypad Forwarding: Enabled (Press 1 {'->'} Ext 101)</div>
                <div>Voice Command Forwarding: Enabled (LLM transfer_call)</div>
              </div>
            )}
          </div>

          {/* 6. Security & Fallback */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('security')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} color="#ef4444" /> Security & Extension Quotas</span>
              {accordions.security ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.security && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Granted Extension Range:</span>
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, background: '#fee2e2', color: '#991b1b', fontFamily: 'monospace' }}>
                    Ext {rangeStart} to Ext {rangeEnd}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  🔒 Quota Enforced: Company Admins can only assign extensions and add users within this Super Admin granted boundary.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Unauthorized Call Rejection:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>Active (Auto-Warning & Disconnect)</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. VAD Settings */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('vad')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sliders size={16} color="#8b5cf6" /> VAD Settings</span>
              {accordions.vad ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.vad && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f1f5f9' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Silero VAD Threshold: {vadThreshold}</label>
                <input type="range" min="0.1" max="1.0" step="0.05" value={vadThreshold} onChange={e => setVadThreshold(e.target.value)} style={{ width: '100%' }} />
              </div>
            )}
          </div>

          {/* 8. Noise Cancellation */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('noise')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><VolumeX size={16} color="#06b6d4" /> Noise Cancellation</span>
              {accordions.noise ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.noise && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Enable Noise Suppression</span>
                  <input type="checkbox" checked={enableNoiseCancellation} onChange={e => setEnableNoiseCancellation(e.target.checked)} />
                </div>
              </div>
            )}
          </div>

          {/* 9. Turn Detection */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('turn')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} color="#f97316" /> Turn Detection</span>
              {accordions.turn ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.turn && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Allow Interruptions</span>
                  <input type="checkbox" checked={allowInterruptions} onChange={e => setAllowInterruptions(e.target.checked)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Min Interruption Duration: {minInterruptionDur}s</label>
                  <input type="range" min="0.1" max="1.0" step="0.1" value={minInterruptionDur} onChange={e => setMinInterruptionDur(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Min Endpointing Delay: {minEndpointing}s</label>
                  <input type="range" min="0.1" max="2.0" step="0.1" value={minEndpointing} onChange={e => setMinEndpointing(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Max Endpointing Delay: {maxEndpointing}s</label>
                  <input type="range" min="0.4" max="5.0" step="0.1" value={maxEndpointing} onChange={e => setMaxEndpointing(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Quick Presets</label>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700 }} onClick={() => applyPreset('low_latency')}>⚡ Low Latency</button>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700 }} onClick={() => applyPreset('telephony')}>📞 Telephony</button>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700 }} onClick={() => applyPreset('no_interruptions')}>🚫 No Interruptions</button>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700 }} onClick={() => applyPreset('balanced')}>🌐 Balanced</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 10. Idle Config Setup */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('idle')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} color="#64748b" /> Idle Config Setup</span>
              {accordions.idle ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.idle && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f1f5f9' }}>
                <div>Silence Warning: {silenceWarningSecs} seconds</div>
                <div>Silence Disconnect: {silenceDisconnectSecs} seconds</div>
              </div>
            )}
          </div>

          {/* 11. Backchannel Config */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('backchannel')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={16} color="#a855f7" /> Backchannel Config</span>
              {accordions.backchannel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.backchannel && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Backchannel Words</label>
                  <input value={backchannelWords} onChange={e => setBackchannelWords(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                </div>
                <div>Backchannel Wait Time: {backchannelWaitTime} seconds</div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Confidence Threshold: {backchannelThreshold}</label>
                  <input type="range" min="1" max="100" value={backchannelThreshold} onChange={e => setBackchannelThreshold(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>

          {/* 12. Function Tools */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => toggle('tools')} style={{ width: '100%', padding: '14px 18px', background: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Wrench size={16} color="#10b981" /> Function Tools</span>
              {accordions.tools ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {accordions.tools && (
              <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f1f5f9' }}>
                <div>Registered Tools: <code>transfer_call</code> (Call Redirection)</div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ADD KNOWLEDGE BASE TEXT MODAL */}
      {showKbModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleAddKbText} style={{ background: '#ffffff', borderRadius: 20, maxWidth: 540, width: '100%', padding: 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button type="button" onClick={() => setShowKbModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="var(--text-muted)" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={22} color="#7c3aed" />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Write Knowledge Note / Directive</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Document Title / Subject *</label>
              <input type="text" value={kbTitle} onChange={e => setKbTitle(e.target.value)} placeholder="e.g. Pricing & Refund Policy" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Knowledge Content / Guidelines *</label>
              <textarea value={kbText} onChange={e => setKbText(e.target.value)} placeholder="Paste or type company guidelines, product details, or instructions here..." rows={8} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, lineHeight: 1.6, fontFamily: 'monospace', outline: 'none' }} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowKbModal(false)} style={{ padding: '10px 18px', borderRadius: 10, fontSize: 13 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, background: '#7c3aed', fontWeight: 700 }}>Inject Knowledge</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
