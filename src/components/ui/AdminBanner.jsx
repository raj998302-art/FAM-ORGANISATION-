import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, AlertTriangle, Star, Zap } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

const BANNER_STYLES = {
  info:     { bg: 'from-cyan-900/90 to-slate-900/90',   border: 'border-cyan-500/40',   text: 'text-cyan-100',    icon: Megaphone,     iconColor: 'text-cyan-400'   },
  warning:  { bg: 'from-yellow-900/90 to-slate-900/90', border: 'border-yellow-500/40', text: 'text-yellow-100',  icon: AlertTriangle, iconColor: 'text-yellow-400' },
  success:  { bg: 'from-green-900/90 to-slate-900/90',  border: 'border-green-500/40',  text: 'text-green-100',   icon: Star,          iconColor: 'text-green-400'  },
  urgent:   { bg: 'from-red-900/90 to-slate-900/90',    border: 'border-red-500/50',     text: 'text-red-100',     icon: Zap,           iconColor: 'text-red-400'    },
  promo:    { bg: 'from-purple-900/90 to-slate-900/90', border: 'border-purple-500/40', text: 'text-purple-100',  icon: Star,          iconColor: 'text-purple-400' },
};

const DISMISSED_KEY = 'fam_dismissed_banners';

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch { return []; }
}
function dismiss(id) {
  const d = getDismissed();
  if (!d.includes(id)) { d.push(id); localStorage.setItem(DISMISSED_KEY, JSON.stringify(d)); }
}

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed());

  useEffect(() => {
    loadBanners();
    const interval = setInterval(loadBanners, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadBanners = async () => {
    try {
      const data = await apiClient.entities.AdminBanner.filter({ is_active: true }, '-created_date', 5).catch(() => []);
      setBanners(Array.isArray(data) ? data.filter(b => {
        if (b.expires_at && new Date(b.expires_at) < new Date()) return false;
        return true;
      }) : []);
    } catch {}
  };

  const handleDismiss = (banner) => {
    if (!banner.dismissable) return;
    dismiss(banner.id);
    setDismissed(prev => [...prev, banner.id]);
  };

  const visible = banners.filter(b => !dismissed.includes(b.id));

  if (visible.length === 0) return null;

  return (
    <div className="sticky top-0 z-50 space-y-0">
      <AnimatePresence>
        {visible.slice(0, 2).map((banner) => {
          const style = BANNER_STYLES[banner.style || 'info'];
          const Icon = style.icon;
          return (
            <motion.div
              key={banner.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`bg-gradient-to-r ${style.bg} border-b ${style.border} overflow-hidden`}
            >
              <div className="px-4 py-2.5 flex items-center gap-3">
                <Icon className={`w-4 h-4 ${style.iconColor} flex-shrink-0`} />
                <p className={`text-sm flex-1 font-medium leading-snug ${style.text}`}>
                  {banner.message}
                  {banner.cta_url && (
                    <a href={banner.cta_url} target={banner.cta_url.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="ml-2 underline font-bold opacity-90 hover:opacity-100">
                      {banner.cta_label || 'View →'}
                    </a>
                  )}
                </p>
                {banner.dismissable !== false && (
                  <button onClick={() => handleDismiss(banner)}
                    className="p-1 rounded-lg hover:bg-white/10 flex-shrink-0">
                    <X className={`w-3.5 h-3.5 ${style.iconColor}`} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
