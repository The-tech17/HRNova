import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  Percent,
  Sliders,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API } from '../services/api';

export function ProjectsView() {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, notStarted: 0, avgProgress: 0 });
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [myOnly, setMyOnly] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  // Form State
  const initialFormState = {
    title: '',
    description: '',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'In Progress',
    progress: 25,
    priority: 'Medium',
    department: 'Engineering',
    assignedEmployeeIds: []
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await API.getProjects({
        status: statusFilter,
        search
      });
      setProjects(data.projects || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees list for project assignment multi-select
  const fetchEmployeesList = async () => {
    try {
      const data = await API.getEmployees();
      if (data.employees) {
        setAllEmployees(data.employees);
      }
    } catch (e) {
      console.error('Failed to load employees for assignment:', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployeesList();
  }, [statusFilter, search]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (proj) => {
    setEditingProject(proj);
    setFormData({
      title: proj.title,
      description: proj.description || '',
      deadline: proj.deadline,
      status: proj.status,
      progress: proj.progress || 0,
      priority: proj.priority || 'Medium',
      department: proj.department || 'Engineering',
      assignedEmployeeIds: (proj.assignedEmployees || []).map(e => e.id)
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Toggle Employee Assignment in Form
  const toggleEmployeeAssignment = (empId) => {
    setFormData((prev) => {
      const exists = prev.assignedEmployeeIds.includes(empId);
      return {
        ...prev,
        assignedEmployeeIds: exists
          ? prev.assignedEmployeeIds.filter(id => id !== empId)
          : [...prev.assignedEmployeeIds, empId]
      };
    });
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Project title is required (min 3 characters).';
    }
    if (!formData.deadline) {
      errs.deadline = 'Target completion deadline is required.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let data;
      if (editingProject) {
        data = await API.updateProject(editingProject.id, formData, token);
      } else {
        data = await API.addProject(formData, token);
      }

      addToast(data.message || 'Project saved successfully!', 'success');
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Updater
  const handleQuickStatus = async (projectId, newStatus) => {
    try {
      await API.updateProjectStatus(projectId, newStatus, token);
      addToast(`Project marked as ${newStatus}`, 'success');
      fetchProjects();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Delete project
  const handleConfirmDelete = async () => {
    if (!deletingProject) return;

    try {
      const data = await API.deleteProject(deletingProject.id, token);
      addToast(data.message || 'Project deleted', 'success');
      setDeletingProject(null);
      fetchProjects();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Filter projects by "my assigned" if toggled
  const displayedProjects = projects.filter(p => {
    if (!myOnly) return true;
    if (!user) return true;
    return (p.assignedEmployees || []).some(e => e.email === user.email || e.name === user.name);
  });

  // Calculate days remaining helper
  const getDaysRemaining = (deadlineStr) => {
    const target = new Date(deadlineStr);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Project Management</h2>
          <p className="page-subtitle">
            Track strategic company initiatives, cross-functional employee assignments, and deliverables.
          </p>
        </div>

        <div className="page-actions">
          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenCreate} id="btn-create-project">
              <Plus size={18} />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Overview Section (Feature 2 Requirement) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Projects</span>
            <FolderKanban size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.inProgress}</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Under active development</p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{stats.completed}</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Shipped initiatives</p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Not Started</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{stats.notStarted}</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>In queue / planning</p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg. Progress</span>
            <Percent size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.avgProgress}%</div>
          <div className="progress-bar-container" style={{ margin: '8px 0 2px' }}>
            <div
              className="progress-bar-fill progress-fill-emerald"
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search projects by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-project-search"
          />
        </div>

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="select-project-status-filter"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Not Started">Not Started</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {!isAdmin && (
            <button
              className={`btn btn-sm ${myOnly ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMyOnly(!myOnly)}
            >
              {myOnly ? 'Showing: My Projects' : 'Show Only My Projects'}
            </button>
          )}
        </div>
      </div>

      {/* Projects Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading projects...</p>
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <FolderKanban size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No Projects Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 18px' }}>
            No project matches the current criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {displayedProjects.map((proj) => {
            const daysLeft = getDaysRemaining(proj.deadline);
            const isCompleted = proj.status === 'Completed';
            const isInProgress = proj.status === 'In Progress';

            return (
              <div
                key={proj.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${isCompleted ? '#10b981' : isInProgress ? '#3b82f6' : '#f59e0b'}`
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <span className={`badge ${isCompleted ? 'badge-completed' : isInProgress ? 'badge-progress' : 'badge-notstarted'}`}>
                        {proj.status}
                      </span>
                      {proj.priority && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '8px', textTransform: 'uppercase' }}>
                          • {proj.priority} Priority
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          title="Edit Project"
                          onClick={() => handleOpenEdit(proj)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Delete Project"
                          onClick={() => setDeletingProject(proj)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Project Title & Description */}
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                    {proj.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', minHeight: '44px', marginBottom: '18px' }}>
                    {proj.description || 'No detailed description provided for this project.'}
                  </p>

                  {/* Progress Bar & Percentage */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontWeight: 700, color: isCompleted ? '#059669' : 'var(--text-main)' }}>
                        {proj.progress}%
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className={`progress-bar-fill ${isCompleted ? 'progress-fill-emerald' : proj.progress > 40 ? 'progress-fill-blue' : 'progress-fill-amber'}`}
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned Team Members */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Assigned Team ({proj.assignedEmployees?.length || 0})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      {proj.assignedEmployees && proj.assignedEmployees.length > 0 ? (
                        proj.assignedEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            title={`${emp.name} — ${emp.role} (${emp.department})`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#f1f5f9',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--text-main)'
                            }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
                            <span>{emp.name}</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          No employees assigned yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Deadline & Quick status toggle */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: daysLeft < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    <Calendar size={15} />
                    <span>
                      {proj.deadline}
                      {daysLeft < 0 ? ' (Overdue)' : daysLeft === 0 ? ' (Due today)' : ` (${daysLeft}d left)`}
                    </span>
                  </div>

                  {/* Fast status trigger */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {!isCompleted ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickStatus(proj.id, 'Completed')}
                        title="Mark as Completed"
                      >
                        <Check size={14} />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickStatus(proj.id, 'In Progress')}
                        title="Reopen project"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Title <span className="req">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.title ? 'error' : ''}`}
                    placeholder="e.g. Mobile App Redesign 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    id="input-project-title"
                  />
                  {formErrors.title && <p className="form-error">{formErrors.title}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Key objectives, milestones, deliverables..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Target Deadline <span className="req">*</span></label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.deadline ? 'error' : ''}`}
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      id="input-project-deadline"
                    />
                    {formErrors.deadline && <p className="form-error">{formErrors.deadline}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status <span className="req">*</span></label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setFormData({
                          ...formData,
                          status: newStatus,
                          progress: newStatus === 'Completed' ? 100 : formData.progress
                        });
                      }}
                      id="select-modal-project-status"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Progress: {formData.progress}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value, 10) })}
                      style={{ width: '100%', marginTop: '10px', accentColor: 'var(--primary)' }}
                    />
                  </div>
                </div>

                {/* Assign Employees Section */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Assign Team Members ({formData.assignedEmployeeIds.length} selected)</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click to add/remove</span>
                  </label>
                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px'
                    }}
                  >
                    {allEmployees.map((emp) => {
                      const isAssigned = formData.assignedEmployeeIds.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggleEmployeeAssignment(emp.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: isAssigned ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                            background: isAssigned ? '#eef2ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {emp.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {emp.department}
                            </div>
                          </div>
                          {isAssigned && <Check size={16} color="var(--primary)" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-save-project">
                  {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation */}
      {deletingProject && (
        <div className="modal-overlay" onClick={() => setDeletingProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Delete Project</h3>
              <button className="modal-close-btn" onClick={() => setDeletingProject(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                Are you sure you want to delete <strong>{deletingProject.title}</strong>?
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                All assignment linkages will be removed. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingProject(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} id="btn-confirm-delete-project">
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
