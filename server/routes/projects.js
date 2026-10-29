const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Helper to attach assigned employees to projects
function attachEmployees(projects) {
  if (!projects || projects.length === 0) return [];
  const projectIds = projects.map(p => p.id);

  const assignments = db.prepare(`
    SELECT pa.project_id, e.id as employee_id, e.name, e.email, e.role, e.department, e.status
    FROM project_assignments pa
    JOIN employees e ON e.id = pa.employee_id
    WHERE pa.project_id IN (${projectIds.map(() => '?').join(',')})
  `).all(...projectIds);

  const assignmentMap = {};
  for (const a of assignments) {
    if (!assignmentMap[a.project_id]) {
      assignmentMap[a.project_id] = [];
    }
    assignmentMap[a.project_id].push({
      id: a.employee_id,
      name: a.name,
      email: a.email,
      role: a.role,
      department: a.department,
      status: a.status
    });
  }

  return projects.map(p => ({
    ...p,
    assignedEmployees: assignmentMap[p.id] || []
  }));
}

// GET /api/projects - list projects with search and status filter
router.get('/', (req, res) => {
  try {
    const { status, search, department } = req.query;

    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (status && status !== 'All' && status.trim() !== '') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim() !== '') {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (department && department !== 'All' && department.trim() !== '') {
      query += ' AND department = ?';
      params.push(department);
    }

    query += ' ORDER BY deadline ASC';

    const projects = db.prepare(query).all(...params);
    const projectsWithMembers = attachEmployees(projects);

    // Summary stats for overview
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const completedCount = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Completed'").get().count;
    const inProgressCount = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'In Progress'").get().count;
    const notStartedCount = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Not Started'").get().count;
    const avgProgressRow = db.prepare("SELECT AVG(progress) as avgProg FROM projects").get();
    const avgProgress = avgProgressRow && avgProgressRow.avgProg ? Math.round(avgProgressRow.avgProg) : 0;

    res.json({
      projects: projectsWithMembers,
      stats: {
        total: totalCount,
        completed: completedCount,
        inProgress: inProgressCount,
        notStarted: notStartedCount,
        avgProgress
      }
    });
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const assignedEmployees = db.prepare(`
      SELECT e.id, e.name, e.email, e.role, e.department, e.status
      FROM project_assignments pa
      JOIN employees e ON e.id = pa.employee_id
      WHERE pa.project_id = ?
    `).all(req.params.id);

    res.json({
      project: {
        ...project,
        assignedEmployees
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve project details.' });
  }
});

// POST /api/projects - Create project (HR Admin only)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { title, description, deadline, status = 'Not Started', progress = 0, priority = 'Medium', department, assignedEmployeeIds = [] } = req.body;

    const errors = {};
    if (!title || title.trim().length < 3) errors.title = 'Project title is required (min 3 characters).';
    if (!deadline) errors.deadline = 'Target deadline is required.';

    const validStatuses = ['Not Started', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) errors.status = 'Status must be Not Started, In Progress, or Completed.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    // Insert project
    const insert = db.prepare(`
      INSERT INTO projects (title, description, deadline, status, progress, priority, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let cleanProgress = parseInt(progress, 10);
    if (isNaN(cleanProgress)) cleanProgress = 0;
    if (status === 'Completed') cleanProgress = 100;

    const result = insert.run(
      title.trim(),
      description ? description.trim() : '',
      deadline,
      status,
      cleanProgress,
      priority,
      department || 'General'
    );

    const projectId = result.lastInsertRowid;

    // Assign employees
    if (Array.isArray(assignedEmployeeIds) && assignedEmployeeIds.length > 0) {
      const assignStmt = db.prepare('INSERT OR IGNORE INTO project_assignments (project_id, employee_id) VALUES (?, ?)');
      for (const empId of assignedEmployeeIds) {
        assignStmt.run(projectId, empId);
      }
    }

    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    const fullProject = attachEmployees([newProject])[0];

    res.status(201).json({
      message: 'Project created successfully.',
      project: fullProject
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id - Edit project (HR Admin only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const { title, description, deadline, status, progress, priority, department, assignedEmployeeIds } = req.body;

    const errors = {};
    if (!title || title.trim().length < 3) errors.title = 'Project title is required.';
    if (!deadline) errors.deadline = 'Target deadline is required.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    let cleanProgress = progress !== undefined ? parseInt(progress, 10) : existing.progress;
    if (isNaN(cleanProgress)) cleanProgress = existing.progress;
    const finalStatus = status || existing.status;
    if (finalStatus === 'Completed') cleanProgress = 100;

    const update = db.prepare(`
      UPDATE projects
      SET title = ?, description = ?, deadline = ?, status = ?, progress = ?, priority = ?, department = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      title.trim(),
      description !== undefined ? description.trim() : existing.description,
      deadline,
      finalStatus,
      cleanProgress,
      priority || existing.priority,
      department || existing.department,
      id
    );

    // Update assigned employees if provided
    if (Array.isArray(assignedEmployeeIds)) {
      db.prepare('DELETE FROM project_assignments WHERE project_id = ?').run(id);
      const assignStmt = db.prepare('INSERT OR IGNORE INTO project_assignments (project_id, employee_id) VALUES (?, ?)');
      for (const empId of assignedEmployeeIds) {
        assignStmt.run(id, empId);
      }
    }

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    const fullProject = attachEmployees([updated])[0];

    res.json({
      message: 'Project updated successfully.',
      project: fullProject
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// PATCH /api/projects/:id/progress - Quick status / progress update
router.patch('/:id/status', (req, res) => {
  try {
    const id = req.params.id;
    const { status, progress } = req.body;

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    let newStatus = status || existing.status;
    let newProgress = progress !== undefined ? parseInt(progress, 10) : existing.progress;
    if (newStatus === 'Completed') newProgress = 100;
    if (newProgress === 100 && !status) newStatus = 'Completed';

    db.prepare(`
      UPDATE projects
      SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, newProgress, id);

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    const fullProject = attachEmployees([updated])[0];

    res.json({
      message: 'Project status updated.',
      project: fullProject
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project status.' });
  }
});

// DELETE /api/projects/:id - Delete project (HR Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    db.prepare('DELETE FROM project_assignments WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    res.json({ message: `Project "${existing.title}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
