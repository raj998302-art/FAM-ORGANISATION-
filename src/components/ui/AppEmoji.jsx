/**
 * AppEmoji — Custom SVG-based gaming emojis consistent with FAM app aesthetic.
 * Usage: <AppEmoji name="fire" size={28} />
 */
import React from 'react';

const EMOJIS = {
  // 🔥 Fire / Heat
  fire: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="27" rx="8" ry="4" fill="#ff6b00" opacity="0.3"/>
      <path d="M16 3C16 3 10 10 10 16c0 2.5 1 5 3 6.5C13 20 14 18 16 17c2 1 3 3 3 5.5 2-1.5 3-4 3-6.5C22 10 16 3 16 3z" fill="url(#fire1)"/>
      <path d="M16 13C16 13 13 17 13 20c0 1.5.8 3 3 3s3-1.5 3-3c0-3-3-7-3-7z" fill="url(#fire2)"/>
      <defs>
        <linearGradient id="fire1" x1="16" y1="3" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff9d00"/>
          <stop offset="0.5" stopColor="#ff5500"/>
          <stop offset="1" stopColor="#cc2200"/>
        </linearGradient>
        <linearGradient id="fire2" x1="16" y1="13" x2="16" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffee00"/>
          <stop offset="1" stopColor="#ff8800"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🎯 Target / Mission
  target: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="9" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="5" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="2.5" fill="#ef4444"/>
      <line x1="16" y1="3" x2="16" y2="8" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="24" x2="16" y2="29" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="16" x2="8" y2="16" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="16" x2="29" y2="16" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // 🏆 Trophy
  trophy: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M10 4h12v11c0 4-2.5 7-6 7s-6-3-6-7V4z" fill="url(#troph1)"/>
      <path d="M10 7H6c0 4 2 7 4 8V7zM22 7h4c0 4-2 7-4 8V7z" fill="url(#troph2)"/>
      <rect x="13" y="22" width="6" height="4" rx="1" fill="#f59e0b"/>
      <rect x="10" y="26" width="12" height="2.5" rx="1" fill="#f59e0b"/>
      <path d="M14 13l1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4L14 13z" fill="#fef08a"/>
      <defs>
        <linearGradient id="troph1" x1="16" y1="4" x2="16" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/>
          <stop offset="1" stopColor="#d97706"/>
        </linearGradient>
        <linearGradient id="troph2" x1="16" y1="4" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d"/>
          <stop offset="1" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 📅 Calendar
  calendar: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="6" width="26" height="23" rx="3" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5"/>
      <rect x="3" y="6" width="26" height="8" rx="3" fill="#6366f1"/>
      <rect x="8" y="3" width="3" height="6" rx="1.5" fill="#a5b4fc"/>
      <rect x="21" y="3" width="3" height="6" rx="1.5" fill="#a5b4fc"/>
      <rect x="7" y="18" width="3" height="3" rx="1" fill="#e2e8f0"/>
      <rect x="14" y="18" width="3" height="3" rx="1" fill="#e2e8f0"/>
      <rect x="21" y="18" width="3" height="3" rx="1" fill="#e2e8f0"/>
      <rect x="7" y="24" width="3" height="3" rx="1" fill="#e2e8f0"/>
      <rect x="14" y="24" width="3" height="3" rx="1" fill="#e2e8f0"/>
    </svg>
  ),

  // 🏅 Medal / Season
  medal: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M12 3h8l-3 9H15L12 3z" fill="url(#medal_ribbon)"/>
      <circle cx="16" cy="21" r="8" fill="url(#medal_gold)"/>
      <circle cx="16" cy="21" r="6" fill="url(#medal_inner)"/>
      <path d="M14.5 18l1 2.5 2.5.3-1.8 1.8.4 2.5-2.1-1.1-2.1 1.1.4-2.5-1.8-1.8 2.5-.3L14.5 18z" fill="#fef9c3"/>
      <defs>
        <linearGradient id="medal_ribbon" x1="16" y1="3" x2="16" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6"/>
          <stop offset="1" stopColor="#6d28d9"/>
        </linearGradient>
        <linearGradient id="medal_gold" x1="16" y1="13" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/>
          <stop offset="1" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="medal_inner" x1="16" y1="15" x2="16" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d"/>
          <stop offset="1" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🛍️ Store / Shop
  store: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="14" width="24" height="15" rx="2" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5"/>
      <path d="M4 14h24l-3-8H7L4 14z" fill="url(#store_top)"/>
      <path d="M12 14v4a4 4 0 008 0v-4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="12" y="21" width="8" height="8" rx="1" fill="#0891b2"/>
      <rect x="14" y="21" width="4" height="4" rx="0.5" fill="#0e7490"/>
      <defs>
        <linearGradient id="store_top" x1="16" y1="6" x2="16" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0891b2"/>
          <stop offset="1" stopColor="#0e7490"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🎁 Gift
  gift: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="14" width="24" height="15" rx="2" fill="url(#gift_box)"/>
      <rect x="3" y="10" width="26" height="6" rx="2" fill="url(#gift_top)"/>
      <rect x="14" y="10" width="4" height="19" fill="#fbbf24"/>
      <rect x="4" y="13" width="24" height="4" fill="#fbbf24" opacity="0.3"/>
      <path d="M16 10c0 0-4-4-4-6s2-3 4-1 4-1 4 1-4 6-4 6z" fill="#f87171"/>
      <defs>
        <linearGradient id="gift_box" x1="16" y1="14" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ef4444"/>
          <stop offset="1" stopColor="#b91c1c"/>
        </linearGradient>
        <linearGradient id="gift_top" x1="16" y1="10" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171"/>
          <stop offset="1" stopColor="#ef4444"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 👥 Team / Refer
  team: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="10" r="5" fill="url(#team_p1)"/>
      <path d="M8 27c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="url(#team_p1)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="7" cy="12" r="3.5" fill="#6366f1" opacity="0.8"/>
      <path d="M2 27c0-3 2.2-5.5 5-5.5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="25" cy="12" r="3.5" fill="#8b5cf6" opacity="0.8"/>
      <path d="M30 27c0-3-2.2-5.5-5-5.5" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <defs>
        <linearGradient id="team_p1" x1="16" y1="5" x2="16" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa"/>
          <stop offset="1" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🔮 Predict / Crystal Ball
  predict: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <ellipse cx="16" cy="27" rx="7" ry="2.5" fill="#7c3aed" opacity="0.4"/>
      <circle cx="16" cy="15" r="12" fill="url(#pred_bg)"/>
      <circle cx="16" cy="15" r="9" fill="url(#pred_glow)" opacity="0.5"/>
      <ellipse cx="12" cy="10" rx="3" ry="2" fill="white" opacity="0.25" transform="rotate(-20 12 10)"/>
      <path d="M13 15l2 2 4-5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="12" y="26" width="8" height="2" rx="1" fill="#7c3aed"/>
      <defs>
        <radialGradient id="pred_bg" cx="50%" cy="40%" r="50%">
          <stop stopColor="#312e81"/>
          <stop offset="1" stopColor="#1e1b4b"/>
        </radialGradient>
        <radialGradient id="pred_glow" cx="40%" cy="30%" r="60%">
          <stop stopColor="#818cf8"/>
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  ),

  // 🎡 Spin Wheel
  spinwheel: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1"/>
      <path d="M16 3L16 16L27.3 9.5" fill="#7c3aed" opacity="0.8"/>
      <path d="M16 16L27.3 9.5L27.3 22.5" fill="#6d28d9" opacity="0.8"/>
      <path d="M16 16L27.3 22.5L16 29" fill="#4f46e5" opacity="0.8"/>
      <path d="M16 16L16 29L4.7 22.5" fill="#06b6d4" opacity="0.8"/>
      <path d="M16 16L4.7 22.5L4.7 9.5" fill="#0891b2" opacity="0.8"/>
      <path d="M16 3L16 16L4.7 9.5" fill="#0e7490" opacity="0.8"/>
      <circle cx="16" cy="16" r="3" fill="white"/>
      <circle cx="16" cy="16" r="1.5" fill="#1e293b"/>
    </svg>
  ),

  // 📊 Stats / Chart
  stats: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="3" width="26" height="26" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
      <rect x="7" y="20" width="4" height="8" rx="1" fill="#06b6d4"/>
      <rect x="14" y="14" width="4" height="14" rx="1" fill="#8b5cf6"/>
      <rect x="21" y="9" width="4" height="19" rx="1" fill="#f59e0b"/>
      <path d="M7 18L14 12L21 7" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="18" r="1.5" fill="#10b981"/>
      <circle cx="14" cy="12" r="1.5" fill="#10b981"/>
      <circle cx="21" cy="7" r="1.5" fill="#10b981"/>
    </svg>
  ),

  // 🎮 Gamepad
  gamepad: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="10" width="26" height="14" rx="7" fill="url(#gp_bg)"/>
      <rect x="8" y="14" width="2" height="6" rx="1" fill="#94a3b8"/>
      <rect x="6" y="16" width="6" height="2" rx="1" fill="#94a3b8"/>
      <circle cx="21" cy="15" r="1.5" fill="#06b6d4"/>
      <circle cx="24" cy="18" r="1.5" fill="#8b5cf6"/>
      <circle cx="18" cy="18" r="1.5" fill="#f59e0b"/>
      <circle cx="21" cy="21" r="1.5" fill="#10b981"/>
      <defs>
        <linearGradient id="gp_bg" x1="3" y1="10" x2="29" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b"/>
          <stop offset="1" stopColor="#0f172a"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 💬 Chat
  chat: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M4 6h24a2 2 0 012 2v14a2 2 0 01-2 2H10l-6 4V8a2 2 0 012-2z" fill="url(#chat_bg)"/>
      <rect x="9" y="13" width="14" height="2" rx="1" fill="white" opacity="0.6"/>
      <rect x="9" y="18" width="9" height="2" rx="1" fill="white" opacity="0.4"/>
      <defs>
        <linearGradient id="chat_bg" x1="4" y1="6" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed"/>
          <stop offset="1" stopColor="#4f46e5"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 👑 Crown / VIP
  crown: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M4 22h24l-3-14-6 6-3-8-3 8-6-6-3 14z" fill="url(#crown_g)"/>
      <rect x="4" y="22" width="24" height="4" rx="1" fill="#f59e0b"/>
      <circle cx="4" cy="8" r="2" fill="#fef08a"/>
      <circle cx="16" cy="5" r="2" fill="#fef08a"/>
      <circle cx="28" cy="8" r="2" fill="#fef08a"/>
      <defs>
        <linearGradient id="crown_g" x1="16" y1="4" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/>
          <stop offset="1" stopColor="#d97706"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // ⚡ Zap / Lightning
  zap: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M18 3L7 18h9l-2 11L29 13h-9L18 3z" fill="url(#zap_g)"/>
      <defs>
        <linearGradient id="zap_g" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#facc15"/>
          <stop offset="1" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 💰 Coins / Money
  coins: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="12" cy="19" r="9" fill="url(#coin2)"/>
      <circle cx="12" cy="19" r="7" fill="url(#coin2i)"/>
      <circle cx="20" cy="14" r="9" fill="url(#coin1)"/>
      <circle cx="20" cy="14" r="7" fill="url(#coin1i)"/>
      <text x="20" y="18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400e">₹</text>
      <defs>
        <linearGradient id="coin1" x1="20" y1="5" x2="20" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/>
          <stop offset="1" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="coin1i" x1="20" y1="7" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d"/>
          <stop offset="1" stopColor="#f59e0b"/>
        </linearGradient>
        <linearGradient id="coin2" x1="12" y1="10" x2="12" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d1d5db"/>
          <stop offset="1" stopColor="#6b7280"/>
        </linearGradient>
        <linearGradient id="coin2i" x1="12" y1="12" x2="12" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e5e7eb"/>
          <stop offset="1" stopColor="#9ca3af"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 📋 Forms / Application
  forms: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="5" y="3" width="22" height="27" rx="3" fill="url(#forms_bg)"/>
      <rect x="5" y="3" width="22" height="6" rx="3" fill="url(#forms_header)"/>
      <rect x="10" y="13" width="12" height="1.5" rx="0.75" fill="#e2e8f0" opacity="0.6"/>
      <rect x="10" y="17" width="9" height="1.5" rx="0.75" fill="#e2e8f0" opacity="0.6"/>
      <rect x="10" y="21" width="11" height="1.5" rx="0.75" fill="#e2e8f0" opacity="0.6"/>
      <circle cx="8" cy="13.75" r="1.25" fill="#06b6d4"/>
      <circle cx="8" cy="17.75" r="1.25" fill="#8b5cf6"/>
      <circle cx="8" cy="21.75" r="1.25" fill="#10b981"/>
      <rect x="20" y="12" width="5" height="5" rx="1" fill="#06b6d4" opacity="0.2" stroke="#06b6d4" strokeWidth="1"/>
      <path d="M21 14.5l1 1 2-2" stroke="#06b6d4" strokeWidth="1" strokeLinecap="round"/>
      <defs>
        <linearGradient id="forms_bg" x1="16" y1="3" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b"/>
          <stop offset="1" stopColor="#0f172a"/>
        </linearGradient>
        <linearGradient id="forms_header" x1="5" y1="3" x2="27" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4"/>
          <stop offset="1" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // ⭐ Star
  star: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M16 3l3.5 8.5L29 13l-7 7 1.5 9.5L16 25 8.5 29.5 10 20l-7-7 9.5-1.5L16 3z" fill="url(#star_g)"/>
      <defs>
        <linearGradient id="star_g" x1="16" y1="3" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/>
          <stop offset="1" stopColor="#d97706"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 💀 Skull / Kills
  skull: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M16 4C10 4 6 8 6 14c0 3 1.5 6 4 8v4h12v-4c2.5-2 4-5 4-8 0-6-4-10-10-10z" fill="url(#skull_g)"/>
      <ellipse cx="12" cy="14" rx="3" ry="3.5" fill="#1e293b"/>
      <ellipse cx="20" cy="14" rx="3" ry="3.5" fill="#1e293b"/>
      <rect x="10" y="22" width="3" height="3" rx="1" fill="#1e293b"/>
      <rect x="14" y="22" width="4" height="3" rx="1" fill="#1e293b"/>
      <rect x="19" y="22" width="3" height="3" rx="1" fill="#1e293b"/>
      <defs>
        <linearGradient id="skull_g" x1="16" y1="4" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94a3b8"/>
          <stop offset="1" stopColor="#475569"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🥇 Gold / 1st Place
  gold1st: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="url(#g1_bg)"/>
      <circle cx="16" cy="16" r="10" fill="url(#g1_inner)"/>
      <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#92400e">1</text>
      <defs>
        <linearGradient id="g1_bg" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/><stop offset="1" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="g1_inner" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d"/><stop offset="1" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🥈 Silver / 2nd Place
  silver2nd: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="url(#s2_bg)"/>
      <circle cx="16" cy="16" r="10" fill="url(#s2_inner)"/>
      <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#374151">2</text>
      <defs>
        <linearGradient id="s2_bg" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d1d5db"/><stop offset="1" stopColor="#6b7280"/>
        </linearGradient>
        <linearGradient id="s2_inner" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e5e7eb"/><stop offset="1" stopColor="#9ca3af"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🥉 Bronze / 3rd Place
  bronze3rd: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="url(#b3_bg)"/>
      <circle cx="16" cy="16" r="10" fill="url(#b3_inner)"/>
      <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#78350f">3</text>
      <defs>
        <linearGradient id="b3_bg" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c"/><stop offset="1" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="b3_inner" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fdba74"/><stop offset="1" stopColor="#f97316"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🎉 Confetti / Celebration
  confetti: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M6 26L14 8l12 12L6 26z" fill="url(#conf_main)"/>
      <circle cx="23" cy="8" r="2.5" fill="#f87171"/>
      <circle cx="27" cy="14" r="1.5" fill="#fbbf24"/>
      <circle cx="8" cy="10" r="1.5" fill="#34d399"/>
      <circle cx="26" cy="22" r="2" fill="#a78bfa"/>
      <rect x="12" y="5" width="3" height="3" rx="0.5" fill="#f59e0b" transform="rotate(20 12 5)"/>
      <rect x="25" y="18" width="2.5" height="2.5" rx="0.5" fill="#06b6d4" transform="rotate(-15 25 18)"/>
      <defs>
        <linearGradient id="conf_main" x1="6" y1="8" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b"/><stop offset="1" stopColor="#d97706"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🖼️ Image / Thumbnail
  image: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="6" width="26" height="20" rx="3" fill="url(#img_bg)" stroke="#475569" strokeWidth="1"/>
      <circle cx="10" cy="12" r="2.5" fill="#fbbf24"/>
      <path d="M3 22l7-7 5 5 4-4 9 9" fill="url(#img_land)" opacity="0.8"/>
      <defs>
        <linearGradient id="img_bg" x1="3" y1="6" x2="29" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b"/><stop offset="1" stopColor="#0f172a"/>
        </linearGradient>
        <linearGradient id="img_land" x1="3" y1="15" x2="29" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4"/><stop offset="1" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 📅 Event / Special occasion
  event: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="3" y="6" width="26" height="23" rx="3" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5"/>
      <rect x="3" y="6" width="26" height="8" rx="3" fill="url(#ev_top)"/>
      <rect x="8" y="3" width="3" height="6" rx="1.5" fill="#d8b4fe"/>
      <rect x="21" y="3" width="3" height="6" rx="1.5" fill="#d8b4fe"/>
      <path d="M16 16l1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5L16 16z" fill="#fbbf24"/>
      <defs>
        <linearGradient id="ev_top" x1="3" y1="6" x2="29" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a855f7"/><stop offset="1" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🔔 Notification / Bell
  notification: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M16 4a1 1 0 011 1v1.1A9 9 0 0124 15v6l3 3H5l3-3v-6A9 9 0 0115 6.1V5a1 1 0 011-1z" fill="url(#notif_g)"/>
      <ellipse cx="16" cy="27" rx="3" ry="2" fill="#f59e0b"/>
      <circle cx="24" cy="7" r="4" fill="#ef4444"/>
      <defs>
        <linearGradient id="notif_g" x1="16" y1="4" x2="16" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4"/><stop offset="1" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🚫 Ban / Block
  ban: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" fill="url(#ban_bg)"/>
      <line x1="7" y1="7" x2="25" y2="25" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <defs>
        <linearGradient id="ban_bg" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171"/><stop offset="1" stopColor="#dc2626"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 🛡️ Shield / Admin
  shield: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M16 3L5 7v10c0 6 5 11 11 12 6-1 11-6 11-12V7L16 3z" fill="url(#shield_g)"/>
      <path d="M11 16l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="shield_g" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#6d28d9"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  // 💎 Diamond
  diamond: ({ s }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M16 4L4 13l12 15 12-15L16 4z" fill="url(#diam_g)"/>
      <path d="M4 13h24" stroke="#a5f3fc" strokeWidth="0.5" opacity="0.5"/>
      <path d="M16 4L4 13h24L16 4z" fill="url(#diam_top)" opacity="0.7"/>
      <path d="M16 4l-5 9h10L16 4z" fill="white" opacity="0.2"/>
      <defs>
        <linearGradient id="diam_g" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9"/>
          <stop offset="1" stopColor="#0891b2"/>
        </linearGradient>
        <linearGradient id="diam_top" x1="4" y1="4" x2="28" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5f3fc"/>
          <stop offset="1" stopColor="#22d3ee"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};

export default function AppEmoji({ name, size = 28, className = '' }) {
  const key = name?.toLowerCase?.().replace(/[^a-z]/g, '') || 'fire';
  const EmojiComp = EMOJIS[key];
  if (!EmojiComp) {
    // Fallback: render as text emoji
    return <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }}>{name}</span>;
  }
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size, flexShrink: 0 }}>
      <EmojiComp s={size} />
    </span>
  );
}
