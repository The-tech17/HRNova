const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/hr-requests - Inbox view
router.get('/', (req, res) => {
  try {
    const { status, urgency, search } = req.query;

    let query = 'SELECT * FROM hr_requests WHERE 1=1';
    const params = [];

    // If regular employee, only show their own requests unless admin
    if (req.user && req.user.role !== 'admin') {
      query += ' AND (sender_id = ? OR sender_email = ?)';
      params.push(req.user.id, req.user.email);
    }

    if (status && status !== 'All' && status.trim() !== '') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (urgency && urgency !== 'All' && urgency.trim() !== '') {
      query += ' AND urgency = ?';
      params.push(urgency);
    }

    if (search && search.trim() !== '') {
      query += ' AND (subject LIKE ? OR message LIKE ? OR sender_name LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += " ORDER BY CASE urgency WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, created_at DESC";

    const requests = db.prepare(query).all(...params);

    // Summary counts
    const newCount = db.prepare("SELECT COUNT(*) as count FROM hr_requests WHERE status = 'New'").get().count;
    const underReviewCount = db.prepare("SELECT COUNT(*) as count FROM hr_requests WHERE status = 'Under Review'").get().count;
    const resolvedCount = db.prepare("SELECT COUNT(*) as count FROM hr_requests WHERE status = 'Resolved'").get().count;
    const urgentCount = db.prepare("SELECT COUNT(*) as count FROM hr_requests WHERE urgency = 'Urgent' AND status != 'Resolved'").get().count;

    res.json({
      requests,
      stats: {
        total: requests.length,
        new: newCount,
        underReview: underReviewCount,
        resolved: resolvedCount,
        urgentPending: urgentCount
      }
    });
  } catch (err) {
    console.error('Fetch HR requests error:', err);
    res.status(500).json({ error: 'Failed to retrieve HR requests.' });
  }
});

// POST /api/hr-requests - Submit Contact HR Form
router.post('/', (req, res) => {
  try {
    const { subject, message, urgency = 'Medium', sender_name, sender_email, sender_role } = req.body;

    const errors = {};
    if (!subject || subject.trim().length < 3) errors.subject = 'Subject is required (min 3 characters).';
    if (!message || message.trim().length < 10) errors.message = 'Detailed message is required (min 10 characters).';

    const validUrgencies = ['Low', 'Medium', 'High', 'Urgent'];
    if (!validUrgencies.includes(urgency)) errors.urgency = 'Invalid urgency level.';

    // Infer sender from authenticated user or form inputs
    const finalName = (req.user && req.user.name) || sender_name;
    const finalEmail = (req.user && req.user.email) || sender_email;
    const finalRole = (req.user && req.user.department) ? `${req.user.role} (${req.user.department})` : (sender_role || 'Employee');
    const senderId = req.user ? req.user.id : null;

    if (!finalName || finalName.trim() === '') errors.sender_name = 'Sender name is required.';
    if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) errors.sender_email = 'Valid sender email is required.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const insert = db.prepare(`
      INSERT INTO hr_requests (sender_id, sender_name, sender_email, sender_role, subject, message, urgency, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'New')
    `);

    const result = insert.run(
      senderId,
      finalName.trim(),
      finalEmail.trim(),
      finalRole,
      subject.trim(),
      message.trim(),
      urgency
    );

    const newRequest = db.prepare('SELECT * FROM hr_requests WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Your message has been securely sent to the HR team. An HR specialist will review it promptly.',
      request: newRequest
    });
  } catch (err) {
    console.error('Contact HR submission error:', err);
    res.status(500).json({ error: 'Failed to submit HR request.' });
  }
});

// PATCH /api/hr-requests/:id/status - Update status and reply (HR Admin only)
router.patch('/:id/status', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const { status, admin_reply } = req.body;

    const existing = db.prepare('SELECT * FROM hr_requests WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'HR Request not found.' });
    }

    const validStatuses = ['New', 'Under Review', 'Resolved'];
    const newStatus = validStatuses.includes(status) ? status : existing.status;
    const resolvedAt = newStatus === 'Resolved' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : (existing.resolved_at || null);
    const reply = admin_reply !== undefined ? admin_reply : existing.admin_reply;

    db.prepare(`
      UPDATE hr_requests
      SET status = ?, admin_reply = ?, resolved_at = ?
      WHERE id = ?
    `).run(newStatus, reply, resolvedAt, id);

    const updated = db.prepare('SELECT * FROM hr_requests WHERE id = ?').get(id);
    res.json({
      message: 'HR request status updated.',
      request: updated
    });
  } catch (err) {
    console.error('Update request status error:', err);
    res.status(500).json({ error: 'Failed to update request.' });
  }
});

// DELETE /api/hr-requests/:id - Delete request (HR Admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM hr_requests WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'HR Request not found.' });
    }

    db.prepare('DELETE FROM hr_requests WHERE id = ?').run(id);
    res.json({ message: 'Request removed from HR inbox.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete request.' });
  }
});

module.exports = router;
