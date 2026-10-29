import React from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Inbox,
  HelpCircle,
  Shield,
  User,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentTab, setCurrentTab, mobileOpen, setMobileOpen, unreadInboxCount = 0 }) {
  const { user, switchRole, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    {
      id: 'inbox',
      label: 'HR Inbox',
      icon: Inbox,
      badge: unreadInboxCount > 0 ? unreadInboxCount : null,
      adminOnly: false // Both can see, admins see triage, employees see their submitted items
    },
    { id: 'support', label: 'HR Support & FAQs', icon: HelpCircle }
  ];

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 35,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-container">
            <div className="brand-icon-box">
              <Sparkles size={22} />
            </div>
            <div className="brand-text">
              <h1>HRNova</h1>
              <span>Enterprise HR</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.badge > 0 ? 'danger' : ''}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.8 }} />}
              </button>
            );
          })}

          <div className="nav-section-title" style={{ marginTop: '20px' }}>Role Context</div>
          <div style={{ padding: '0 8px' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--sidebar-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>Current View:</span>
                <span className={`user-role-badge ${user?.role || 'admin'}`}>
                  {isAdmin ? <Shield size={12} /> : <User size={12} />}
                  {isAdmin ? 'HR Admin' : 'Employee'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', lineHeight: '1.4', margin: 0 }}>
                {isAdmin
                  ? 'Full read/write permissions for employee records, projects, and HR inquiries.'
                  : 'Limited access to personal assignments, corporate directory, and query submission.'}
              </p>
            </div>
          </div>
        </nav>

        {/* Footer User Profile */}
        <div className="sidebar-footer">
          <div className="user-card-compact">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="user-avatar-img" />
            ) : (
              <div className="user-avatar-initials">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'HR'}
              </div>
            )}
            <div className="user-info-text">
              <div className="user-name">{user?.name || 'Guest User'}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{user?.email || 'hrnova.com'}</div>
            </div>
            <button
              title="Logout"
              onClick={logout}
              style={{
                color: '#94a3b8',
                padding: '6px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
