import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import contractRoutes from './routes/contractRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allows Vite dev server & inline styles
}));

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate Limiter: max 150 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: {
    success: false,
    error: 'Rate limit exceeded. Please wait a few minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// JSON and URL-encoded body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to /api routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ContractLens Intelligence Engine',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key')
  });
});

// Mount Protected API Routes
app.use('/api/contracts', authMiddleware, contractRoutes);
app.use('/api/agent', authMiddleware, agentRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../dist');

// Serve static assets from built Vite client
app.use(express.static(distPath));

// SPA catch-all fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Start HTTP Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(` CONTRACTLENS SERVER RUNNING ON PORT ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});

export default app;
