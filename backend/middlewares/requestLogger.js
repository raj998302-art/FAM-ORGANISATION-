import { logger } from '../config/logger.js';

/**
 * Request logger — logs method, URL, status, response time, and IP.
 * Skips logging for health check endpoint to avoid noise.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  res.on('finish', () => {
    if (req.path === '/api/health') return; // skip health checks
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms IP:${ip}`,
      {
        user: req.user?.email || null,
        userAgent: req.headers['user-agent']?.slice(0, 80),
      }
    );
  });

  next();
}
