import React, { useState, useEffect } from 'react';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  MessageSquare,
  Shield,
  User,
  Trash2,
  X,
  Send,
  CornerDownRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API } from '../services/api';

export function HrInboxView({ onOpenContactHr }) {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, underReview: 0, resolved: 0, urgentPending: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Selected request for details modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await API.getHrRequests({
        status: statusFilter,
        urgency: urgencyFilter,
        search
      }, token, user);

      setRequests(data.requests || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Fetch HR requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, urgencyFilter, search]);

  const handleOpenDetail = (req) => {
    setSelectedRequest(req);
    setAdminReply(req.admin_reply || '');
    setReplyStatus(req.status === 'Resolved' ? 'Resolved' : 'Under Review');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setUpdating(true);
    try {
      const data = await API.updateHrRequestStatus(selectedRequest.id, replyStatus, adminReply, token);
      addToast(data.message || 'Request updated', 'success');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!confirm('Are you sure you want to delete this message from the inbox?')) return;
    try {
      const data = await API.deleteHrRequest(id, token);
      addToast(data.message || 'Message removed from inbox', 'success');
      if (selectedRequest?.id === id) setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Urgent':
        return <span className="badge badge-urgent"><AlertTriangle size={12} /> Urgent</span>;
      case 'High':
        return <span className="badge badge-high">High</span>;
      case 'Medium':
        return <span className="badge badge-medium">Medium</span>;
      default:
        return <span className="badge badge-low">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>New</span>;
      case 'Under Review':
        return <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>Under Review</span>;
      case 'Resolved':
        return <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>Resolved</span>;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>HR Inbox & Message Center</h2>
          <p className="page-subtitle">
            {isAdmin
              ? 'Triage incoming employee inquiries, benefits questions, and urgent HR escalations.'
              : 'Track the status and HR specialist responses for your submitted requests.'}
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={onOpenContactHr} id="btn-inbox-new-message">
            <MessageSquare size={18} />
            <span>New Message to HR</span>
          </button>
        </div>
      </div>

      {/* Inbox Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>New Messages</span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '6px' }}>{stats.new}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting initial triage</p>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Urgent Escalations</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>{stats.urgentPending}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate attention needed</p>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Under Review</span>
            <Clock size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>{stats.underReview}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned to specialist</p>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolved</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>{stats.resolved}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed inquiries</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by subject, employee name, or message keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-inbox-search"
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
              id="select-inbox-status"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Urgency:</span>
            <select
              className="select-filter"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              id="select-inbox-urgency"
            >
              <option value="All">All Urgencies</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List / Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading inbox messages...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Inbox size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>HR Inbox is Clear</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 18px' }}>
            {search || statusFilter !== 'All' || urgencyFilter !== 'All'
              ? 'No requests match your current filters.'
              : 'All employee questions and requests have been addressed.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject & Preview</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Date Received</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  style={{ cursor: 'pointer', background: req.status === 'New' ? '#fdfdfe' : 'transparent' }}
                  onClick={() => handleOpenDetail(req)}
                >
                  <td style={{ minWidth: '180px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {req.sender_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {req.sender_email}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: req.status === 'New' ? 700 : 500, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                      {req.subject}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '440px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {req.message}
                    </div>
                  </td>
                  <td>
                    {getUrgencyBadge(req.urgency)}
                  </td>
                  <td>
                    {getStatusBadge(req.status)}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {req.created_at?.substring(0, 16)}
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenDetail(req)}
                      >
                        Review
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-icon danger"
                          title="Delete message"
                          onClick={() => handleDeleteRequest(req.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Message Review & Reply Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {getUrgencyBadge(selectedRequest.urgency)}
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <h3 style={{ fontSize: '1.25rem' }}>{selectedRequest.subject}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedRequest(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Sender Metadata Box */}
              <div style={{ background: 'var(--bg-muted)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{selectedRequest.sender_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedRequest.sender_email} • {selectedRequest.sender_role || 'Staff'}</div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Submitted on<br />
                  <strong>{selectedRequest.created_at}</strong>
                </div>
              </div>

              {/* Message Content */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Employee Message
                </h4>
                <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: '#ffffff', fontSize: '0.92rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {selectedRequest.message}
                </div>
              </div>

              {/* Existing HR Reply if any */}
              {selectedRequest.admin_reply && (
                <div style={{ marginBottom: '20px', padding: '14px 18px', borderRadius: 'var(--radius-md)', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#047857', marginBottom: '6px' }}>
                    <CheckCircle2 size={15} />
                    <span>Official HR Response</span>
                    {selectedRequest.resolved_at && <span style={{ fontWeight: 400, color: '#059669' }}>({selectedRequest.resolved_at})</span>}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#064e3b', margin: 0, lineHeight: '1.5' }}>
                    {selectedRequest.admin_reply}
                  </p>
                </div>
              )}

              {/* Admin Actions Panel */}
              {isAdmin && (
                <form onSubmit={handleUpdateStatus} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="var(--primary)" />
                    HR Specialist Triage & Resolution
                  </h4>

                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Update Status</label>
                      <select
                        className="form-control"
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value)}
                        id="select-triage-status"
                      >
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="New">Mark as New</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Response Notes / Resolution Message to Employee</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="e.g. Reviewed and approved for the upcoming payroll cycle. Thank you!"
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      id="input-triage-reply"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedRequest(null)}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updating}
                      id="btn-save-triage"
                    >
                      {updating ? 'Saving...' : 'Save & Update Status'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
