const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/queries/faqs - List FAQs with optional search & category filter
router.get('/faqs', (req, res) => {
  try {
    const { category, search } = req.query;

    let query = 'SELECT * FROM faqs WHERE 1=1';
    const params = [];

    if (category && category !== 'All' && category.trim() !== '') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      query += ' AND (question LIKE ? OR answer LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY order_num ASC, id ASC';

    const faqs = db.prepare(query).all(...params);
    const categories = db.prepare('SELECT DISTINCT category FROM faqs ORDER BY category ASC').all().map(c => c.category);

    res.json({ faqs, categories });
  } catch (err) {
    console.error('Fetch FAQs error:', err);
    res.status(500).json({ error: 'Failed to retrieve FAQs.' });
  }
});

// GET /api/queries - List support queries with status filter
router.get('/', (req, res) => {
  try {
    const { status, category, search, mine } = req.query;

    let query = 'SELECT * FROM hr_queries WHERE 1=1';
    const params = [];

    if (mine === 'true' && req.user) {
      query += ' AND (user_id = ? OR employee_email = ?)';
      params.push(req.user.id, req.user.email);
    }

    if (status && status !== 'All' && status.trim() !== '') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'All' && category.trim() !== '') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      query += ' AND (question LIKE ? OR details LIKE ? OR employee_name LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += " ORDER BY CASE status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END, created_at DESC";

    const queries = db.prepare(query).all(...params);

    const openCount = db.prepare("SELECT COUNT(*) as count FROM hr_queries WHERE status = 'Open'").get().count;
    const inProgressCount = db.prepare("SELECT COUNT(*) as count FROM hr_queries WHERE status = 'In Progress'").get().count;
    const resolvedCount = db.prepare("SELECT COUNT(*) as count FROM hr_queries WHERE status = 'Resolved'").get().count;

    res.json({
      queries,
      stats: {
        total: queries.length,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      }
    });
  } catch (err) {
    console.error('Fetch queries error:', err);
    res.status(500).json({ error: 'Failed to retrieve queries.' });
  }
});

// POST /api/queries - Submit a new query
router.post('/', (req, res) => {
  try {
    const { category, question, details = '', employee_name, employee_email } = req.body;

    const errors = {};
    if (!category || category.trim() === '') errors.category = 'Category is required.';
    if (!question || question.trim().length < 5) errors.question = 'Question is required (min 5 characters).';

    const finalName = (req.user && req.user.name) || employee_name;
    const finalEmail = (req.user && req.user.email) || employee_email;
    const userId = req.user ? req.user.id : null;

    if (!finalName || finalName.trim() === '') errors.employee_name = 'Your name is required.';
    if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) errors.employee_email = 'Valid email is required.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const insert = db.prepare(`
      INSERT INTO hr_queries (user_id, employee_name, employee_email, category, question, details, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Open')
    `);

    const result = insert.run(
      userId,
      finalName.trim(),
      finalEmail.trim(),
      category.trim(),
      question.trim(),
      details ? details.trim() : null
    );

    const newQuery = db.prepare('SELECT * FROM hr_queries WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Support query submitted successfully. HR will address your inquiry shortly.',
      query: newQuery
    });
  } catch (err) {
    console.error('Submit query error:', err);
    res.status(500).json({ error: 'Failed to submit query.' });
  }
});

// PATCH /api/queries/:id/resolve - HR Admin resolves or responds to query
router.patch('/:id/resolve', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const { resolution, status = 'Resolved' } = req.body;

    const existing = db.prepare('SELECT * FROM hr_queries WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Query not found.' });
    }

    const resolverName = (req.user && req.user.name) || 'HR Admin';
    const resolvedAt = status === 'Resolved' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : null;

    db.prepare(`
      UPDATE hr_queries
      SET status = ?, resolution = ?, resolved_by = ?, resolved_at = ?
      WHERE id = ?
    `).run(status, resolution || existing.resolution, resolverName, resolvedAt, id);

    const updated = db.prepare('SELECT * FROM hr_queries WHERE id = ?').get(id);
    res.json({
      message: `Query marked as ${status}.`,
      query: updated
    });
  } catch (err) {
    console.error('Resolve query error:', err);
    res.status(500).json({ error: 'Failed to update query.' });
  }
});

module.exports = router;
