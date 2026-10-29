import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderKanban,
  HelpCircle,
  Inbox,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Shield,
  User,
  Plus,
  Send,
  Sparkles,
  PieChart,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function DashboardView({ setCurrentTab, onOpenContactHr }) {
  const { user, authHeaders } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats', {
        headers: authHeaders()
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to fetch dashboard metrics');
      setData(resData);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading HRNova Dashboard metrics...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    openQueries: 0,
    resolvedQueries: 0,
    totalQueries: 0,
    newHrRequests: 0,
    totalHrRequests: 0
  };

  const charts = data?.charts || {};
  const deptDist = charts.departmentDistribution || [];
  const projectDist = charts.projectStatusDistribution || [];
  const maxDeptCount = deptDist.length > 0 ? Math.max(...deptDist.map(d => d.count)) : 1;

  // Donut chart calculations for Projects
  const totalProj = summary.totalProjects || 1;
  const inProgPercent = Math.round((summary.activeProjects / totalProj) * 100);
  const compPercent = Math.round((summary.completedProjects / totalProj) * 100);
  const notStartPercent = Math.max(0, 100 - inProgPercent - compPercent);

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px' }}>
              <Sparkles size={14} color="#38bdf8" />
              <span>Smart People & Project Operations</span>
            </div>
            <h2 style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
              Welcome back, {user?.name || 'Team Member'}
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginTop: '6px', maxWidth: '640px' }}>
              {isAdmin
                ? `You are logged in as HR Administrator (${user?.role}). You have full administrative control over employee records, projects, and incoming support inquiries.`
                : `You are logged in as an Employee (${user?.department || 'Design'}). Browse company updates, review your assigned project milestones, or contact HR for support.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin ? (
              <>
                <button
                  className="btn btn-primary"
                  style={{ background: '#ffffff', color: '#1e1b4b', fontWeight: 700 }}
                  onClick={() => setCurrentTab('employees')}
                >
                  <Users size={16} />
                  <span>Manage Employees</span>
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}
                  onClick={() => setCurrentTab('inbox')}
                >
                  <Inbox size={16} />
                  <span>HR Inbox ({summary.newHrRequests})</span>
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 700 }}
                onClick={onOpenContactHr}
              >
                <Send size={16} />
                <span>Contact HR Team</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature 5 Requirement: Summary KPI Cards */}
      <div className="kpi-grid">
        {/* Card 1: Total Employees */}
        <div className="kpi-card" onClick={() => setCurrentTab('employees')} style={{ cursor: 'pointer' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Total Employees</span>
            <div className="kpi-icon-wrapper" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <Users size={24} />
            </div>
          </div>
          <div className="kpi-value">{summary.totalEmployees}</div>
          <div className="kpi-subtext">
            <span style={{ color: '#059669', fontWeight: 700 }}>{summary.activeEmployees} active</span>
            <span>•</span>
            <span style={{ color: '#d97706', fontWeight: 600 }}>{summary.onLeaveEmployees} on leave</span>
          </div>
        </div>

        {/* Card 2: Active Projects */}
        <div className="kpi-card" onClick={() => setCurrentTab('projects')} style={{ cursor: 'pointer' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Active Projects</span>
            <div className="kpi-icon-wrapper" style={{ background: '#f0fdf4', color: '#10b981' }}>
              <FolderKanban size={24} />
            </div>
          </div>
          <div className="kpi-value">{summary.activeProjects}</div>
          <div className="kpi-subtext">
            <span style={{ color: '#10b981', fontWeight: 700 }}>{summary.completedProjects} completed</span>
            <span>•</span>
            <span>{summary.totalProjects} total initiatives</span>
          </div>
        </div>

        {/* Card 3: Open HR Queries */}
        <div className="kpi-card" onClick={() => setCurrentTab('support')} style={{ cursor: 'pointer' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Open HR Queries</span>
            <div className="kpi-icon-wrapper" style={{ background: '#fffbeb', color: '#f59e0b' }}>
              <HelpCircle size={24} />
            </div>
          </div>
          <div className="kpi-value">{summary.openQueries}</div>
          <div className="kpi-subtext">
            <span style={{ color: '#059669', fontWeight: 700 }}>{summary.resolvedQueries} resolved</span>
            <span>•</span>
            <span>{summary.totalQueries} total logged</span>
          </div>
        </div>

        {/* Card 4: HR Inbox Messages */}
        <div className="kpi-card" onClick={() => setCurrentTab('inbox')} style={{ cursor: 'pointer' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">HR Inbox Requests</span>
            <div className="kpi-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <Inbox size={24} />
            </div>
          </div>
          <div className="kpi-value">{summary.newHrRequests}</div>
          <div className="kpi-subtext">
            <span style={{ color: '#ef4444', fontWeight: 700 }}>New messages</span>
            <span>•</span>
            <span>{summary.totalHrRequests} total received</span>
          </div>
        </div>
      </div>

      {/* Feature 5 Requirement: Simple Interactive Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Chart 1: Department Staff Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem' }}>Employees by Department</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{summary.totalEmployees} staff members</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {deptDist.map((item, index) => {
              const widthPct = Math.round((item.count / maxDeptCount) * 100);
              const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
              const barColor = colors[index % colors.length];

              return (
                <div key={item.department}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{item.department}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.count} staff ({Math.round((item.count / (summary.totalEmployees || 1)) * 100)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '9px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${widthPct}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '999px',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Project Initiatives Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem' }}>Project Initiatives Breakdown</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{summary.totalProjects} total</span>
          </div>

          {/* Donut representation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.8"
                />
                {/* Completed Stroke (green) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray={`${compPercent}, 100`}
                />
                {/* In Progress Stroke (blue) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.8"
                  strokeDasharray={`${inProgPercent}, 100`}
                  strokeDashoffset={`-${compPercent}`}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{summary.totalProjects}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projects</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }} />
                <span>In Progress: <strong>{summary.activeProjects}</strong> ({inProgPercent}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
                <span>Completed: <strong>{summary.completedProjects}</strong> ({compPercent}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b' }} />
                <span>Not Started: <strong>{summary.notStartedProjects}</strong> ({notStartPercent}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Specific View: Assigned Projects & Shortcuts */}
      {!isAdmin && data?.myProjects && data.myProjects.length > 0 && (
        <div className="card" style={{ marginBottom: '32px', border: '1px solid #bfdbfe', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e3a8a' }}>My Assigned Projects</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('projects')}>
              View All Projects
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {data.myProjects.map((p) => (
              <div key={p.id} style={{ background: '#ffffff', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className={`badge ${p.status === 'Completed' ? 'badge-completed' : 'badge-progress'}`}>{p.status}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Due {p.deadline}</span>
                </div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '6px 0' }}>{p.title}</h4>
                <div className="progress-bar-container" style={{ margin: '8px 0 4px' }}>
                  <div className="progress-bar-fill progress-fill-blue" style={{ width: `${p.progress}%` }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.progress}% completed</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities & Upcoming Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Upcoming Deadlines */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem' }}>Upcoming Project Deadlines</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('projects')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
              data.upcomingDeadlines.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-muted)'
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.subtitle}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    {item.timestamp}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No upcoming project deadlines.</p>
            )}
          </div>
        </div>

        {/* Recent Support Inquiries */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem' }}>Recent Support Inquiries</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('support')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.recentQueries && data.recentQueries.length > 0 ? (
              data.recentQueries.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-muted)'
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged {item.timestamp?.substring(0, 10)}</div>
                  </div>
                  <span className={`badge ${item.subtitle === 'Resolved' ? 'badge-completed' : 'badge-progress'}`}>
                    {item.subtitle}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No support inquiries logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
