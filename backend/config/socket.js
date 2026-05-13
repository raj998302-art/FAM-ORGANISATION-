import { Server } from 'socket.io';
import { logger } from '../config/logger.js';

let io = null;

export function initSocket(httpServer) {
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

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error(`Socket CORS blocked: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    logger.info(`[SOCKET] Client connected: ${socket.id} from ${ip}`);

    socket.on('disconnect', (reason) => {
      logger.info(`[SOCKET] Client disconnected: ${socket.id} reason: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`[SOCKET] Error on ${socket.id}: ${err.message}`);
    });
  });

  logger.info('[SOCKET] Socket.IO server initialized');
  return io;
}

/** Get the io instance — throws if not initialized */
export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket() first.');
  return io;
}

/** Broadcast settings update to all connected clients */
export function emitSettingsUpdated(updatedSettings) {
  if (!io) return;
  io.emit('settingsUpdated', updatedSettings);
  logger.info('[SOCKET] Emitted settingsUpdated to all clients');
}

/** Emit a notification to a specific user's email room */
export function emitUserNotification(userEmail, notification) {
  if (!io) return;
  io.to(`user:${userEmail}`).emit('notification', notification);
}

/** Emit a tournament update to all clients */
export function emitTournamentUpdate(tournament) {
  if (!io) return;
  io.emit('tournamentUpdated', tournament);
}
