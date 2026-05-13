// API Client — talks to the custom Express backend
// VITE_API_URL must be set in Vercel env vars to: https://fam-organisation.onrender.com/api
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Strip trailing /api if present, to build full backend base URL
const BACKEND_BASE = API_URL.endsWith('/api')
  ? API_URL.slice(0, -4)
  : API_URL.replace(/\/api$/, '');

const fetchWrapper = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout (Render cold starts)

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 503) {
        window.dispatchEvent(new CustomEvent('SYSTEM_MAINTENANCE', { detail: true }));
      }
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('AUTH_EXPIRED', { detail: true }));
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
      let errMessage = 'API Error';
      try {
        const errRes = await response.json();
        errMessage = errRes.message || errRes.error || errMessage;
      } catch (e) {}
      throw new Error(errMessage);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Server request timed out. The backend may be waking up — please try again in a moment.');
    }
    throw error;
  }
};

export const apiClient = {
  auth: {
    me: () => fetchWrapper('/auth/me'),
    loginViaEmailPassword: async (email, password) => {
      const res = await fetchWrapper('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.token) localStorage.setItem('token', res.token);
      return res;
    },
    signupViaEmailPassword: async (email, password, fullName, referralCode) => {
      const res = await fetchWrapper('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName, referral_code: referralCode })
      });
      if (res.token) localStorage.setItem('token', res.token);
      return res;
    },
    logout: () => {
      localStorage.removeItem('token');
      window.location.reload();
    },
    forgotPassword: (email) => fetchWrapper('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, password) => fetchWrapper('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
    redirectToLogin: () => {
      window.location.href = '/login';
    },
    // Returns { url, redirect_uri } — use redirect_uri when verifying
    getGoogleAuthUrl: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`${API_URL}/auth/google/url`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
          let msg = 'Failed to get auth URL';
          try { const d = await res.json(); msg = d.error || d.message || msg; } catch(e) {}
          throw new Error(msg);
        }
        return res.json();
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('Google auth request timed out. The backend may be waking up — please try again.');
        throw err;
      }
    },
    verifyGoogleAuth: async (code, redirectUri) => {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri })
      });
      if (!res.ok) {
        let msg = 'Failed to verify Google Auth';
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch(e) {}
        throw new Error(msg);
      }
      const data = await res.json();
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    },

    // ── Discord OAuth ───────────────────────────────────────────────────
    getDiscordAuthUrl: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`${API_URL}/auth/discord/url`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
          let msg = 'Discord OAuth not configured';
          try { const d = await res.json(); msg = d.error || d.message || msg; } catch(e) {}
          throw new Error(msg);
        }
        return res.json();
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('Request timed out. Try again.');
        throw err;
      }
    },

    verifyDiscordAuth: async (code, redirectUri) => {
      const res = await fetch(`${API_URL}/auth/discord`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: redirectUri })
      });
      if (!res.ok) {
        let msg = 'Discord login failed';
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch(e) {}
        throw new Error(msg);
      }
      const data = await res.json();
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    },

    linkDiscord: (discord_id, discord_username, discord_avatar) =>
      fetchWrapper('/auth/discord/link', { method: 'POST', body: JSON.stringify({ discord_id, discord_username, discord_avatar }) }),

    unlinkDiscord: () =>
      fetchWrapper('/auth/discord/unlink', { method: 'POST' }),
  },
  admin: {
    getStats: () => fetchWrapper('/admin/stats'),
    getLogs: () => fetchWrapper('/admin/logs'),
    getUsers: () => fetchWrapper('/admin/users'),
    promoteUser: (email, newRole) =>
      fetchWrapper('/admin/users/promote', {
        method: 'POST',
        body: JSON.stringify({ email, role: newRole })
      }),
    assignRole: (userId, roles) => fetchWrapper('/admin/assign-role', { method: 'POST', body: JSON.stringify({ userId, roles }) }),
    manualDeposit: (user_email, amount, note) => fetchWrapper('/admin/manual-deposit', { method: 'POST', body: JSON.stringify({ user_email, amount, note }) }),
    banUser: (user_email, reason) => fetchWrapper('/admin/ban-user', { method: 'POST', body: JSON.stringify({ user_email, reason }) }),
    unbanUser: (user_email) => fetchWrapper('/admin/unban-user', { method: 'POST', body: JSON.stringify({ user_email }) }),
    broadcastNotification: (title, message, type) => fetchWrapper('/admin/broadcast-notification', { method: 'POST', body: JSON.stringify({ title, message, type }) }),
  },
  integrations: {
    Core: {
      UploadFile: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      },
      // Production avatar upload → Cloudinary → saves URL in MongoDB
      UploadAvatar: async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/upload/avatar`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) {
          let msg = 'Avatar upload failed';
          try { const j = await res.json(); msg = j.error || msg; } catch {}
          throw new Error(msg);
        }
        return res.json();
      },
    },
    Tournament: {
      Join: (tournamentId, data) => fetchWrapper(`/tournaments/${tournamentId}/join`, { method: 'POST', body: JSON.stringify(data || {}) }),
      GetById: (id) => fetchWrapper(`/tournaments/${id}`),
    },
    Payment: {
      CreateOrder: (amount, userEmail) => fetchWrapper('/payments/orders', { method: 'POST', body: JSON.stringify({ amount, user_email: userEmail }) }),
      VerifyPayment: (data) => fetchWrapper('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
      SubscribeVIP: (opts) => fetchWrapper('/payments/vip/subscribe', { method: 'POST', body: JSON.stringify(opts) }),
      Withdraw: (opts) => fetchWrapper('/payments/withdraw', { method: 'POST', body: JSON.stringify(opts) }),
    },
    DailyReward: {
      getStatus: () => fetchWrapper('/features/daily-reward/status'),
      claim: () => fetchWrapper('/features/daily-reward/claim', { method: 'POST', body: '{}' }),
    },
    Referral: {
      getStats: () => fetchWrapper('/features/referral/stats'),
      getHistory: () => fetchWrapper('/features/referral/history'),
      getLeaderboard: () => fetchWrapper('/features/referral/leaderboard'),
    },
    FlashSale: {
      getActive: () => fetchWrapper('/features/flash-sale'),
      use: (saleId, baseAmount) => fetchWrapper('/features/flash-sale/use', { method: 'POST', body: JSON.stringify({ saleId, baseAmount }) }),
    },
    Store: {
      getItems: () => fetchWrapper('/features/store/items'),
      purchase: (itemId) => fetchWrapper('/features/store/purchase', { method: 'POST', body: JSON.stringify({ itemId }) }),
    },
    Gift: {
      send: (recipientEmail, amount, message) => fetchWrapper('/features/gift/send', { method: 'POST', body: JSON.stringify({ recipientEmail, amount, message }) }),
      getHistory: () => fetchWrapper('/features/gift/history'),
    },
    SeasonPass: {
      getStatus: () => fetchWrapper('/features/season-pass/status'),
      buy: () => fetchWrapper('/features/season-pass/buy', { method: 'POST', body: '{}' }),
      claim: (level, track) => fetchWrapper('/features/season-pass/claim', { method: 'POST', body: JSON.stringify({ level, track }) }),
    },
    SpinWheel: {
      getStatus: () => fetchWrapper('/features/spin/status'),
      spin: (opts = {}) => fetchWrapper('/features/spin/spin', { method: 'POST', body: JSON.stringify(opts) }),
    },
    Missions: {
      getAll: () => fetchWrapper('/features/missions'),
      complete: (missionId) => fetchWrapper('/features/missions/complete', { method: 'POST', body: JSON.stringify({ missionId }) }),
    },
    Predictions: {
      getAll: () => fetchWrapper('/features/predictions'),
      placeBet: (predictionId, choice, amount) => fetchWrapper('/features/predictions/bet', { method: 'POST', body: JSON.stringify({ predictionId, choice, amount }) }),
    },
  },
  entities: new Proxy({}, {
    get: (target, entityName) => {
      return {
        list: (sort, limit) => fetchWrapper(`/entities/${entityName}${sort ? `?sort=${sort}` : ''}${limit ? `${sort ? '&' : '?'}limit=${limit}` : ''}`),
        filter: (queries, sort, limit) => fetchWrapper(`/entities/${entityName}/filter`, {
          method: 'POST',
          body: JSON.stringify({ queries, ...(sort ? { sort } : {}), ...(limit ? { limit } : {}) })
        }),
        get: (id) => fetchWrapper(`/entities/${entityName}/${id}`),
        create: (data) => fetchWrapper(`/entities/${entityName}`, {
          method: 'POST',
          body: JSON.stringify(data)
        }),
        update: (id, data) => fetchWrapper(`/entities/${entityName}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),
        delete: (id) => fetchWrapper(`/entities/${entityName}/${id}`, {
          method: 'DELETE'
        }),
        // Bulk create: creates items one by one (batched)
        bulkCreate: async (items) => {
          if (!items || items.length === 0) return [];
          // Send in batches of 20 to avoid timeout
          const BATCH = 20;
          const results = [];
          for (let i = 0; i < items.length; i += BATCH) {
            const batch = items.slice(i, i + BATCH);
            const promises = batch.map(item =>
              fetchWrapper(`/entities/${entityName}`, {
                method: 'POST',
                body: JSON.stringify(item)
              }).catch(() => null)
            );
            const batchResults = await Promise.all(promises);
            results.push(...batchResults.filter(Boolean));
          }
          return results;
        },
        onSnapshot: (callback) => {
          setTimeout(() => callback([]), 100);
          return { unsubscribe: () => {} };
        }
      }
    }
  })
};
