// usePWANotifications.js
// Handles PWA push notification subscription, permission, and scheduling
// Reset reminders fire at 1:00 AM IST (matching backend reset time)

import { useState, useEffect, useCallback } from 'react';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const RESET_HOUR_IST = 1;

function msUntilNextISTReset() {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  const next = new Date(istNow);
  if (istNow.getUTCHours() >= RESET_HOUR_IST) next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(RESET_HOUR_IST, 5, 0, 0); // 1:05 AM IST
  return next.getTime() - istNow.getTime();
}

export function usePWANotifications() {
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  // Show immediate local notification via SW
  const showNotification = useCallback(async (title, body, options = {}) => {
    if (!navigator.serviceWorker?.ready) return;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  }, []);

  // Schedule a notification via SW message
  const scheduleNotification = useCallback(async (title, body, delayMs, tag) => {
    if (!navigator.serviceWorker?.ready) return;
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ type: 'SCHEDULE_NOTIFICATION', title, body, delay: delayMs, tag });
    }
  }, []);

  // Set up all daily reminder notifications at reset time
  const setupDailyReminders = useCallback(async () => {
    if (permission !== 'granted') return;
    const msToReset = msUntilNextISTReset();

    // Schedule reminders to fire after 1 AM IST
    const reminders = [
      { delay: msToReset,              tag: 'daily-reset',    title: 'Daily Missions Reset!',      body: 'Your daily missions are fresh. Complete them now to earn XP!' },
      { delay: msToReset + 60000,      tag: 'daily-reward',   title: 'Daily Reward Waiting!',      body: 'Claim your daily login reward. Keep your streak alive!' },
      { delay: msToReset + 120000,     tag: 'spin-wheel',     title: 'Free Daily Spin Available!', body: 'Spin the wheel for XP and badges. Free spin resets every day!' },
      { delay: msToReset + 3600000,    tag: 'tournaments',    title: 'Tournaments Today!',         body: 'Check the latest Fire Arena Max tournaments. Register before slots fill up!' },
    ];

    for (const r of reminders) {
      await scheduleNotification(r.title, r.body, r.delay, r.tag);
    }
  }, [permission, scheduleNotification]);

  // Fire event-based notifications
  const notifyTournamentLive = useCallback(async (tournamentName) => {
    if (permission !== 'granted') return;
    await showNotification(`Tournament LIVE: ${tournamentName}`, 'The tournament has started! Check room details now.', {
      tag: 'tournament-live', requireInteraction: true,
      data: { url: '/tournaments' },
    });
  }, [permission, showNotification]);

  const notifyDepositApproved = useCallback(async (amount) => {
    if (permission !== 'granted') return;
    await showNotification('Deposit Approved!', `₹${amount} has been added to your wallet. Ready to join tournaments!`, {
      tag: 'deposit-approved', data: { url: '/wallet' },
    });
  }, [permission, showNotification]);

  const notifyWithdrawalProcessed = useCallback(async (amount) => {
    if (permission !== 'granted') return;
    await showNotification('Withdrawal Processed!', `₹${amount} has been sent to your UPI. Check your bank account.`, {
      tag: 'withdrawal-done', data: { url: '/wallet' },
    });
  }, [permission, showNotification]);

  const notifyNewBroadcast = useCallback(async (title, message) => {
    if (permission !== 'granted') return;
    await showNotification(title, message, {
      tag: 'broadcast', data: { url: '/notifications' },
    });
  }, [permission, showNotification]);

  const notifyReferralBonus = useCallback(async () => {
    if (permission !== 'granted') return;
    await showNotification('Referral Bonus Earned!', 'A friend joined using your code. ₹10 added to your wallet!', {
      tag: 'referral-bonus', data: { url: '/referral' },
    });
  }, [permission, showNotification]);

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
    scheduleNotification,
    setupDailyReminders,
    notifyTournamentLive,
    notifyDepositApproved,
    notifyWithdrawalProcessed,
    notifyNewBroadcast,
    notifyReferralBonus,
    isGranted: permission === 'granted',
  };
}
