import React from 'react';
import {
  Bot, LogOut, LayoutDashboard, PhoneCall, Settings2, Users,
  Building2, FolderGit2, ShieldCheck, Cpu, CreditCard
} from 'lucide-react';

export const ALL_NAV_SECTIONS = [
  {
    group: null,
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'company_admin', 'agent'] }
    ]
  },
  {
    group: 'BUILD',
    items: [
      { id: 'agents', label: 'Agents', icon: Bot, roles: ['super_admin', 'company_admin'] }
    ]
  },
  {
    group: 'DEPLOY',
    items: [
      { id: 'call_agents', label: 'Call Agents', icon: PhoneCall, roles: ['super_admin', 'company_admin', 'agent'] },
      { id: 'call_config', label: 'Call Configuration', icon: Settings2, roles: ['super_admin', 'company_admin'] }
    ]
  },
  {
    group: 'USER MANAGEMENT',
    items: [
      { id: 'users', label: 'Users', icon: Users, roles: ['super_admin', 'company_admin'] },
      { id: 'organisations', label: 'Organisations', icon: Building2, roles: ['super_admin'] },
      { id: 'projects', label: 'Project Management', icon: FolderGit2, roles: ['super_admin', 'company_admin', 'agent'] },
      { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, roles: ['super_admin'] }
    ]
  },
  {
    group: 'SYSTEM',
    items: [
      { id: 'deployment', label: 'Deployment Config', icon: Cpu, roles: ['super_admin'] },
      { id: 'billing', label: 'Billing & Spending', icon: CreditCard, roles: ['super_admin', 'company_admin'] }
    ]
  }
];

export default function Sidebar({
  userRole,
  selectedCompanyId,
  setSelectedCompanyId,
  companies,
  tab,
  setTab,
  onSelectAgent,
  autoRefresh,
  setAutoRefresh,
  onBack
}) {
  // Filter sections by role
  const allowedSections = ALL_NAV_SECTIONS.map(sec => {
    const filteredItems = sec.items.filter(item => item.roles.includes(userRole));
    return { ...sec, items: filteredItems };
  }).filter(sec => sec.items.length > 0);

  return (
    <aside style={{
      width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#ffffff', borderRight: '1px solid rgba(236,72,153,0.08)', overflowY: 'auto'
    }}>

      {/* Brand Header */}
      <div style={{ padding: '20px 18px', borderBottom: '1px solid rgba(236,72,153,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(236,72,153,0.2)'
        }}>
          <Bot size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {userRole === 'super_admin' ? 'AI Voice Agent' : `${localStorage.getItem('ventra_user_name') || 'Company'} Console`}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4, fontWeight: 700 }}>AI Voice Agent Console</div>
        </div>
      </div>

      {/* Project Selector (Super Admin Only) */}
      {userRole === 'super_admin' && (
        <div style={{ padding: '14px 16px 6px', borderBottom: '1px solid rgba(236,72,153,0.04)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Project Filter</div>
          <select
            value={selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
              fontSize: 12, fontWeight: 700, background: '#f8fafc', color: 'var(--text-primary)', outline: 'none'
            }}
          >
            <option value="">All Projects / Organisations</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grouped Nav Items */}
      <nav style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {allowedSections.map((sec, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sec.group && (
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '4px 12px 2px', textTransform: 'uppercase' }}>
                {sec.group}
              </div>
            )}
            {sec.items.map(({ id, label, icon: Icon }) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setTab(id); if (onSelectAgent) onSelectAgent(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 12, width: '100%', textAlign: 'left',
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    color: isActive ? '#7c3aed' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={17} color={isActive ? '#7c3aed' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Auto Refresh Toggle */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(236,72,153,0.08)', background: 'rgba(236,72,153,0.01)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Auto-Refresh Telemetry</span>
          <div onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              width: 36, height: 20, borderRadius: 999, position: 'relative', cursor: 'pointer',
              background: autoRefresh ? '#7c3aed' : '#cbd5e1', transition: 'background 0.2s'
            }}>
            <span style={{
              position: 'absolute', top: 2, left: autoRefresh ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
            }} />
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div style={{ padding: '12px 14px' }}>
        <button className="btn-ghost" onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
            padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700
          }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
