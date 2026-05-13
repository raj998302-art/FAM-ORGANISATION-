import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger.js';

// In-memory store for suspicious IP tracking (use Redis in multi-instance setups)
const suspiciousIPs = new Map(); // ip -> { failCount, blockedUntil }
const BLOCK_THRESHOLD = 20;      // consecutive auth failures before temp block
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function trackFailedAttempt(ip) {
  const now = Date.now();
  const entry = suspiciousIPs.get(ip) || { failCount: 0, blockedUntil: 0 };
  entry.failCount += 1;
  if (entry.failCount >= BLOCK_THRESHOLD) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    logger.warn(`[SECURITY] IP auto-blocked: ${ip} after ${entry.failCount} failures`);
  }
  suspiciousIPs.set(ip, entry);
}

export function clearFailedAttempts(ip) {
  suspiciousIPs.delete(ip);
}

export function isIPBlocked(ip) {
  const entry = suspiciousIPs.get(ip);
  if (!entry) return false;
  if (entry.blockedUntil && Date.now() < entry.blockedUntil) return true;
  if (entry.blockedUntil && Date.now() >= entry.blockedUntil) {
    // Block expired — reset
    suspiciousIPs.delete(ip);
    return false;
  }
  return false;
}

// Middleware to block known bad IPs
export function ipBlockMiddleware(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isIPBlocked(ip)) {
    logger.warn(`[SECURITY] Blocked request from banned IP: ${ip} -> ${req.method} ${req.path}`);
    return res.status(429).json({
      error: 'Too many failed attempts. Your IP has been temporarily blocked.',
      retryAfter: '30 minutes',
    });
  }
  next();
}

// Global API rate limiter — 100 req/15min per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  handler: (req, res) => {
    const ip = req.ip || 'unknown';
    logger.warn(`[RATE_LIMIT] Global limit hit: IP=${ip} path=${req.path}`);
    res.status(429).json({ error: 'Too many requests. Please slow down and try again later.' });
  },
});

// Strict auth limiter — 5 req/min per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  handler: (req, res) => {
    const ip = req.ip || 'unknown';
    logger.warn(`[RATE_LIMIT] Auth limit hit: IP=${ip}`);
    res.status(429).json({ error: 'Too many login attempts. Please wait 1 minute.' });
  },
});

// Upload limiter — 10 req/min per IP
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  validate: { xForwardedForHeader: false, trustProxy: false },
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many upload requests. Please wait.' });
  },
});

// Admin action limiter — 30 req/min
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  validate: { xForwardedForHeader: false, trustProxy: false },
  handler: (req, res) => {
    res.status(429).json({ error: 'Admin rate limit exceeded.' });
  },
});
