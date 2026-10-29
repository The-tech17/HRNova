import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Briefcase,
  Calendar,
  Building,
  CheckCircle,
  AlertCircle,
  X,
  Phone,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API } from '../services/api';

export function EmployeesView() {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  // Form State
  const initialFormState = {
    name: '',
    employee_id: '',
    email: '',
    department: 'Engineering',
    role: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    phone: '',
    location: 'San Francisco, CA'
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await API.getEmployees({
        search,
        department: selectedDept,
        status: selectedStatus
      });

      setEmployees(data.employees || []);
      if (data.departments && data.departments.length > 0) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept, selectedStatus]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      ...initialFormState,
      employee_id: `HRN-${Math.floor(100 + Math.random() * 900)}`
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      employee_id: emp.employee_id,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      joining_date: emp.joining_date,
      status: emp.status,
      phone: emp.phone || '',
      location: emp.location || 'San Francisco, CA'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Full name is required (min 2 characters).';
    }
    if (!formData.employee_id.trim() || formData.employee_id.trim().length < 3) {
      errs.employee_id = 'Employee ID is required (e.g. HRN-101).';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.department.trim()) {
      errs.department = 'Department is required.';
    }
    if (!formData.role.trim() || formData.role.trim().length < 2) {
      errs.role = 'Role / Job title is required.';
    }
    if (!formData.joining_date) {
      errs.joining_date = 'Joining date is required.';
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
      if (editingEmployee) {
        data = await API.updateEmployee(editingEmployee.id, formData, token);
      } else {
        data = await API.addEmployee(formData, token);
      }

      addToast(data.message || 'Employee record saved successfully!', 'success');
      setIsFormModalOpen(false);
      fetchEmployees();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete employee
  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;

    try {
      const data = await API.deleteEmployee(deletingEmployee.id, token);
      addToast(data.message || 'Employee deleted', 'success');
      setDeletingEmployee(null);
      fetchEmployees();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Quick stats
  const activeCount = useMemo(() => employees.filter(e => e.status === 'Active').length, [employees]);
  const onLeaveCount = useMemo(() => employees.filter(e => e.status === 'On Leave').length, [employees]);

  // Color generator for avatar
  const getAvatarGradient = (name) => {
    const gradients = ['avatar-indigo', 'avatar-teal', 'avatar-rose', 'avatar-amber', 'avatar-purple'];
    const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % gradients.length;
    return gradients[idx];
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Employee Records</h2>
          <p className="page-subtitle">
            Manage organization directory, roles, employment status, and team assignments.
          </p>
        </div>

        <div className="page-actions">
          {isAdmin ? (
            <button className="btn btn-primary" onClick={handleOpenCreate} id="btn-add-employee">
              <UserPlus size={18} />
              <span>Add Employee</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-muted)', padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <ShieldAlert size={16} />
              <span>Viewing in Employee mode (Read-only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Mini-Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Records</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{employees.length}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Staff</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{activeCount}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>On Leave</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706' }}>{onLeaveCount}</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-light)', padding: '14px 18px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Departments</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6' }}>{departments.length || 6}</div>
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
            placeholder="Search employees by name, role, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="employee-search-input"
          />
        </div>

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Department:</span>
            <select
              className="select-filter"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              id="filter-department-select"
            >
              <option value="All">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="select-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              id="filter-status-select"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Data View */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading employee records...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No Employee Records Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 18px' }}>
            {search || selectedDept !== 'All' || selectedStatus !== 'All'
              ? 'No records match your selected search filters. Try adjusting the search term or clearing filters.'
              : 'Start by adding your first employee record.'}
          </p>
          {(search || selectedDept !== 'All' || selectedStatus !== 'All') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setSelectedDept('All'); setSelectedStatus('All'); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Role / Position</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2);
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="employee-cell">
                        <div className={`avatar-circle ${getAvatarGradient(emp.name)}`}>
                          {initials}
                        </div>
                        <div className="employee-info-cell">
                          <h4>{emp.name}</h4>
                          <p>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem' }}>
                        {emp.employee_id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                        {emp.department}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Calendar size={14} />
                        <span>{emp.joining_date}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-active' : emp.status === 'On Leave' ? 'badge-leave' : 'badge-inactive'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn-icon"
                          title="View Profile Details"
                          onClick={() => setViewingEmployee(emp)}
                        >
                          <Eye size={17} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="btn-icon"
                              title="Edit Record"
                              onClick={() => handleOpenEdit(emp)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon danger"
                              title="Delete Record"
                              onClick={() => setDeletingEmployee(emp)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee Record' : 'Add New Employee'}</h3>
              <button className="modal-close-btn" onClick={() => setIsFormModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.name ? 'error' : ''}`}
                      placeholder="e.g. Jordan Hayes"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      id="input-employee-name"
                    />
                    {formErrors.name && <p className="form-error">{formErrors.name}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employee ID <span className="req">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.employee_id ? 'error' : ''}`}
                      placeholder="e.g. HRN-205"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value.toUpperCase() })}
                      id="input-employee-id"
                    />
                    {formErrors.employee_id && <p className="form-error">{formErrors.employee_id}</p>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      className={`form-control ${formErrors.email ? 'error' : ''}`}
                      placeholder="jordan.hayes@hrnova.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      id="input-employee-email"
                    />
                    {formErrors.email && <p className="form-error">{formErrors.email}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department <span className="req">*</span></label>
                    <select
                      className={`form-control ${formErrors.department ? 'error' : ''}`}
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      id="select-employee-dept"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Design">Design</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                    </select>
                    {formErrors.department && <p className="form-error">{formErrors.department}</p>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role / Job Title <span className="req">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.role ? 'error' : ''}`}
                      placeholder="e.g. Senior Backend Engineer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      id="input-employee-role"
                    />
                    {formErrors.role && <p className="form-error">{formErrors.role}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Joining Date <span className="req">*</span></label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.joining_date ? 'error' : ''}`}
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                      id="input-employee-joining"
                    />
                    {formErrors.joining_date && <p className="form-error">{formErrors.joining_date}</p>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Employment Status <span className="req">*</span></label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      id="select-employee-status"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Office Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. San Francisco, CA / Remote"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} id="btn-save-employee">
                  {submitting ? 'Saving Record...' : editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Profile Modal */}
      {viewingEmployee && (
        <div className="modal-overlay" onClick={() => setViewingEmployee(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Employee Profile</h3>
              <button className="modal-close-btn" onClick={() => setViewingEmployee(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div className={`avatar-circle ${getAvatarGradient(viewingEmployee.name)}`} style={{ width: '60px', height: '60px', fontSize: '1.25rem' }}>
                  {viewingEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', margin: 0 }}>{viewingEmployee.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{viewingEmployee.role}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span className={`badge ${viewingEmployee.status === 'Active' ? 'badge-active' : viewingEmployee.status === 'On Leave' ? 'badge-leave' : 'badge-inactive'}`}>
                      {viewingEmployee.status}
                    </span>
                    <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {viewingEmployee.employee_id}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-muted)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>Department</strong>
                  <span>{viewingEmployee.department}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>Email</strong>
                  <span>{viewingEmployee.email}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>Joining Date</strong>
                  <span>{viewingEmployee.joining_date}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>Location</strong>
                  <span>{viewingEmployee.location || 'San Francisco, CA'}</span>
                </div>
                {viewingEmployee.phone && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>Phone</strong>
                    <span>{viewingEmployee.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {isAdmin && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const emp = viewingEmployee;
                    setViewingEmployee(null);
                    handleOpenEdit(emp);
                  }}
                >
                  Edit This Record
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingEmployee(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="modal-overlay" onClick={() => setDeletingEmployee(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Confirm Deletion</h3>
              <button className="modal-close-btn" onClick={() => setDeletingEmployee(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.92rem', lineHeight: '1.5' }}>
                Are you sure you want to permanently delete <strong>{deletingEmployee.name}</strong> ({deletingEmployee.employee_id})?
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                This will also remove their project assignments. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingEmployee(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} id="btn-confirm-delete-employee">
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
