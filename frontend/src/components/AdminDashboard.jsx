import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './dashboard/Sidebar';
import Header from './dashboard/Header';
import TranscriptModal from './dashboard/TranscriptModal';
import OverviewTab from './dashboard/OverviewTab';
import AgentsTab from './dashboard/AgentsTab';
import AgentStudio from './dashboard/AgentStudio';
import CallAgentsTab from './dashboard/CallAgentsTab';
import CallConfigTab from './dashboard/CallConfigTab';
import UsersTab from './dashboard/UsersTab';
import OrganisationsTab from './dashboard/OrganisationsTab';
import ProjectManagementTab from './dashboard/ProjectManagementTab';
import RolesPermissionsTab from './dashboard/RolesPermissionsTab';
import DeploymentConfigTab from './dashboard/DeploymentConfigTab';
import BillingTab from './dashboard/BillingTab';

export default function AdminDashboard({ onBack, onStartCall }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tab, setTab] = useState(() => localStorage.getItem('ventra_admin_tab') || 'overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Role management
  const userRole = localStorage.getItem('ventra_user_role') || 'super_admin';
  const myCompanyId = localStorage.getItem('ventra_company_id');
  const [selectedCompanyId, setSelectedCompanyId] = useState(myCompanyId || '');
  const [companies, setCompanies] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Selected agent studio view state
  const [editingAgent, setEditingAgent] = useState(null);

  // Modals state
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Form states for creating company
  const [newCompName, setNewCompName] = useState('');
  const [newCompExt, setNewCompExt] = useState('');
  const [newCompStart, setNewCompStart] = useState('100');
  const [newCompEnd, setNewCompEnd] = useState('150');
  const [newCompModel, setNewCompModel] = useState('gemini');
  const [newCompModelName, setNewCompModelName] = useState('gemini-3.1-flash-lite');
  const [newCompAgentName, setNewCompAgentName] = useState('AI Assistant');
  const [newCompPrompt, setNewCompPrompt] = useState('');
  const [newCompVoice, setNewCompVoice] = useState('en-US-AriaNeural');
  const [newCompAdminId, setNewCompAdminId] = useState('');
  const [newCompAdminName, setNewCompAdminName] = useState('');
  const [newCompAdminPassword, setNewCompAdminPassword] = useState('');

  // Form states for creating user
  const [newUserId, setNewUserId] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('secret123');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('agent');
  const [newUserExt, setNewUserExt] = useState('');
  const [newUserCompanyId, setNewUserCompanyId] = useState(myCompanyId || '');

  // Health Status checking state
  const [serviceStatus, setServiceStatus] = useState({
    frontend: 'Online',
    backend: 'Online',
    livekit: 'Online',
    asterisk: 'Online',
    docker: 'Online'
  });

  useEffect(() => {
    if (tab) {
      localStorage.setItem('ventra_admin_tab', tab);
    }
  }, [tab]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/companies`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` } });
      if (res.ok) {
        const data = await res.json();
        const compList = data.companies || [];
        setCompanies(compList);
        
        // Restore active Agent Studio session if saved in localStorage
        const savedAgentId = localStorage.getItem('ventra_editing_agent_id');
        if (savedAgentId) {
          const restoredAgent = compList.find(c => String(c.id) === String(savedAgentId));
          if (restoredAgent) {
            setEditingAgent(restoredAgent);
          }
        }
        return compList;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const q = selectedCompanyId ? `?company_id=${selectedCompanyId}` : '';
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/users${q}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` } });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedCompanyId]);

  const fetchData = useCallback(async () => {
    try {
      const q = selectedCompanyId ? `?company_id=${selectedCompanyId}` : '';
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/rooms${q}`, { headers: { "Authorization": `Bearer ${localStorage.getItem("ventra_token")}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMetrics(data);
      setError('');
      setServiceStatus(prev => ({ ...prev, backend: 'Online' }));
      setLoading(false);
    } catch {
      setError('Operating via local database state.');
      setServiceStatus(prev => ({ ...prev, backend: 'Offline' }));
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, [fetchCompanies, fetchUsers]);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const timer = setInterval(fetchData, 5000);
      return () => clearInterval(timer);
    }
  }, [fetchData, autoRefresh]);

  const handleSelectAgent = (agentComp) => {
    setEditingAgent(agentComp);
    if (agentComp && agentComp.id) {
      localStorage.setItem('ventra_editing_agent_id', String(agentComp.id));
    } else {
      localStorage.removeItem('ventra_editing_agent_id');
    }
  };

  const handleBackFromStudio = () => {
    setEditingAgent(null);
    localStorage.removeItem('ventra_editing_agent_id');
  };

  const handleSaveAgentStudio = async (settings) => {
    try {
      const targetCompanyId = editingAgent?.id || selectedCompanyId || (companies && companies.length > 0 ? companies[0].id : null);
      if (targetCompanyId) {
        const targetComp = companies.find(c => String(c.id) === String(targetCompanyId)) || companies[0];
        const res = await fetch(`http://${window.location.hostname}:8001/api/admin/companies/${targetCompanyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` },
          body: JSON.stringify({
            name: targetComp?.name || 'Company',
            ai_extension: targetComp?.ai_extension || '1000',
            range_start: targetComp?.range_start || 1000,
            range_end: targetComp?.range_end || 1009,
            agent_name: targetComp?.agent_name || 'AI Assistant',
            agent_prompt: settings.prompt,
            agent_voice: settings.voice,
            ai_model: settings.model,
            ai_model_name: settings.model === 'ollama' ? 'llama3.1' : 'gemini-3.1-flash-lite',
            who_starts: settings.who_starts,
            greeting_msg: settings.greeting_msg,
            speech_speed: settings.speech_speed,
            speech_volume: settings.speech_volume,
            vad_threshold: settings.vad_threshold,
            min_endpointing_delay: settings.min_endpointing_delay,
            max_endpointing_delay: settings.max_endpointing_delay,
            allow_interruptions: settings.allow_interruptions,
            enable_backchanneling: settings.enable_backchanneling,
            backchannel_words: settings.backchannel_words,
            responsiveness: settings.responsiveness,
            interruption_sensitivity: settings.interruption_sensitivity
          })
        });
        if (res.ok) {
          alert('Agent Studio configuration saved & applied live to server!');
          const updatedList = await fetchCompanies();
          if (updatedList) {
            const updated = updatedList.find(c => String(c.id) === String(targetCompanyId));
            if (updated) {
              setEditingAgent(updated);
              localStorage.setItem('ventra_editing_agent_id', String(updated.id));
            }
          }
        } else {
          const errData = await res.json();
          alert('Error saving configuration: ' + (errData.detail || 'Failed'));
        }
      } else {
        alert('No company target selected to save configuration.');
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` },
        body: JSON.stringify({
          name: newCompName,
          ai_extension: newCompExt,
          range_start: parseInt(newCompStart),
          range_end: parseInt(newCompEnd),
          ai_model: newCompModel,
          ai_model_name: newCompModelName,
          agent_name: newCompAgentName,
          agent_prompt: newCompPrompt,
          agent_voice: newCompVoice,
          admin_id: newCompAdminId,
          admin_name: newCompAdminName,
          admin_password: newCompAdminPassword
        })
      });
      if (res.ok) {
        setShowCreateCompanyModal(false);
        fetchCompanies();
      }
    } catch (err) {
      alert('Error creating company: ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const targetCompany = companies.find(c => String(c.id) === String(newUserCompanyId || myCompanyId));
      if (targetCompany && newUserExt && targetCompany.range_start && targetCompany.range_end) {
        const extNum = parseInt(newUserExt);
        if (extNum < targetCompany.range_start || extNum > targetCompany.range_end) {
          alert(`❌ Extension ${newUserExt} is outside Super Admin granted quota range of ${targetCompany.range_start} to ${targetCompany.range_end} for ${targetCompany.name}!`);
          return;
        }
      }
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` },
        body: JSON.stringify({
          id: newUserId,
          password: newUserPassword,
          name: newUserName,
          ai_extension: newUserExt,
          role: newUserRole,
          company_id: newUserCompanyId ? parseInt(newUserCompanyId) : (myCompanyId ? parseInt(myCompanyId) : null)
        })
      });
      if (res.ok) {
        setShowCreateUserModal(false);
        setNewUserId('');
        setNewUserName('');
        setNewUserExt('');
        fetchUsers();
        alert('User account created successfully within Super Admin quota bounds!');
      } else {
        const data = await res.json();
        alert('Error creating user: ' + (data.detail || 'Failed'));
      }
    } catch (err) {
      alert('Error creating user: ' + err.message);
    }
  };

  // Filtered call logs
  const roomsEntries = metrics?.rooms ? Object.entries(metrics.rooms) : [];
  const filtered = roomsEntries.filter(([roomId]) => {
    if (search && !roomId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCallDuration = (hist) => {
    const msgs = (hist || []).filter(m => m.role !== 'system');
    if (msgs.length < 2) return '< 30s';
    const totalMs = msgs.reduce((acc, m) => acc + (m.latency_ms || 250), 0);
    return `${Math.round(totalMs / 1000) + 12}s`;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc', color: 'var(--text-primary)' }}>

      {/* Modal View Transcript */}
      {selectedRoom && (
        <TranscriptModal
          roomId={selectedRoom.roomId}
          history={selectedRoom.hist}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        userRole={userRole}
        selectedCompanyId={selectedCompanyId}
        setSelectedCompanyId={setSelectedCompanyId}
        companies={companies}
        tab={tab}
        setTab={setTab}
        onSelectAgent={handleSelectAgent}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onBack={onBack}
      />

      {/* Main Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header Bar */}
        <Header
          search={search}
          setSearch={setSearch}
          loading={loading}
          onRefresh={() => { setLoading(true); fetchData(); }}
          onStartCall={onStartCall}
        />

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28, width: '100%' }}>
          {tab === 'overview' && <OverviewTab metrics={metrics} serviceStatus={serviceStatus} />}

          {tab === 'agents' && (
            editingAgent ? (
              <AgentStudio
                editingAgent={editingAgent}
                onBack={handleBackFromStudio}
                onSave={handleSaveAgentStudio}
                onStartCall={onStartCall}
              />
            ) : (
              <AgentsTab
                companies={companies}
                onEditAgent={handleSelectAgent}
                onCreateAgent={() => setShowCreateCompanyModal(true)}
              />
            )
          )}

          {tab === 'call_agents' && <CallAgentsTab companies={companies} onStartCall={onStartCall} />}
          {tab === 'call_config' && <CallConfigTab companyId={selectedCompanyId} companies={companies} />}
          {tab === 'users' && <UsersTab usersList={usersList} onAddUser={() => setShowCreateUserModal(true)} />}
          {tab === 'organisations' && (
            <OrganisationsTab
              companies={companies}
              onCreateCompany={() => setShowCreateCompanyModal(true)}
              onManageCompany={(comp) => {
                setSelectedCompanyId(String(comp.id));
                handleSelectAgent(comp);
                setTab('agents');
              }}
            />
          )}
          {tab === 'projects' && (
            <ProjectManagementTab
              filtered={filtered}
              getCallDuration={getCallDuration}
              onSelectRoom={setSelectedRoom}
              companies={companies}
              userRole={userRole}
            />
          )}
          {tab === 'roles' && <RolesPermissionsTab />}
          {tab === 'deployment' && <DeploymentConfigTab />}
          {tab === 'billing' && <BillingTab metrics={metrics} userRole={userRole} companies={companies} />}
        </div>
      </div>

      {/* CREATE COMPANY / AGENT MODAL */}
      {showCreateCompanyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleCreateCompany} style={{ background: '#ffffff', padding: 28, borderRadius: 20, maxWidth: 540, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Create Organisation / AI Agent</h3>
            <input required placeholder="Organisation Name (e.g. Acme Corp)" value={newCompName} onChange={e => setNewCompName(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
            <input required placeholder="AI Line Extension (e.g. 201)" value={newCompExt} onChange={e => setNewCompExt(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <input required type="number" placeholder="Range Start (e.g. 100)" value={newCompStart} onChange={e => setNewCompStart(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
              <input required type="number" placeholder="Range End (e.g. 150)" value={newCompEnd} onChange={e => setNewCompEnd(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
            </div>
            <textarea placeholder="Custom Agent Prompt Directive (Optional)" value={newCompPrompt} onChange={e => setNewCompPrompt(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, height: 70 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowCreateCompanyModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: '#7c3aed', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Save Agent</button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleCreateUser} style={{ background: '#ffffff', padding: 28, borderRadius: 20, maxWidth: 460, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Add New User Account</h3>
            <input required placeholder="User ID (Username e.g. agent1)" value={newUserId} onChange={e => setNewUserId(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
            <input required placeholder="Full Name (e.g. John Doe)" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
            <input required placeholder="Softphone Password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
            <input placeholder="Assigned Extension (e.g. 101)" value={newUserExt} onChange={e => setNewUserExt(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }} />
            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}>
              <option value="agent">Agent / User</option>
              <option value="company_admin">Company Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowCreateUserModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: '#7c3aed', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Create User</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
