/**
 * SocketContext — manages a single Socket.IO connection for the entire app.
 * Provides real-time events: settingsUpdated, notification, tournamentUpdated
 *
 * Usage:
 *   const { socket, isConnected, settings } = useSocket();
 *   useEffect(() => {
 *     socket?.on('customEvent', handler);
 *     return () => socket?.off('customEvent', handler);
 *   }, [socket]);
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : '';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(null);       // latest AppSettings from server
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    // Only connect if we have a backend URL and a token (authenticated)
    const token = localStorage.getItem('token');
    if (!BACKEND_URL && !window.location.hostname.includes('localhost')) return;

    const socketUrl = BACKEND_URL || window.location.origin;

    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      auth: token ? { token } : undefined,
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // ── Real-time event handlers ────────────────────────────────────────────
    socket.on('settingsUpdated', (updatedSettings) => {
      console.log('[Socket] Settings updated received');
      setSettings(updatedSettings);
    });

    socket.on('notification', (notification) => {
      setLiveNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    socket.on('tournamentUpdated', (tournament) => {
      // Dispatch a custom window event so any page can react
      window.dispatchEvent(new CustomEvent('TOURNAMENT_UPDATED', { detail: tournament }));
    });

    return () => {
      socket.off('settingsUpdated');
      socket.off('notification');
      socket.off('tournamentUpdated');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const clearLiveNotifications = useCallback(() => setLiveNotifications([]), []);

  const value = {
    socket: socketRef.current,
    isConnected,
    settings,       // latest app settings from real-time event
    liveNotifications,
    clearLiveNotifications,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
