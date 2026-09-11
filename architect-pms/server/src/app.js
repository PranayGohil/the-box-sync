const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const professionalRoutes = require('./routes/professionalRoutes');
const projectRoutes = require('./routes/projectRoutes');
const progressRoutes = require('./routes/progressRoutes');
const siteVisitRoutes = require('./routes/siteVisitRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const buPermissionRoutes = require('./routes/buPermissionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security and CORS middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file uploads directory
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/progress', progressRoutes);
app.use('/api/site-visits', siteVisitRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/projects/:id/bu-permission', buPermissionRoutes);
app.use('/api/projects/:id/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Architect PMS API Engine',
    timestamp: new Date(),
  });
});

const AppError = require('./utils/appError');
const errorHandler = require('./middleware/errorHandler');

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Endpoint ${req.originalUrl} not found`, 404));
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
