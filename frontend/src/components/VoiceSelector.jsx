import React, { useState, useEffect, useRef } from 'react';

export default function VoiceSelector({ selectedVoiceId, onSelectVoice }) {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGender, setFilterGender] = useState('All');
  const [search, setSearch] = useState('');
  const [playingVoice, setPlayingVoice] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:8001/api/voices')
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
    audioRef.current = new Audio(`http://localhost:8001/api/voices/preview/${voiceId}`);
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

  if (loading) return <div style={{color: '#999'}}>Loading premium voices...</div>;

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 16, color: '#fff', marginBottom: 15 }}>Agent Voice Selection</h3>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <input 
          type="text" 
          placeholder="Search voices..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6
          }}
        />
        <select 
          value={filterGender} 
          onChange={(e) => setFilterGender(e.target.value)}
          style={{
            padding: '8px 12px', background: 'rgba(0,0,0,0.5)', 
            border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6
          }}
        >
          <option value="All">All Genders</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 15, 
        maxHeight: 400, 
        overflowY: 'auto',
        paddingRight: 5
      }}>
        {filteredVoices.map(voice => {
          const isSelected = selectedVoiceId === voice.id;
          return (
            <div key={voice.id} style={{
              background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 8,
              padding: 15,
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none'
            }} onClick={() => onSelectVoice(voice.id)}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: 16 }}>
                    {voice.name} {isSelected && <span style={{fontSize: 10, color: 'var(--accent)', marginLeft: 5}}>(Selected)</span>}
                  </h4>
                  <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: 12 }}>{voice.language} • {voice.gender}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePreview(voice.id); }}
                  style={{
                    background: playingVoice === voice.id ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: 4, padding: '4px 8px', color: '#fff', fontSize: 11, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}
                >
                  {playingVoice === voice.id ? '⏹️ Playing...' : '▶️ Preview'}
                </button>
              </div>
              
              <p style={{ margin: '10px 0 0 0', color: '#aaa', fontSize: 12, lineHeight: 1.4 }}>
                {voice.description}
              </p>
              
              <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                <span style={{background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#888'}}>{voice.category}</span>
                <span style={{background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#888'}}>{voice.type}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
