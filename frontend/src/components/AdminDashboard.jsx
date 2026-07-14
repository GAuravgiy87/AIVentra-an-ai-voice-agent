import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ onBack }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/admin/rooms');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const filteredRooms = metrics?.rooms
    ? Object.entries(metrics.rooms).filter(([roomId]) =>
        roomId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const selectedRoomHistory = selectedRoomId && metrics?.rooms?.[selectedRoomId]
    ? metrics.rooms[selectedRoomId]
    : null;

  return (
    <div className="dark bg-surface text-on-surface font-body-md overflow-hidden h-screen flex w-full absolute top-0 left-0 z-50">
      
      {/* Custom Styles required for this specific view */}
      <style>{`
        .glass-panel {
            background: rgba(10, 10, 10, 0.75);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .row-hover:hover { background: rgba(255, 255, 255, 0.03); }
        .neon-glow {
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
        }
        .glow-text {
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Side Navigation Shell */}
      <aside className="h-screen w-64 border-r border-outline-variant flex flex-col py-2 bg-surface">
        <div className="px-6 py-5 flex items-center gap-3 border-b border-outline-variant/30">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
          </div>
          <div>
            <h1 className="font-headline-md text-lg font-bold text-white leading-none glow-text">Ventra AI</h1>
            <p className="text-[9px] uppercase tracking-widest text-primary/60 mt-1 font-semibold">Control Center</p>
          </div>
        </div>
        
        <nav className="mt-8 flex-1 px-4 space-y-1.5">
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-variant hover:text-white transition-all rounded-xl" href="#">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white">dashboard</span>
            <span className="font-label-md font-medium">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-primary bg-primary-container border-l-4 border-primary rounded-xl" href="#">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <span className="font-label-md font-semibold">Call History</span>
          </a>
        </nav>
        
        <div className="px-4 mt-auto mb-6">
          <button onClick={onBack} className="w-full py-3 border border-outline-variant text-on-surface-variant hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-variant transition-all hover:border-white/30">
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-sm">Exit Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col bg-surface-container-lowest">
        
        {/* Top App Bar */}
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-8">
          <div className="flex items-center bg-surface-container rounded-xl px-4 py-2 border border-outline-variant/60 w-96 transition-all focus-within:border-primary/50">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full text-on-surface placeholder:text-on-surface-variant outline-none" 
              placeholder="Search by Room ID..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="px-4 py-1.5 border border-primary/30 bg-primary/5 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-all text-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Live
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center font-bold text-sm text-white">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Header & Statistics Bar */}
        <section className="p-8 pb-0">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Call History Logs</h2>
              <p className="text-on-surface-variant mt-1 text-sm">Review, filter, and inspect live voice agent interactions.</p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-surface-container-low border border-outline-variant/60 px-4 py-2 rounded-xl min-w-[100px] shadow-sm">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block">Total Calls</span>
                <span className="text-2xl font-bold text-primary">{loading ? '-' : metrics?.total_chats}</span>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/60 px-4 py-2 rounded-xl flex gap-5 shadow-sm">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block">Live Now</span>
                  <span className="text-2xl font-bold text-primary flex items-center gap-1.5">
                    {loading ? '-' : metrics?.live_chats}
                    {metrics?.live_chats > 0 && <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>}
                  </span>
                </div>
                <div className="h-full w-px bg-outline-variant/50"></div>
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block">Avg Latency</span>
                  <span className="text-2xl font-bold text-secondary">{loading ? '-' : `${metrics?.avg_latency_ms}ms`}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filters Bar */}
          <div className="flex items-center gap-4 py-4 border-b border-outline-variant/30">
            <div className="flex items-center gap-2 bg-surface-container-high px-3.5 py-1.5 rounded-lg border border-outline-variant text-xs text-on-surface-variant cursor-pointer hover:border-white/20 transition-all">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span>All Time</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high px-3.5 py-1.5 rounded-lg border border-outline-variant text-xs text-on-surface-variant cursor-pointer hover:border-white/20 transition-all">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>All Channels</span>
            </div>
            
            {searchQuery && (
              <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full flex items-center gap-1.5">
                Search: "{searchQuery}"
                <span onClick={() => setSearchQuery('')} className="material-symbols-outlined text-xs cursor-pointer hover:text-white">close</span>
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { setLoading(true); }} className="p-2 rounded-lg hover:bg-surface-variant text-on-surface-variant hover:text-white transition-all">
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="flex-1 overflow-hidden p-8 pt-4">
          <div className="h-full border border-outline-variant/60 rounded-2xl glass-panel flex flex-col overflow-hidden">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-container-high border-b border-outline-variant/80">
              <div className="col-span-4 text-xs uppercase text-on-surface-variant tracking-wider font-bold">Room ID</div>
              <div className="col-span-3 text-xs uppercase text-on-surface-variant tracking-wider font-bold">Total Messages</div>
              <div className="col-span-2 text-xs uppercase text-on-surface-variant tracking-wider font-bold">Last Latency</div>
              <div className="col-span-3 text-right"></div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading && <div className="p-8 text-center text-on-surface-variant">Loading interaction data...</div>}
              
              {!loading && filteredRooms.map(([roomId, history]) => {
                const messageCount = history.filter(m => m.role !== 'system').length;
                const lastMsg = history[history.length - 1];
                const latency = lastMsg?.latency_ms || 0;

                return (
                  <div key={roomId} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant/30 row-hover items-center transition-all">
                    <div className="col-span-4">
                      <div className="text-on-surface font-semibold truncate text-sm select-all" title={roomId}>{roomId}</div>
                    </div>
                    
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary-container flex items-center justify-center border border-outline-variant/40">
                        <span className="material-symbols-outlined text-xs text-primary">chat</span>
                      </div>
                      <span className="text-on-surface-variant text-sm font-medium">{messageCount} messages</span>
                    </div>
                    
                    <div className="col-span-2 text-secondary font-semibold text-sm">
                      {latency > 0 ? `${latency}ms` : '-'}
                    </div>
                    
                    <div className="col-span-3 text-right">
                      <button 
                        onClick={() => setSelectedRoomId(roomId)}
                        className="px-3.5 py-1.5 bg-primary text-black font-bold rounded-lg text-xs hover:bg-white transition-all shadow-sm hover:scale-[1.02] active:scale-95"
                      >
                        View Transcript
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {!loading && filteredRooms.length === 0 && (
                <div className="p-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">find_in_page</span>
                  No rooms or interaction history found matching your query.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Transcript Modal Dialog */}
      {selectedRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface border border-outline-variant rounded-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden glass-panel">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/40 flex justify-between items-center bg-surface-container-high">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">forum</span>
                  Call Transcript
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5 truncate max-w-[400px]">Room: {selectedRoomId}</p>
              </div>
              <button 
                onClick={() => setSelectedRoomId(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body (Message Feed) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-surface-container-lowest">
              {selectedRoomHistory && selectedRoomHistory.filter(m => m.role !== 'system').map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                
                return (
                  <div key={index} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isAssistant 
                        ? 'bg-surface-variant border border-outline-variant/60 text-on-surface' 
                        : 'bg-primary-container border border-primary/20 text-white'
                    }`}>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                        {isAssistant ? 'Ventra AI' : 'Caller'}
                      </span>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {isAssistant && msg.latency_ms && (
                        <span className="text-[9px] text-secondary font-medium mt-1.5 block text-right border-t border-outline-variant/20 pt-1">
                          Latency: {msg.latency_ms}ms
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {(!selectedRoomHistory || selectedRoomHistory.filter(m => m.role !== 'system').length === 0) && (
                <div className="p-8 text-center text-on-surface-variant italic">
                  No conversational exchange recorded for this room.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end bg-surface-container-high">
              <button 
                onClick={() => setSelectedRoomId(null)}
                className="px-4 py-2 border border-outline-variant text-on-surface font-semibold rounded-lg hover:bg-surface-variant text-sm transition-all"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
