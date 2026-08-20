require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');
const db = require('./config/db');

const app = express();

// Configure CORS - Allow production deployed frontends, local development, and env variable configurations
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://practice-management-and-nutrient-an.vercel.app',
  'https://practice-management-and-nutrient-qbdi.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the allowed list or is a local address
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('http://localhost') || 
                      origin.startsWith('http://127.0.0.1');
                      
    if (isAllowed) {
      return callback(null, true);
    } else {
      console.warn(`⚠️ Blocked by CORS: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
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