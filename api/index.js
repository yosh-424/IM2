/**
 * Main Server Entry Point
 * Initializes Express server and all routes
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { defineModels } from './models/index.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createAdminRoutes } from './routes/adminRoutes.js';
import { createVisitLogsRoutes } from './routes/visitLogsRoutes.js';
import { createVisitorRoutes } from './routes/visitorsRoutes.js';
import { createStatisticsRoutes } from './routes/statisticsRoutes.js';
import { createSearchRoutes } from './routes/searchRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, '../.env.local') });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client dist folder
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Initialize Models
const models = defineModels();

// Routes
app.use('/api/auth', createAuthRoutes(models));
app.use('/api/admin', createAdminRoutes(models));
app.use('/api/visit-logs', createVisitLogsRoutes(models));
app.use('/api/visitors', createVisitorRoutes(models));
app.use('/api/statistics', createStatisticsRoutes(models));
app.use('/api/search', createSearchRoutes(models));

// Colleges endpoint
app.get('/api/colleges', async (req, res) => {
  try {
    const colleges = await models.College.find().sort({ name: 1 });
    return res.json({
      success: true,
      data: colleges,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Library Visitor System API',
    endpoints: [
      'GET /health',
      'GET /api/visitors',
      'POST /api/visitors',
      'GET /api/statistics/daily',
      'GET /api/statistics/weekly',
      'GET /api/statistics/monthly',
      'GET /api/search?query=...',
    ],
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error',
  });
});

// Initialize Database and Start Server
const startServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/library_visitor_system',
    );
    console.log('✓ Database connection established successfully');

    // Only listen on port if not in serverless environment (Vercel)
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`✓ Server is running on http://localhost:${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    }
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
