import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';

import routes from './backend/routes/index.js';
import { startSubscriptionCron } from './backend/jobs/subscriptionCron.js';
import { seedRoles } from './backend/seeders/role.seeder.js';
import { seedUsers } from './backend/seeders/user.seeder.js';

// Security & Observability
import { initSentry, setupSentryErrorHandler } from './backend/config/sentry.js';
import { logger } from './backend/config/logger.js';
import { initSocket } from './backend/config/socket.js';
import { globalLimiter, authLimiter, ipBlockMiddleware } from './backend/middlewares/rateLimiter.js';
import { requestLogger } from './backend/middlewares/requestLogger.js';
import { errorHandler } from './backend/middlewares/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Sentry first — async dynamic import so it never crashes the process
  await initSentry();

  const app = express();
  const PORT = process.env.PORT || 3000;
  // ── Trust reverse proxy (Render / Cloud Run / Nginx) ─────────────────────
  app.set('trust proxy', 1);

  // ── Compression ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── Helmet — Security Headers ─────────────────────────────────────────────
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://checkout.razorpay.com',
                'https://api.razorpay.com',
              ],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://*.cloudinary.com'],
              connectSrc: [
                "'self'",
                process.env.FRONTEND_URL || '',
                process.env.BACKEND_URL || '',
                'wss:',
                'ws:',
                'https://checkout.razorpay.com',
                'https://lumberjack.razorpay.com',
              ].filter(Boolean),
              frameSrc: ["'self'", 'https://api.razorpay.com'],
              objectSrc: ["'none'"],
            },
          }
        : false, // Disable CSP in dev so Vite HMR works
      crossOriginEmbedderPolicy: false,
      xPoweredBy: false,
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // ── Request Logger ────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── IP Block Middleware ───────────────────────────────────────────────────
  app.use(ipBlockMiddleware);

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  app.use('/api/', globalLimiter);
  app.use('/api/auth/', authLimiter);

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    'https://fire-arena-max-organisation.vercel.app',
    'https://fam-organisation.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ...(process.env.EXTRA_ALLOWED_ORIGINS
      ? process.env.EXTRA_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : []),
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin))
          return callback(null, true);
        callback(new Error('Not allowed by CORS: ' + origin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // ── Raw body for Razorpay HMAC webhook ────────────────────────────────────
  app.use((req, res, next) => {
    if (req.path === '/api/payments/webhook') {
      let raw = '';
      req.setEncoding('utf8');
      req.on('data', (c) => { raw += c; });
      req.on('end', () => {
        req.rawBody = raw;
        try { req.body = JSON.parse(raw); } catch { req.body = {}; }
        next();
      });
    } else {
      next();
    }
  });

  // ── Body Parsers ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── MongoDB ───────────────────────────────────────────────────────────────
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info('Connected to MongoDB');

      try {
        const EntityModel = mongoose.model('Entity');
        await EntityModel.collection.createIndex({ type: 1, 'data.user_email': 1 });
        await EntityModel.collection.createIndex({ type: 1, 'data.user_id': 1 });
        await EntityModel.collection.createIndex({ type: 1, 'data.referral_code': 1 });
        await EntityModel.collection.createIndex({ type: 1, 'data.id': 1 });
      } catch (indexErr) {
        logger.warn('Index creation skipped:', indexErr.message);
      }

      await seedRoles();
      await seedUsers();
      startSubscriptionCron();
    } catch (err) {
      logger.error('MongoDB connection error:', err.message);
    }
  } else {
    logger.warn('MONGODB_URI not set — running without DB');
  }

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/api', routes);
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    });
  });

  // ── Sentry Error Handler (v8 API — must be after routes, before errorHandler) ──
  setupSentryErrorHandler(app);

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.use(errorHandler);

  // ── Frontend Serving ──────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const viteModule = 'vite';
    const { createServer: createViteServer } = await import(/* @vite-ignore */ viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname.endsWith('dist') ? __dirname : path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  // ── HTTP Server + Socket.IO ───────────────────────────────────────────────
  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  return app;
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
