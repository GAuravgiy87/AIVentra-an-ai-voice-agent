import React, { useState, useMemo, useRef } from 'react';
import { Search, Calendar, Building2, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';

export default function ProjectManagementTab({
  filtered = [],
  getCallDuration,
  onSelectRoom,
  companies = [],
  userRole = 'super_admin'
}) {
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', '7days', '30days', '90days', '1year', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const dateInputRef = useRef(null);

  // Filter entries based on search, company, and date
  const processedEntries = useMemo(() => {
    return filtered.filter(([roomId, roomData]) => {
      // 1. Text Search (Room ID or Message Content)
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const hist = Array.isArray(roomData) ? roomData : roomData.messages || [];
        const matchesRoomId = roomId.toLowerCase().includes(query);
        const matchesContent = hist.some(m => m.content && m.content.toLowerCase().includes(query));
        if (!matchesRoomId && !matchesContent) return false;
      }

      // 2. Company Filter (Super Admin Only)
      if (userRole === 'super_admin' && selectedCompany !== 'all') {
        const compId = !Array.isArray(roomData) ? roomData.company_id : null;
        const compExt = !Array.isArray(roomData) ? roomData.extension : null;
        const matchingComp = companies.find(c => String(c.id) === String(selectedCompany));
        if (matchingComp) {
          const compMatchesId = compId && String(compId) === String(matchingComp.id);
          const compMatchesExt = compExt && String(compExt) === String(matchingComp.ai_extension);
          if (!compMatchesId && !compMatchesExt) return false;
        }
      }

      // 3. Date Filter (Today, 7 days, 30 days, 90 days, 1 year, or Custom Specific Date)
      if (dateFilter !== 'all') {
        const lastActive = !Array.isArray(roomData) ? roomData.last_active : null;
        if (lastActive) {
          const callDate = new Date(lastActive * 1000);
          const now = new Date();

          if (dateFilter === 'today') {
            if (callDate.toDateString() !== now.toDateString()) return false;
          } else if (dateFilter === '7days') {
            const diffDays = (now - callDate) / (1000 * 3600 * 24);
            if (diffDays > 7) return false;
          } else if (dateFilter === '30days') {
            const diffDays = (now - callDate) / (1000 * 3600 * 24);
            if (diffDays > 30) return false;
          } else if (dateFilter === '90days') {
            const diffDays = (now - callDate) / (1000 * 3600 * 24);
            if (diffDays > 90) return false;
          } else if (dateFilter === '1year') {
            const diffDays = (now - callDate) / (1000 * 3600 * 24);
            if (diffDays > 365) return false;
          } else if (dateFilter === 'custom' && customDate) {
            const selectedStr = new Date(customDate).toDateString();
            if (callDate.toDateString() !== selectedStr) return false;
          }
        }
      }

      return true;
    });
  }, [filtered, search, selectedCompany, dateFilter, customDate, userRole, companies]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCompany, dateFilter, customDate]);

  const totalPages = Math.ceil(processedEntries.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = processedEntries.slice(startIndex, startIndex + itemsPerPage);

  const resolveCompanyName = (roomData) => {
    const compId = !Array.isArray(roomData) ? roomData.company_id : null;
    const compExt = !Array.isArray(roomData) ? roomData.extension : null;
    if (compId) {
      const match = companies.find(c => String(c.id) === String(compId));
      if (match) return match.name;
    }
    if (compExt) {
      const match = companies.find(c => String(c.ai_extension) === String(compExt));
      if (match) return match.name;
    }
    return 'Default AI Line';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Project Management & Call Logs</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Review call logs, transcript records, and active room histories.</p>
      </div>

      {/* Filter Control Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: '#ffffff', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search room ID or transcript words..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }}
          />
          {search && (
            <X size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setSearch('')} />
          )}
        </div>

        {/* Date Preset & Interactive Calendar Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
          <Calendar
            size={16}
            color="#7c3aed"
            style={{ cursor: 'pointer' }}
            title="Click to open calendar picker"
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
          />
          <select
            value={dateFilter}
            onChange={e => {
              setDateFilter(e.target.value);
              if (e.target.value !== 'custom') setCustomDate('');
              else dateInputRef.current?.showPicker?.();
            }}
            style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, outline: 'none', color: 'var(--text-primary)' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last 1 Year</option>
            <option value="custom">Specific Date / Calendar...</option>
          </select>

          {/* Hidden/Active Calendar Date Input */}
          <input
            type="date"
            ref={dateInputRef}
            value={customDate}
            onChange={e => {
              setCustomDate(e.target.value);
              setDateFilter('custom');
            }}
            style={{
              border: 'none', background: 'transparent', fontSize: 12, fontWeight: 700,
              display: dateFilter === 'custom' || customDate ? 'inline-block' : 'none',
              outline: 'none', color: '#7c3aed'
            }}
          />
        </div>

        {/* Company Filter (Super Admin Only) */}
        {userRole === 'super_admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <Building2 size={15} color="#ec4899" />
            <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, outline: 'none', color: 'var(--text-primary)' }}>
              <option value="all">All Organisations</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Total Calls Found: <span style={{ color: '#7c3aed' }}>{processedEntries.length}</span>
        </div>
      </div>

      {/* Transcripts Table */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 0.8fr 1fr 1fr 0.8fr', padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          <span>Room ID</span>
          <span>Company / Tenant</span>
          <span>Date & Time</span>
          <span>Duration</span>
          <span>Line Ext</span>
          <span>Messages</span>
          <span>Transcript</span>
        </div>

        {paginatedEntries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No call records found matching active filters.
          </div>
        ) : (
          paginatedEntries.map(([roomId, roomData]) => {
            const hist = Array.isArray(roomData) ? roomData : roomData.messages || [];
            const lastActive = !Array.isArray(roomData) ? roomData.last_active : null;
            const formattedDate = lastActive ? new Date(lastActive * 1000).toLocaleString() : 'Recent';
            const msgs = hist.filter(m => m.role !== 'system');
            const compName = resolveCompanyName(roomData);

            return (
              <div key={roomId} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.2fr 0.8fr 1fr 1fr 0.8fr', padding: '16px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>{roomId.substring(0, 14)}...</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{compName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formattedDate}</div>
                <div style={{ fontWeight: 700 }}>{getCallDuration(hist)}</div>
                <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#6b21a8' }}>{roomData.extension || '1000'}</span></div>
                <div>{msgs.length} msgs</div>
                <div>
                  <button className="btn-primary" style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, background: '#7c3aed' }} onClick={() => onSelectRoom({ roomId, hist })}>
                    View
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar (Max 50 Transcripts Per Page) */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, processedEntries.length)} of {processedEntries.length} transcripts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn-ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-ghost"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
