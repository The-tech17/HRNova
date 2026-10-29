const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  try {
    const isEmployee = req.user && req.user.role !== 'admin';
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email : null;

    // 1. Employee Stats
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const activeEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'").get().count;
    const onLeaveEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'On Leave'").get().count;

    // Department distribution for charts
    const deptDistribution = db.prepare(`
      SELECT department, COUNT(*) as count
      FROM employees
      GROUP BY department
      ORDER BY count DESC
    `).all();

    // 2. Project Stats
    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const inProgressProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'In Progress'").get().count;
    const completedProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Completed'").get().count;
    const notStartedProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Not Started'").get().count;

    const projectStatusDistribution = [
      { status: 'In Progress', count: inProgressProjects, color: '#3b82f6' },
      { status: 'Completed', count: completedProjects, color: '#10b981' },
      { status: 'Not Started', count: notStartedProjects, color: '#f59e0b' }
    ];

    // 3. HR Queries Stats
    const totalQueries = db.prepare('SELECT COUNT(*) as count FROM hr_queries').get().count;
    const openQueries = db.prepare("SELECT COUNT(*) as count FROM hr_queries WHERE status = 'Open'").get().count;
    const inProgressQueries = db.prepare("SELECT COUNT(*) as count FROM hr_queries WHERE status = 'In Progress'").get().count;
    const resolvedQueries = db.prepare("SELECT COUNT(*) as count FROM hr_queries WHERE status = 'Resolved'").get().count;

    // 4. HR Inbox Requests
    const newHrRequests = db.prepare("SELECT COUNT(*) as count FROM hr_requests WHERE status = 'New'").get().count;
    const totalHrRequests = db.prepare('SELECT COUNT(*) as count FROM hr_requests').get().count;

    // 5. Recent Activity Stream
    const recentEmployees = db.prepare(`
      SELECT 'new_employee' as type, name as title, department as subtitle, created_at as timestamp, employee_id as ref
      FROM employees ORDER BY created_at DESC LIMIT 3
    `).all();

    const upcomingDeadlines = db.prepare(`
      SELECT 'project_deadline' as type, title, status as subtitle, deadline as timestamp, id as ref
      FROM projects WHERE status != 'Completed' ORDER BY deadline ASC LIMIT 3
    `).all();

    const recentQueries = db.prepare(`
      SELECT 'query' as type, question as title, status as subtitle, created_at as timestamp, id as ref
      FROM hr_queries ORDER BY created_at DESC LIMIT 3
    `).all();

    // 6. User-specific stats if Employee role
    let myProjects = [];
    let myQueriesCount = 0;
    if (isEmployee) {
      if (userEmail) {
        const emp = db.prepare('SELECT id FROM employees WHERE email = ?').get(userEmail);
        if (emp) {
          myProjects = db.prepare(`
            SELECT p.* FROM projects p
            JOIN project_assignments pa ON pa.project_id = p.id
            WHERE pa.employee_id = ?
            ORDER BY p.deadline ASC
          `).all(emp.id);
        }
      }
      myQueriesCount = db.prepare("SELECT COUNT(*) as count FROM hr_queries WHERE user_id = ? OR employee_email = ?").get(userId, userEmail).count;
    }

    res.json({
      summary: {
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        totalProjects,
        activeProjects: inProgressProjects,
        completedProjects,
        notStartedProjects,
        openQueries: openQueries + inProgressQueries,
        resolvedQueries,
        totalQueries,
        newHrRequests,
        totalHrRequests,
        myProjectsCount: myProjects.length,
        myQueriesCount
      },
      charts: {
        departmentDistribution: deptDistribution,
        projectStatusDistribution,
        queryStatusDistribution: [
          { status: 'Open', count: openQueries, color: '#ef4444' },
          { status: 'In Progress', count: inProgressQueries, color: '#f59e0b' },
          { status: 'Resolved', count: resolvedQueries, color: '#10b981' }
        ]
      },
      recentEmployees,
      upcomingDeadlines,
      recentQueries,
      myProjects
    });
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
});

module.exports = router;
