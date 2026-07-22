import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Phone, Smartphone, Laptop, Trash2, RefreshCw, ShieldCheck, Settings, Lock, Key, Server, Globe } from 'lucide-react';

export default function CallConfigTab({ companyId, companies = [] }) {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for adding SIP device
  const [devName, setDevName] = useState('');
  const [devExt, setDevExt] = useState('');
  const [devUserId, setDevUserId] = useState('');
  const [devIp, setDevIp] = useState('10.7.11.141');
  const [devType, setDevType] = useState('Softphone');

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [newPassText, setNewPassText] = useState('');

  // Find active company matching selected project filter
  const activeCompany = companyId ? companies.find(c => String(c.id) === String(companyId)) : null;
  const rangeBoundsText = activeCompany
    ? `Ext ${activeCompany.range_start || 1000} to Ext ${activeCompany.range_end || 1009} (${activeCompany.name})`
    : 'Multi-Tenant System Scope';
  const callerExtText = activeCompany?.ai_extension
    ? `Ext ${activeCompany.ai_extension} - ${activeCompany.name}`
    : 'All Active AI Lines';

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const q = companyId ? `?company_id=${companyId}` : '';
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/devices${q}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchUsers = useCallback(async () => {
    try {
      const q = companyId ? `?company_id=${companyId}` : '';
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/users${q}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.users && data.users.length > 0) {
          setDevUserId(data.users[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDevices();
    fetchUsers();
  }, [fetchDevices, fetchUsers]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/user/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ventra_token')}`
        },
        body: JSON.stringify({
          user_id: devUserId || 'admin',
          name: devName,
          ip_address: devIp,
          extension: devExt,
          type: devType,
          status: 'Online',
          company_id: companyId ? parseInt(companyId) : null
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setDevName('');
        setDevExt('');
        fetchDevices();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.detail || 'Failed to add device'));
      }
    } catch (err) {
      alert('Failed to connect to backend: ' + err.message);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to delete this SIP phone endpoint?')) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/user/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` }
      });
      if (res.ok) {
        fetchDevices();
      }
    } catch (err) {
      alert('Error deleting device: ' + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!targetUserId || !newPassText) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:8001/api/admin/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('ventra_token')}` },
        body: JSON.stringify({ user_id: targetUserId, new_password: newPassText })
      });
      if (res.ok) {
        setShowPasswordModal(false);
        setNewPassText('');
        alert(`Password for user '${targetUserId}' updated successfully in PostgreSQL database! Super Admin view updated.`);
        fetchUsers();
      } else {
        const data = await res.json();
        alert('Error updating password: ' + (data.detail || 'Failed'));
      }
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Call Configuration & SIP Devices</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Configure Asterisk SIP trunks, register softphones (MicroSIP/Zoiper), and manage passwords & routing rules.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> + Register SIP Phone / Device
        </button>
      </div>

      {/* SIP Server & Softphone Provisioning Credentials Card */}
      <div style={{ padding: 24, borderRadius: 16, background: '#ffffff', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={18} color="#7c3aed" /> SIP Server Credentials & Softphone Provisions ({callerExtText})
          </h3>
          <button
            className="btn-ghost"
            onClick={() => {
              const myUserId = localStorage.getItem('ventra_user_id') || (users.length > 0 ? users[0].id : 'admin');
              setTargetUserId(myUserId);
              setShowPasswordModal(true);
            }}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#7c3aed', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Key size={14} /> Change Softphone Password
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SIP SERVER HOST : PORT</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4, fontFamily: 'monospace', color: '#7c3aed' }}>10.7.11.141:5061 (UDP)</div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>KEYPAD MENU TRIGGER</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>Press '1' on Keypad</div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ALLOWED RANGE BOUNDS</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>{rangeBoundsText}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SOFTPHONE PASSWORD</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4, letterSpacing: '0.2em' }}>••••••••</div>
          </div>
        </div>
      </div>

      {/* Configured SIP Phones & Endpoints Table */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={18} color="#ec4899" /> Registered SIP Phones & Softphone Endpoints
          </h3>
          <button className="btn-ghost" onClick={fetchDevices} style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Devices
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.5fr 1.2fr 1fr 0.8fr', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          <span>Device Name</span>
          <span>User ID</span>
          <span>Extension</span>
          <span>IP Address / Host</span>
          <span>Device Type</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {devices.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No custom SIP phones configured. Default softphone extensions 1000 & 1001 are active on local Asterisk gateway.
          </div>
        ) : (
          devices.map(d => (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.5fr 1.2fr 1fr 0.8fr', padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', fontSize: 13 }}>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {d.type === 'Softphone' ? <Laptop size={16} color="#7c3aed" /> : <Smartphone size={16} color="#ec4899" />}
                {d.name}
              </div>
              <div style={{ fontFamily: 'monospace' }}>{d.user_id}</div>
              <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#6b21a8' }}>Ext {d.extension}</span></div>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.ip_address}</div>
              <div style={{ fontSize: 12 }}>{d.type}</div>
              <div><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>{d.status || 'Online'}</span></div>
              <div>
                <button className="btn-ghost" onClick={() => handleDeleteDevice(d.id)} style={{ color: '#ef4444', padding: '4px 8px', borderRadius: 6 }} title="Delete Endpoint">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD DEVICE MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleAddDevice} style={{ background: '#ffffff', padding: 28, borderRadius: 20, maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Register SIP Phone / Softphone</h3>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Device Friendly Name</label>
              <input required placeholder="e.g. MicroSIP Desktop PC 1" value={devName} onChange={e => setDevName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, marginTop: 4 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>SIP Extension Number</label>
              <input required placeholder="e.g. 1000 or 1001" value={devExt} onChange={e => setDevExt(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, marginTop: 4 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Extension User</label>
              <select value={devUserId} onChange={e => setDevUserId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, marginTop: 4 }}>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>IP Address / Domain</label>
              <input required placeholder="10.7.11.141 or 192.168.1.50" value={devIp} onChange={e => setDevIp(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, marginTop: 4 }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Device Type</label>
              <select value={devType} onChange={e => setDevType(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, marginTop: 4 }}>
                <option value="Softphone">Softphone (MicroSIP / Zoiper)</option>
                <option value="Hardware Phone">Hardware IP Phone (Yealink / Cisco)</option>
                <option value="WebRTC">WebRTC Browser Phone</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: '#7c3aed', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Save Endpoint</button>
            </div>
          </form>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleChangePassword} style={{ background: '#ffffff', padding: 28, borderRadius: 20, maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="#7c3aed" /> Change Softphone User Password
            </h3>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Target User Account</label>
              <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, marginTop: 4 }}>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>New Password *</label>
              <input required type="password" placeholder="Enter new softphone password" value={newPassText} onChange={e => setNewPassText(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, marginTop: 4 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              🔒 Note: Updating this password immediately updates PostgreSQL and syncs live to Super Admin under Organisation Manage.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ background: '#7c3aed', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Update Password</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
