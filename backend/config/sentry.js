/**
 * Sentry v8 — crash-proof wrapper.
 * - Works whether or not SENTRY_DSN is set
 * - Compatible with @sentry/node v8 (Handlers API removed)
 * - All calls are try/catch so a Sentry failure NEVER crashes the server
 */

let _sentry = null;
let _enabled = false;

export async function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('[Sentry] SENTRY_DSN not set — error tracking disabled');
    return;
  }
  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      beforeSend(event) {
        try {
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          if (event.request?.data && typeof event.request.data === 'object') {
            const d = event.request.data;
            delete d.password; delete d.token; delete d.secret;
          }
        } catch {}
        return event;
      },
    });
    _sentry = Sentry;
    _enabled = true;
    console.log('[Sentry] Initialized successfully');
  } catch (err) {
    console.warn('[Sentry] Init failed (non-fatal):', err.message);
  }
}

/**
 * Call this AFTER all routes, BEFORE global error handler.
 * Uses v8 API: setupExpressErrorHandler(app)
 */
export function setupSentryErrorHandler(app) {
  if (!_enabled || !_sentry) return;
  try {
    if (typeof _sentry.setupExpressErrorHandler === 'function') {
      _sentry.setupExpressErrorHandler(app);
      console.log('[Sentry] Express error handler registered');
    }
  } catch (err) {
    console.warn('[Sentry] setupExpressErrorHandler failed (non-fatal):', err.message);
  }
}

export function captureException(err, context) {
  if (!_enabled || !_sentry) return;
  try { _sentry.captureException(err, context); } catch {}
}
