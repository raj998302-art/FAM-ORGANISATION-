import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Trophy, Crown, Swords, Shield, Star } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';

// ── Custom SVG Icons — FAM themed, matching app's cyan/blue/purple palette ──

const IconSignup = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <circle cx="20" cy="13" r="7" stroke="#22d3ee" strokeWidth="2.2" fill="#22d3ee22"/>
    <path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="32" cy="10" r="6" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5"/>
    <path d="M29 10h6M32 7v6" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconDeposit = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <rect x="4" y="10" width="32" height="22" rx="4" stroke="#3b82f6" strokeWidth="2.2" fill="#3b82f622"/>
    <path d="M4 17h32" stroke="#3b82f6" strokeWidth="2.2"/>
    <circle cx="28" cy="26" r="4" fill="#3b82f6" opacity="0.7"/>
    <path d="M8 23h8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 6l4-4 4 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 2v8" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconTournament = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <path d="M12 4h16v16c0 4.418-3.582 8-8 8s-8-3.582-8-8V4z" stroke="#a855f7" strokeWidth="2.2" fill="#a855f722"/>
    <path d="M12 10H6a2 2 0 000 4h6M28 10h6a2 2 0 010 4h-6" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 28v6M14 36h12" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M16 14l2.5 5 5.5.8-4 3.9.94 5.5L20 26.5l-4.94 2.6.94-5.5-4-3.9 5.5-.8L16 14z" fill="#a855f7" opacity="0.8"/>
  </svg>
);

const IconController = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <rect x="4" y="12" width="32" height="18" rx="9" stroke="#f97316" strokeWidth="2.2" fill="#f9731622"/>
    <path d="M13 18v6M10 21h6" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="27" cy="19" r="1.5" fill="#f97316"/>
    <circle cx="30" cy="22" r="1.5" fill="#f97316"/>
    <circle cx="24" cy="22" r="1.5" fill="#f97316"/>
    <circle cx="27" cy="25" r="1.5" fill="#f97316"/>
    <path d="M18 5c2 0 4 7 4 7h-2l-2-7z" stroke="#f97316" strokeWidth="1.5" fill="#f9731633"/>
    <path d="M22 5c-2 0-4 7-4 7h2l2-7z" stroke="#f97316" strokeWidth="1.5" fill="#f9731633"/>
  </svg>
);

const IconPrize = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
    <circle cx="20" cy="18" r="12" stroke="#22c55e" strokeWidth="2.2" fill="#22c55e22"/>
    <path d="M14 18c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="#22c55e" opacity="0.4"/>
    <path d="M20 14v4l2.5 2.5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 34l4-6h16l4 6H8z" stroke="#22c55e" strokeWidth="1.8" fill="#22c55e22"/>
    <path d="M16 34v-6M24 34v-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20 6V2M14 8l-3-3M26 8l3-3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ── Earn Ways custom icons ────────────────────────────────────────────────────

const IconTrophyEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <path d="M10 4h16v13c0 3.866-3.134 7-7 7s-7-3.134-7-7V4z" stroke="#fbbf24" strokeWidth="2" fill="#fbbf2422"/>
    <path d="M10 9H5a2 2 0 000 4h5M26 9h5a2 2 0 010 4h-5" stroke="#fbbf24" strokeWidth="1.8"/>
    <path d="M18 24v5M13 31h10" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14.5 13l2 4 4.5.6-3.25 3.17.77 4.47L18 22.75l-4.02 2.11.77-4.47L11.5 17.6l4.5-.6-.5-4z" fill="#fbbf24" opacity="0.9"/>
  </svg>
);

const IconSpinEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <circle cx="18" cy="18" r="13" stroke="#06b6d4" strokeWidth="2" fill="#06b6d422"/>
    <circle cx="18" cy="18" r="4" fill="#06b6d4" opacity="0.8"/>
    {[0,45,90,135,180,225,270,315].map((angle, i) => (
      <line key={i} x1="18" y1="18"
        x2={18 + 10 * Math.cos((angle * Math.PI) / 180)}
        y2={18 + 10 * Math.sin((angle * Math.PI) / 180)}
        stroke={i % 2 === 0 ? "#06b6d4" : "#0891b2"} strokeWidth="2.5" strokeLinecap="round"
        opacity={i % 2 === 0 ? "0.9" : "0.5"}/>
    ))}
    <path d="M28 8c2 3 3 7 2 11" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
    <path d="M30 19l-3-1 1 3" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCalendarEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <rect x="4" y="7" width="28" height="24" rx="4" stroke="#818cf8" strokeWidth="2" fill="#818cf822"/>
    <path d="M4 14h28" stroke="#818cf8" strokeWidth="2"/>
    <path d="M12 4v6M24 4v6" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
    <rect x="9" y="18" width="5" height="5" rx="1" fill="#818cf8" opacity="0.8"/>
    <rect x="16" y="18" width="5" height="5" rx="1" fill="#818cf8" opacity="0.5"/>
    <rect x="9" y="25" width="5" height="3" rx="1" fill="#818cf8" opacity="0.4"/>
    <path d="M21 22l2 2 4-4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMissionsEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <circle cx="18" cy="18" r="13" stroke="#ec4899" strokeWidth="2" fill="#ec489922"/>
    <circle cx="18" cy="18" r="7" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 2"/>
    <circle cx="18" cy="18" r="2.5" fill="#ec4899"/>
    <path d="M18 5v4M18 27v4M5 18h4M27 18h4" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"/>
    <path d="M25 9l-2.8 2.8M11 25.2L8 28M25 27l-2.8-2.8M11 10.8L8 8" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

const IconReferralEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <circle cx="10" cy="13" r="5" stroke="#34d399" strokeWidth="1.8" fill="#34d39922"/>
    <circle cx="26" cy="13" r="5" stroke="#34d399" strokeWidth="1.8" fill="#34d39922"/>
    <circle cx="18" cy="24" r="5" stroke="#34d399" strokeWidth="1.8" fill="#34d39922"/>
    <path d="M15 17l3 4 3-4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 18c0 3 3.5 5 8 6M26 18c0 3-3.5 5-8 6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M28 8l3-2" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IconSeasonEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <rect x="4" y="10" width="28" height="20" rx="4" stroke="#f59e0b" strokeWidth="2" fill="#f59e0b22"/>
    <path d="M4 17h28" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2"/>
    <circle cx="11" cy="13.5" r="2.5" fill="#f59e0b" opacity="0.9"/>
    <circle cx="18" cy="13.5" r="2.5" fill="#f59e0b" opacity="0.5"/>
    <circle cx="25" cy="13.5" r="2.5" fill="#f59e0b" opacity="0.2"/>
    <path d="M9 24h5M14 21v6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M21 24l1.5-3 1.5 3h-3z" stroke="#f59e0b" strokeWidth="1.5" fill="#f59e0b44" strokeLinejoin="round"/>
    <path d="M18 6l1 2h3l-2.5 1.8 1 3L18 11.5l-2.5 1.3 1-3L14 8h3l1-2z" fill="#f59e0b" opacity="0.7"/>
  </svg>
);

const IconPredictEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <circle cx="18" cy="18" r="13" stroke="#8b5cf6" strokeWidth="2" fill="#8b5cf622"/>
    <path d="M14 24c0-4 8-4 8-8a4 4 0 00-8 0" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="18" cy="27" r="1.5" fill="#8b5cf6"/>
    <path d="M11 10l-2-2M25 10l2-2M18 5V3" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IconGiftEarn = () => (
  <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
    <rect x="5" y="15" width="26" height="18" rx="3" stroke="#f43f5e" strokeWidth="2" fill="#f43f5e22"/>
    <rect x="9" y="10" width="18" height="8" rx="2" stroke="#f43f5e" strokeWidth="2" fill="#f43f5e11"/>
    <path d="M18 10c0-4-5-4-5-1s5 1 5 1z" fill="#f43f5e" opacity="0.8"/>
    <path d="M18 10c0-4 5-4 5-1s-5 1-5 1z" fill="#f43f5e" opacity="0.6"/>
    <path d="M18 15v18M5 22h26" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"/>
    <path d="M11 28l2-3 2 3" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const STEPS = [
  { step:'1', IconComp: IconSignup,     title:'Create Your Account',  desc:'Sign up free with email. Your journey into the arena begins here!', color:'cyan' },
  { step:'2', IconComp: IconDeposit,    title:'Deposit Coins',         desc:'Buy coins via Razorpay (UPI, cards, net banking). ₹1 = 1 coin. VIP users get bonus coins!', color:'blue' },
  { step:'3', IconComp: IconTournament, title:'Join Tournaments',      desc:'Browse live tournaments by game mode (Solo/Duo/Squad). Pay entry with coins.', color:'purple' },
  { step:'4', IconComp: IconController, title:'Play & Compete',        desc:'Get room code before match. Play your best and climb the leaderboard!', color:'orange' },
  { step:'5', IconComp: IconPrize,      title:'Win Real Prizes',       desc:'Top finishers win coins to wallet. Withdraw anytime via UPI or bank!', color:'green' },
];

const EARN_WAYS = [
  { IconComp: IconTrophyEarn,   label:'Win Tournaments',  desc:'1st place wins the prize pool',     coins:'500–50,000' },
  { IconComp: IconSpinEarn,     label:'Spin Wheel',        desc:'Daily free spin for coins',          coins:'5–500' },
  { IconComp: IconCalendarEarn, label:'Daily Login',       desc:'7-day streak = 100 coins',           coins:'5–100' },
  { IconComp: IconMissionsEarn, label:'Daily Missions',   desc:'Complete tasks for coins',            coins:'5–50/mission' },
  { IconComp: IconReferralEarn, label:'Refer Friends',     desc:'₹10 per friend who deposits',        coins:'10/referral' },
  { IconComp: IconSeasonEarn,   label:'Season Pass',       desc:'Claim rewards by level',             coins:'5–100/level' },
  { IconComp: IconPredictEarn,  label:'Predictions',       desc:'Correct prediction = 2x coins',      coins:'Multiplied' },
  { IconComp: IconGiftEarn,     label:'Receive Gifts',     desc:'Friends can gift you coins',         coins:'Varies' },
];

const colorMap = {
  cyan:   'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  blue:   'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  green:  'from-green-500/20 to-green-600/10 border-green-500/30',
};

const stepNumColor = {
  cyan: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/50',
  blue: 'text-blue-400 bg-blue-500/20 border-blue-500/50',
  purple: 'text-purple-400 bg-purple-500/20 border-purple-500/50',
  orange: 'text-orange-400 bg-orange-500/20 border-orange-500/50',
  green: 'text-green-400 bg-green-500/20 border-green-500/50',
};

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1 transition-colors">
          <ChevronLeft className="w-6 h-6"/>
        </button>
        <div>
          <NeonText color="cyan" size="2xl" className="block flex items-center gap-2">
            <svg viewBox="0 0 28 28" fill="none" className="inline w-6 h-6 mr-1">
              <rect x="3" y="5" width="22" height="18" rx="3" stroke="#22d3ee" strokeWidth="2" fill="#22d3ee22"/>
              <path d="M3 11h22" stroke="#22d3ee" strokeWidth="1.5"/>
              <path d="M9 16h10M9 20h6" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="21" cy="7" r="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5"/>
              <path d="M19.5 7h3M21 5.5v3" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            How It Works
          </NeonText>
          <p className="text-slate-400 text-xs">Your complete guide to Fire Arena MAX</p>
        </div>
      </div>

      {/* Main Steps */}
      <h2 className="text-white font-bold mb-3 flex items-center gap-2">
        <Swords className="w-5 h-5 text-cyan-400"/> Getting Started
      </h2>
      <div className="space-y-3 mb-7">
        {STEPS.map((s, i) => (
          <motion.div key={s.step} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
            <div className={`rounded-2xl border bg-gradient-to-r ${colorMap[s.color]} p-4`}>
              <div className="flex items-center gap-4">
                {/* Custom Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[s.color]} border flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <s.IconComp />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${stepNumColor[s.color]}`}>
                      STEP {s.step}
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm">{s.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ways to earn */}
      <h2 className="text-white font-bold mb-3 flex items-center gap-2">
        <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
          <circle cx="11" cy="11" r="9" stroke="#facc15" strokeWidth="1.8" fill="#facc1522"/>
          <path d="M11 6v5l3 3" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16l-2 2M15 16l2 2" stroke="#facc15" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
        </svg>
        All Ways to Earn Coins
      </h2>
      <div className="grid grid-cols-2 gap-2.5 mb-7">
        {EARN_WAYS.map((w, i) => (
          <motion.div key={w.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <GlowCard glowColor="cyan" className="p-3 h-full flex flex-col">
              <div className="mb-2">
                <w.IconComp />
              </div>
              <p className="text-white text-xs font-bold">{w.label}</p>
              <p className="text-slate-500 text-xs flex-1">{w.desc}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                  <circle cx="8" cy="8" r="6.5" stroke="#facc15" strokeWidth="1.5" fill="#facc1522"/>
                  <path d="M8 4.5v3l2 2" stroke="#facc15" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-yellow-400 text-xs font-bold">{w.coins}</p>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* VIP Benefits */}
      <h2 className="text-white font-bold mb-3 flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-400"/> VIP Benefits
      </h2>
      <GlowCard glowColor="gold" className="p-5 mb-5">
        <div className="space-y-2">
          {[
            ['5–15% bonus coins on every deposit',        '💰'],
            ['Exclusive VIP tournaments (bigger prizes)',  '🏆'],
            ['Private VIP chat lounge',                    '💬'],
            ['Priority support with faster response',      '⚡'],
            ['Custom profile borders and badges',          '🎨'],
            ['Early tournament registration access',       '📌'],
            ['2x rewards on daily missions',               '✖️'],
            ['Referral bonus increases to ₹25',           '👥'],
          ].map(([b, em], i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">{em}</span>
              <span className="text-slate-300 text-xs leading-relaxed">{b}</span>
            </div>
          ))}
        </div>
        <GamingButton variant="gold" size="md" className="w-full mt-4" icon={Crown} onClick={() => navigate(createPageUrl('VIPPlans'))}>
          View VIP Plans →
        </GamingButton>
      </GlowCard>

      {/* Safety */}
      <GlowCard glowColor="green" className="p-4 mb-5">
        <p className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4"/> Safe &amp; Secure Platform
        </p>
        <div className="space-y-2">
          {[
            ['Payments secured by Razorpay (RBI licensed)',   '🔒'],
            ['All transactions are logged and auditable',     '📋'],
            ['Withdrawals processed within 24 hours',         '⏱️'],
            ['Fair results verified by our admin team',       '✅'],
            ['Data encrypted end-to-end',                     '🛡️'],
          ].map(([t, em]) => (
            <div key={t} className="flex items-center gap-2">
              <span className="text-sm">{em}</span>
              <span className="text-slate-400 text-xs">{t}</span>
            </div>
          ))}
        </div>
      </GlowCard>

      <div className="grid grid-cols-2 gap-3">
        <GamingButton variant="primary" size="md" icon={Trophy} onClick={() => navigate(createPageUrl('Tournaments'))}>
          Join Tournament
        </GamingButton>
        <GamingButton variant="outline" size="md" onClick={() => navigate(createPageUrl('Deposit'))}>
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 mr-1.5 inline">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15"/>
            <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Buy Coins
        </GamingButton>
      </div>
    </div>
  );
}
