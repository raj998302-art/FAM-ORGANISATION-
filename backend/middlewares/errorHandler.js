import { logger } from '../config/logger.js';
import { captureException } from '../config/sentry.js';

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const safe = { ...body };
  ['password', 'token', 'secret', 'key', 'authorization', 'card'].forEach((k) => {
    Object.keys(safe).forEach((field) => {
      if (field.toLowerCase().includes(k)) safe[field] = '[REDACTED]';
    });
  });
  return safe;
}

/**
 * Centralized error handler — logs via Winston, captures in Sentry,
 * returns clean JSON (no stack traces in production).
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';

  logger.error(
    `[ERROR] ${statusCode} | ${req.method} ${req.originalUrl} | IP: ${ip} | ${err.message}`,
    { stack: err.stack, body: sanitizeBody(req.body), user: req.user?.email || 'unauthenticated' }
  );

  if (statusCode >= 500) captureException(err);

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : err.message,
    ...(isDev && { stack: err.stack, details: err.message }),
  });
}
