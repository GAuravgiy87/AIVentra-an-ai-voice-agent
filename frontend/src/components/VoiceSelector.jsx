import React, { useState, useEffect, useRef } from 'react';

export default function VoiceSelector({ selectedVoiceId, onSelectVoice }) {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGender, setFilterGender] = useState('All');
  const [search, setSearch] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:8001/api/voices`)
      .then(res => res.json())
      .then(data => {
        setVoices(data.voices || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load voices:", err);
        setLoading(false);
      });
  }, []);

  const handlePreview = (voiceId) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingVoice(voiceId);
    audioRef.current = new Audio(`http://${window.location.hostname}:8001/api/voices/preview/${voiceId}`);
    audioRef.current.play();
    audioRef.current.onended = () => setPlayingVoice(null);
    audioRef.current.onerror = () => {
      setPlayingVoice(null);
      alert("Failed to play preview. Ensure Edge-TTS is accessible.");
    };
  };

  const filteredVoices = voices.filter(v => {
    if (filterGender !== 'All' && v.gender !== filterGender) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.language.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, color: '#999' }}>
      <div style={{ width: 18, height: 18, border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      Loading voices...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
          Agent Voice
        </label>
        <p style={{ fontSize: 12, color: 'var(--text-muted, #94a3b8)', margin: '0 0 12px 0' }}>
          Choose the voice your AI agent will use when speaking to callers.
        </p>
      </div>
      
      {/* Search and Filter Bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search voices by name or language..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 40px', 
              background: '#f8fafc', 
              border: '2px solid rgba(0,0,0,0.05)', 
              color: 'var(--text-primary, #1e293b)', 
              borderRadius: 12,
              fontSize: 14,
              transition: 'border-color 0.2s'
            }}
          />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
          {['All', 'Female', 'Male'].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setFilterGender(g)}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: filterGender === g ? '#8b5cf6' : 'transparent',
                color: filterGender === g ? '#fff' : '#64748b'
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
        gap: 12, 
        maxHeight: 350, 
        overflowY: 'auto',
        paddingRight: 4
      }}>
        {filteredVoices.map(voice => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlaying = playingVoice === voice.id;
          return (
            <div 
              key={voice.id} 
              onClick={() => onSelectVoice(voice.id)}
              style={{
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 100%)' 
                  : '#fff',
                border: `2px solid ${isSelected ? '#8b5cf6' : 'rgba(0,0,0,0.04)'}`,
                borderRadius: 16,
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700
                }}>✓</div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, color: 'var(--text-primary, #1e293b)', fontSize: 15, fontWeight: 700 }}>
                    {voice.name}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: 12 }}>
                    {voice.language} • {voice.gender}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePreview(voice.id); }}
                  style={{
                    background: isPlaying ? '#8b5cf6' : '#f1f5f9',
                    border: 'none', 
                    borderRadius: 10, 
                    padding: '6px 12px', 
                    color: isPlaying ? '#fff' : '#64748b', 
                    fontSize: 12, 
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 5,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {isPlaying ? '⏹ Playing' : '▶ Preview'}
                </button>
              </div>
              
              {voice.description && (
                <p style={{ margin: '10px 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: 12, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {voice.description}
                </p>
              )}
              
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {voice.category && (
                  <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11, color: '#64748b', fontWeight: 500 }}>{voice.category}</span>
                )}
                {voice.type && (
                  <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11, color: '#64748b', fontWeight: 500 }}>{voice.type}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredVoices.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 }}>
          No voices found matching your search.
        </div>
      )}
    </div>
  );
}
