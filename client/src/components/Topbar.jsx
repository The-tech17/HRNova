import React from 'react';
import {
  Menu,
  MessageSquarePlus,
  Shield,
  UserCheck,
  Bell,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Topbar({ currentTab, onOpenContactHr, setMobileOpen }) {
  const { user, switchRole } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const tabLabels = {
    dashboard: 'Dashboard Overview',
    employees: 'Employee Directory & Records',
    projects: 'Project Management & Allocations',
    inbox: 'HR Inbox & Message Center',
    support: 'HR Knowledge Base & Support Queries'
  };

  const handleRoleToggle = async (role) => {
    try {
      await switchRole(role);
      addToast(`Switched view to ${role === 'admin' ? 'HR Admin (Sarah Jenkins)' : 'Employee (Alex Rivera)'}`, 'info');
    } catch (err) {
      addToast('Failed to switch role', 'error');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="page-breadcrumb">
          <span>HRNova</span>
          <span>/</span>
          <span className="current">{tabLabels[currentTab] || 'Dashboard'}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Role Toggle Selector */}
        <div className="role-switcher-banner" title="Switch roles to test permissions">
          <button
            type="button"
            className={`role-switch-btn ${isAdmin ? 'active' : ''}`}
            onClick={() => handleRoleToggle('admin')}
          >
            <Shield size={14} color={isAdmin ? 'var(--primary)' : 'inherit'} />
            <span>Admin</span>
          </button>
          <button
            type="button"
            className={`role-switch-btn ${!isAdmin ? 'active' : ''}`}
            onClick={() => handleRoleToggle('employee')}
          >
            <UserCheck size={14} color={!isAdmin ? 'var(--primary)' : 'inherit'} />
            <span>Employee</span>
          </button>
        </div>

        {/* Feature 3: Prominent Contact HR Button */}
        <button
          className="btn-contact-hr-quick"
          onClick={onOpenContactHr}
          id="btn-contact-hr-nav"
          title="Send a message directly to HR"
        >
          <MessageSquarePlus size={18} />
          <span>Contact HR</span>
        </button>
      </div>
    </header>
  );
}
