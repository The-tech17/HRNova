const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');

// Initialize database
require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(authenticateToken);

// Routes
const authRouter = require('./routes/auth');
const employeesRouter = require('./routes/employees');
const projectsRouter = require('./routes/projects');
const hrRequestsRouter = require('./routes/hrRequests');
const queriesRouter = require('./routes/queries');
const dashboardRouter = require('./routes/dashboard');

app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/hr-requests', hrRequestsRouter);
app.use('/api/queries', queriesRouter);
app.use('/api/dashboard', dashboardRouter);

// Root health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'HRNova - Smart HR Dashboard API',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`HRNova Server running on http://localhost:${PORT}`);
});
