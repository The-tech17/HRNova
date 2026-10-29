const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/employees - Search, filter by department, filter by status
router.get('/', (req, res) => {
  try {
    const { search, department, status, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (name LIKE ? OR employee_id LIKE ? OR email LIKE ? OR role LIKE ?)`;
      params.push(term, term, term, term);
    }

    if (department && department !== 'All' && department.trim() !== '') {
      query += ` AND department = ?`;
      params.push(department);
    }

    if (status && status !== 'All' && status.trim() !== '') {
      query += ` AND status = ?`;
      params.push(status);
    }

    const validSortColumns = ['name', 'employee_id', 'department', 'joining_date', 'status', 'created_at'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSortBy} ${safeOrder}`;

    const employees = db.prepare(query).all(...params);

    // Also get distinct departments for the filter dropdown
    const departments = db.prepare('SELECT DISTINCT department FROM employees ORDER BY department ASC').all().map(d => d.department);

    res.json({
      employees,
      total: employees.length,
      departments
    });
  } catch (err) {
    console.error('Fetch employees error:', err);
    res.status(500).json({ error: 'Failed to retrieve employee records.' });
  }
});

// GET /api/employees/departments
router.get('/meta/departments', (req, res) => {
  try {
    const departments = db.prepare('SELECT DISTINCT department FROM employees ORDER BY department ASC').all().map(d => d.department);
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve departments' });
  }
});

// GET /api/employees/:id
router.get('/:id', (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Also get projects this employee is assigned to
    const assignedProjects = db.prepare(`
      SELECT p.* FROM projects p
      JOIN project_assignments pa ON pa.project_id = p.id
      WHERE pa.employee_id = ?
    `).all(req.params.id);

    res.json({
      employee,
      assignedProjects
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve employee details.' });
  }
});

// POST /api/employees - Add new employee record (HR Admin only)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, employee_id, email, department, role, joining_date, status = 'Active', phone = '', location = '' } = req.body;

    // Validation
    const errors = {};
    if (!name || name.trim().length < 2) errors.name = 'Full name is required (min 2 characters).';
    if (!employee_id || employee_id.trim().length < 3) errors.employee_id = 'Employee ID is required (e.g. HRN-201).';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'A valid email address is required.';
    if (!department || department.trim() === '') errors.department = 'Department is required.';
    if (!role || role.trim() === '') errors.role = 'Role / Job Title is required.';
    if (!joining_date) errors.joining_date = 'Joining date is required.';

    const validStatuses = ['Active', 'On Leave', 'Inactive'];
    if (!validStatuses.includes(status)) errors.status = 'Status must be Active, On Leave, or Inactive.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    // Check unique employee_id and email
    const existingId = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(employee_id.trim().toUpperCase());
    if (existingId) {
      return res.status(400).json({ error: 'An employee with this Employee ID already exists.', errors: { employee_id: 'ID already exists' } });
    }

    const existingEmail = db.prepare('SELECT id FROM employees WHERE email = ?').get(email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(400).json({ error: 'An employee with this email address already exists.', errors: { email: 'Email already exists' } });
    }

    const insert = db.prepare(`
      INSERT INTO employees (name, employee_id, email, department, role, joining_date, status, phone, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      employee_id.trim().toUpperCase(),
      email.trim().toLowerCase(),
      department.trim(),
      role.trim(),
      joining_date,
      status,
      phone ? phone.trim() : null,
      location ? location.trim() : 'San Francisco, CA'
    );

    const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      message: 'Employee record created successfully.',
      employee: newEmployee
    });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Failed to create employee record.' });
  }
});

// PUT /api/employees/:id - Edit employee record (HR Admin only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const { name, employee_id, email, department, role, joining_date, status, phone, location } = req.body;

    const errors = {};
    if (!name || name.trim().length < 2) errors.name = 'Full name is required.';
    if (!employee_id || employee_id.trim().length < 3) errors.employee_id = 'Employee ID is required.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'A valid email address is required.';
    if (!department || department.trim() === '') errors.department = 'Department is required.';
    if (!role || role.trim() === '') errors.role = 'Role is required.';
    if (!joining_date) errors.joining_date = 'Joining date is required.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    // Check unique constraints against other employees
    const duplicateId = db.prepare('SELECT id FROM employees WHERE employee_id = ? AND id != ?').get(employee_id.trim().toUpperCase(), id);
    if (duplicateId) {
      return res.status(400).json({ error: 'Employee ID is already in use by another record.', errors: { employee_id: 'Duplicate ID' } });
    }

    const duplicateEmail = db.prepare('SELECT id FROM employees WHERE email = ? AND id != ?').get(email.trim().toLowerCase(), id);
    if (duplicateEmail) {
      return res.status(400).json({ error: 'Email is already in use by another record.', errors: { email: 'Duplicate Email' } });
    }

    const update = db.prepare(`
      UPDATE employees
      SET name = ?, employee_id = ?, email = ?, department = ?, role = ?, joining_date = ?, status = ?, phone = ?, location = ?
      WHERE id = ?
    `);

    update.run(
      name.trim(),
      employee_id.trim().toUpperCase(),
      email.trim().toLowerCase(),
      department.trim(),
      role.trim(),
      joining_date,
      status || existing.status,
      phone !== undefined ? phone : existing.phone,
      location !== undefined ? location : existing.location,
      id
    );

    const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.json({
      message: 'Employee record updated successfully.',
      employee: updatedEmployee
    });
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Failed to update employee record.' });
  }
});

// DELETE /api/employees/:id - Delete employee record (HR Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Delete project assignments first (handled by FK cascade or explicit delete)
    db.prepare('DELETE FROM project_assignments WHERE employee_id = ?').run(id);
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);

    res.json({ message: `Employee ${existing.name} (${existing.employee_id}) successfully removed.` });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Failed to delete employee record.' });
  }
});

module.exports = router;
