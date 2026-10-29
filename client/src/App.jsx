import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ContactHrModal } from './components/ContactHrModal';

import { DashboardView } from './views/DashboardView';
import { EmployeesView } from './views/EmployeesView';
import { ProjectsView } from './views/ProjectsView';
import { HrInboxView } from './views/HrInboxView';
import { SupportView } from './views/SupportView';

function AppContent() {
  const { user, authHeaders } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isContactHrOpen, setIsContactHrOpen] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  // Poll or refresh inbox count for notification badge
  const refreshInboxCount = async () => {
    try {
      const res = await fetch('/api/hr-requests', {
        headers: authHeaders()
      });
      const data = await res.json();
      if (res.ok && data.stats) {
        setUnreadInboxCount(data.stats.new || 0);
      }
    } catch (e) {
      // ignore background badge error
    }
  };

  useEffect(() => {
    refreshInboxCount();
    const interval = setInterval(refreshInboxCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        unreadInboxCount={unreadInboxCount}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Sticky Topbar */}
        <Topbar
          currentTab={currentTab}
          onOpenContactHr={() => setIsContactHrOpen(true)}
          setMobileOpen={setMobileOpen}
        />

        {/* View Routing */}
        <main style={{ flex: 1 }}>
          {currentTab === 'dashboard' && (
            <DashboardView
              setCurrentTab={setCurrentTab}
              onOpenContactHr={() => setIsContactHrOpen(true)}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesView />
          )}

          {currentTab === 'projects' && (
            <ProjectsView />
          )}

          {currentTab === 'inbox' && (
            <HrInboxView
              onOpenContactHr={() => setIsContactHrOpen(true)}
            />
          )}

          {currentTab === 'support' && (
            <SupportView />
          )}
        </main>
      </div>

      {/* Global Contact HR Modal */}
      <ContactHrModal
        isOpen={isContactHrOpen}
        onClose={() => setIsContactHrOpen(false)}
        onSuccess={refreshInboxCount}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
