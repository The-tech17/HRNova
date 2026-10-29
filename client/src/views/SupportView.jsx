import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  MessageCircle,
  Shield,
  Send,
  X,
  FileQuestion,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API } from '../services/api';

export function SupportView() {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'admin';

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [faqCategories, setFaqCategories] = useState([]);
  const [selectedFaqCat, setSelectedFaqCat] = useState('All');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Queries State
  const [queries, setQueries] = useState([]);
  const [queryStats, setQueryStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [queryStatusFilter, setQueryStatusFilter] = useState('All');
  const [querySearch, setQuerySearch] = useState('');
  const [loadingQueries, setLoadingQueries] = useState(true);

  // Modals & Forms
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedQueryDetail, setSelectedQueryDetail] = useState(null);
  const [resolutionInput, setResolutionInput] = useState('');
  const [resolveStatus, setResolveStatus] = useState('Resolved');
  const [resolving, setResolving] = useState(false);

  // New Query Form State
  const initialQueryForm = {
    category: 'Benefits & Compensation',
    question: '',
    details: '',
    employee_name: user?.name || '',
    employee_email: user?.email || ''
  };
  const [formData, setFormData] = useState(initialQueryForm);
  const [formErrors, setFormErrors] = useState({});
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Fetch FAQs
  const fetchFaqs = async () => {
    try {
      const data = await API.getFaqs({
        category: selectedFaqCat,
        search: faqSearch
      });
      setFaqs(data.faqs || []);
      if (data.categories) setFaqCategories(data.categories);
      if (!expandedFaqId && data.faqs?.length > 0) {
        setExpandedFaqId(data.faqs[0].id);
      }
    } catch (e) {
      console.error('Failed to load FAQs:', e);
    }
  };

  // Fetch Support Queries
  const fetchQueries = async () => {
    try {
      setLoadingQueries(true);
      const data = await API.getQueries({
        status: queryStatusFilter,
        search: querySearch
      }, token);

      setQueries(data.queries || []);
      if (data.stats) setQueryStats(data.stats);
    } catch (e) {
      console.error('Failed to load queries:', e);
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [selectedFaqCat, faqSearch]);

  useEffect(() => {
    fetchQueries();
  }, [queryStatusFilter, querySearch]);

  // Form Validation
  const validateQueryForm = () => {
    const errs = {};
    if (!formData.question.trim() || formData.question.trim().length < 5) {
      errs.question = 'Please enter a clear question (min 5 characters).';
    }
    if (!formData.category.trim()) {
      errs.category = 'Please select a relevant category.';
    }
    if (!user) {
      if (!formData.employee_name.trim()) errs.employee_name = 'Please provide your name.';
      if (!formData.employee_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.employee_email)) {
        errs.employee_email = 'Valid corporate email is required.';
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Query
  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!validateQueryForm()) return;

    setSubmittingQuery(true);
    try {
      const data = await API.submitQuery({
        ...formData,
        employee_name: user?.name || formData.employee_name,
        employee_email: user?.email || formData.employee_email
      }, token);

      addToast(data.message || 'Support question submitted successfully!', 'success');
      setIsSubmitModalOpen(false);
      setFormData(initialQueryForm);
      fetchQueries();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Open Query Detail / Resolve Modal
  const handleOpenDetail = (q) => {
    setSelectedQueryDetail(q);
    setResolutionInput(q.resolution || '');
    setResolveStatus(q.status === 'Resolved' ? 'Resolved' : 'In Progress');
  };

  // Resolve Query by Admin
  const handleResolveQuery = async (e) => {
    e.preventDefault();
    if (!selectedQueryDetail) return;

    setResolving(true);
    try {
      const data = await API.resolveQuery(selectedQueryDetail.id, resolutionInput, resolveStatus, token, user?.name);
      addToast(data.message || 'Query updated successfully', 'success');
      setSelectedQueryDetail(null);
      fetchQueries();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>HR Support & Knowledge Base</h2>
          <p className="page-subtitle">
            Browse corporate guidelines, check company policies, or submit personalized HR inquiries.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setIsSubmitModalOpen(true)} id="btn-ask-hr-question">
            <PlusCircle size={18} />
            <span>Ask a Question</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: FAQ Section at the top (Feature 4 Requirement) */}
      <div className="card" style={{ marginBottom: '36px', border: '1px solid #e0e7ff', background: '#fafbff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: '#eef2ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Frequently Asked Questions</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Official HR company handbook, policies, and benefit summaries
              </p>
            </div>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              style={{ background: '#ffffff', padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
              placeholder="Search knowledge base..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              id="input-faq-search"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => setSelectedFaqCat('All')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: selectedFaqCat === 'All' ? 'var(--primary)' : '#ffffff',
              color: selectedFaqCat === 'All' ? '#ffffff' : 'var(--text-muted)',
              border: '1px solid var(--border-light)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            All Topics
          </button>
          {faqCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFaqCat(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: selectedFaqCat === cat ? 'var(--primary)' : '#ffffff',
                color: selectedFaqCat === cat ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-light)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              No FAQs matched your search.
            </div>
          ) : (
            faqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      color: isExpanded ? 'var(--primary)' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px' }}>
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 20px 18px',
                        fontSize: '0.88rem',
                        lineHeight: '1.6',
                        color: 'var(--text-muted)',
                        borderTop: '1px solid #f8fafc'
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: Employee Support Queries Tracker (Open / Resolved) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Employee Support Queries Tracker</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Check ticket status, resolution notes, and updates from the HR operations team.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="select-filter"
              value={queryStatusFilter}
              onChange={(e) => setQueryStatusFilter(e.target.value)}
              id="select-support-status-filter"
            >
              <option value="All">All Queries ({queryStats.total})</option>
              <option value="Open">Open ({queryStats.open})</option>
              <option value="In Progress">In Progress ({queryStats.inProgress})</option>
              <option value="Resolved">Resolved ({queryStats.resolved})</option>
            </select>
          </div>
        </div>

        {/* Queries List */}
        {loadingQueries ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading queries...
          </div>
        ) : queries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <FileQuestion size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>No Support Queries Found</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
              Have an unanswered question? Submit a new ticket and HR will respond directly.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setIsSubmitModalOpen(true)}>
              Ask a Question Now
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Question & Details</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((q) => {
                  const isOpen = q.status === 'Open';
                  const isInProgress = q.status === 'In Progress';
                  const isResolved = q.status === 'Resolved';

                  return (
                    <tr key={q.id}>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#f1f5f9', padding: '3px 10px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          {q.category}
                        </span>
                      </td>
                      <td style={{ maxWidth: '380px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {q.question}
                        </div>
                        {q.details && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {q.details}
                          </div>
                        )}
                        {q.resolution && (
                          <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#065f46', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            <span>HR Answered: "{q.resolution.substring(0, 45)}..."</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{q.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.employee_email}</div>
                      </td>
                      <td>
                        <span className={`badge ${isResolved ? 'badge-completed' : isOpen ? 'badge-urgent' : 'badge-progress'}`}>
                          {isOpen ? <AlertCircle size={12} /> : isResolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {q.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {q.created_at?.substring(0, 10)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenDetail(q)}
                        >
                          {isAdmin ? 'Manage / Answer' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Question Modal */}
      {isSubmitModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSubmitModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={22} color="var(--primary)" />
                Submit a Support Question
              </h3>
              <button className="modal-close-btn" onClick={() => setIsSubmitModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitQuery}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category <span className="req">*</span></label>
                  <select
                    className={`form-control ${formErrors.category ? 'error' : ''}`}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    id="select-query-category"
                  >
                    <option value="Benefits & Compensation">Benefits & Compensation</option>
                    <option value="Leave & Attendance">Leave & Attendance</option>
                    <option value="Payroll & Tax">Payroll & Tax</option>
                    <option value="Workplace & Policies">Workplace & Policies</option>
                    <option value="Career Development">Career Development</option>
                    <option value="General">General Inquiry</option>
                  </select>
                  {formErrors.category && <p className="form-error">{formErrors.category}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Your Question <span className="req">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.question ? 'error' : ''}`}
                    placeholder="e.g. How do I enroll my dependents into medical health coverage?"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    id="input-query-question"
                  />
                  {formErrors.question && <p className="form-error">{formErrors.question}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Details / Context</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Provide any specific background, policy numbers, or timeline considerations..."
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  />
                </div>

                {!user && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Your Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.employee_name ? 'error' : ''}`}
                        placeholder="Alex Rivera"
                        value={formData.employee_name}
                        onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                      />
                      {formErrors.employee_name && <p className="form-error">{formErrors.employee_name}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Work Email <span className="req">*</span></label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.employee_email ? 'error' : ''}`}
                        placeholder="alex.rivera@hrnova.com"
                        value={formData.employee_email}
                        onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                      />
                      {formErrors.employee_email && <p className="form-error">{formErrors.employee_email}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSubmitModalOpen(false)}
                  disabled={submittingQuery}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingQuery} id="btn-submit-support-query">
                  {submittingQuery ? 'Submitting...' : 'Submit Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Detail / HR Resolution Modal */}
      {selectedQueryDetail && (
        <div className="modal-overlay" onClick={() => setSelectedQueryDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {selectedQueryDetail.category}
                </span>
                <h3 style={{ fontSize: '1.2rem', marginTop: '6px' }}>{selectedQueryDetail.question}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedQueryDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--bg-muted)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '18px' }}>
                <span>From: <strong>{selectedQueryDetail.employee_name}</strong> ({selectedQueryDetail.employee_email})</span>
                <span>Status: <strong>{selectedQueryDetail.status}</strong></span>
              </div>

              {selectedQueryDetail.details && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Background Details
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: '#ffffff', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {selectedQueryDetail.details}
                  </div>
                </div>
              )}

              {/* Resolution details if already answered */}
              {selectedQueryDetail.resolution && (
                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: 'var(--radius-md)', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#047857', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} />
                    <span>Resolution from {selectedQueryDetail.resolved_by || 'HR Operations'}</span>
                    {selectedQueryDetail.resolved_at && <span style={{ fontWeight: 400, color: '#059669' }}>({selectedQueryDetail.resolved_at})</span>}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#064e3b', margin: 0, lineHeight: '1.6' }}>
                    {selectedQueryDetail.resolution}
                  </p>
                </div>
              )}

              {/* HR Admin Answer Form */}
              {isAdmin && (
                <form onSubmit={handleResolveQuery} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '18px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="var(--primary)" />
                    HR Specialist Response & Resolution
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Ticket Status</label>
                    <select
                      className="form-control"
                      value={resolveStatus}
                      onChange={(e) => setResolveStatus(e.target.value)}
                    >
                      <option value="Resolved">Resolved</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Open">Keep Open</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Answer / Resolution Guidance</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Type the answer for this inquiry here..."
                      value={resolutionInput}
                      onChange={(e) => setResolutionInput(e.target.value)}
                      id="input-query-resolution"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedQueryDetail(null)}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={resolving}
                      id="btn-save-query-resolution"
                    >
                      {resolving ? 'Saving...' : 'Save & Publish Resolution'}
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
