require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');
const db = require('./config/db');

const app = express();

// Configure CORS
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Base status route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ayurvedic Dietitian Practice Management & Nutrient Analysis API is running.',
    mode: db.isSQLite() ? 'SQLite Fallback' : 'PostgreSQL Cloud Mode'
  });
});

// Mount Central API Router
app.use('/api', apiRouter);

// Database initialization
db.initDb().then(() => {
  console.log('✅ Database connector initialized.');
}).catch((err) => {
  console.error('❌ Failed to initialize database connector:', err);
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

// Global error handler (prevent leaking stack traces)
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message
  });
});

module.exports = app;
