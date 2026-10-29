import React, { useState } from 'react';
import { X, Send, AlertTriangle, Clock, HelpCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API } from '../services/api';

export function ContactHrModal({ isOpen, onClose, onSuccess }) {
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    urgency: 'Medium',
    sender_name: user?.name || '',
    sender_email: user?.email || '',
    sender_role: user?.department ? `${user.role} - ${user.department}` : ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.subject.trim()) errs.subject = 'Please enter a clear subject for your request.';
    else if (formData.subject.trim().length < 4) errs.subject = 'Subject should be at least 4 characters.';

    if (!formData.message.trim()) errs.message = 'Please provide details in the message field.';
    else if (formData.message.trim().length < 10) errs.message = 'Message must be at least 10 characters long.';

    if (!user) {
      if (!formData.sender_name.trim()) errs.sender_name = 'Please enter your full name.';
      if (!formData.sender_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.sender_email)) {
        errs.sender_email = 'Please provide a valid company email address.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await API.submitContactHr({
        ...formData,
        sender_name: user ? user.name : formData.sender_name,
        sender_email: user ? user.email : formData.sender_email
      }, token);

      addToast(data.message || 'Request submitted to HR team successfully!', 'success');
      setFormData({
        subject: '',
        message: '',
        urgency: 'Medium',
        sender_name: user?.name || '',
        sender_email: user?.email || '',
        sender_role: ''
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const urgencyOptions = [
    { value: 'Low', label: 'Low', desc: 'General question or informational request', color: '#64748b' },
    { value: 'Medium', label: 'Medium', desc: 'Standard turnaround (within 48 hrs)', color: '#2563eb' },
    { value: 'High', label: 'High', desc: 'Important time-sensitive issue (24 hrs)', color: '#ea580c' },
    { value: 'Urgent', label: 'Urgent', desc: 'Critical payroll/emergency block', color: '#dc2626' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Send size={22} color="var(--primary)" />
              Contact HR Team
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Send an inquiry or request directly to People Operations
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {!user && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.sender_name ? 'error' : ''}`}
                    placeholder="e.g. Liam Vance"
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  />
                  {errors.sender_name && <p className="form-error">{errors.sender_name}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Work Email <span className="req">*</span></label>
                  <input
                    type="email"
                    className={`form-control ${errors.sender_email ? 'error' : ''}`}
                    placeholder="e.g. liam@hrnova.com"
                    value={formData.sender_email}
                    onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                  />
                  {errors.sender_email && <p className="form-error">{errors.sender_email}</p>}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Subject <span className="req">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.subject ? 'error' : ''}`}
                placeholder="Brief summary of your inquiry (e.g. Equipment reimbursement request)"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
              {errors.subject && <p className="form-error">{errors.subject}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Urgency Level <span className="req">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {urgencyOptions.map((opt) => {
                  const isSelected = formData.urgency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgency: opt.value })}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-light)',
                        background: isSelected ? `${opt.color}10` : '#ffffff',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: opt.color }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Selected: <strong>{formData.urgency}</strong> — {urgencyOptions.find(o => o.value === formData.urgency)?.desc}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Message Details <span className="req">*</span></label>
              <textarea
                rows={5}
                className={`form-control ${errors.message ? 'error' : ''}`}
                placeholder="Describe your request in detail. Include any relevant dates, links, or documentation requirements..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              {errors.message && <p className="form-error">{errors.message}</p>}
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={16} />
              <span>HR specialists triage tickets Monday–Friday. Urgent tickets are addressed with priority alerting.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Send to HR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
