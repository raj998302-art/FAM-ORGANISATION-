import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Home, 
  Trophy, 
  Wallet, 
  User, 
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: 'Home' },
    { icon: Trophy, label: 'Tournaments', path: 'Tournaments' },
    { icon: MessageCircle, label: 'Chats', path: 'ChatsHub' },
    { icon: Wallet, label: 'Wallet', path: 'Wallet' },
    { icon: User, label: 'Profile', path: 'Profile' },
  ];

  const isActive = (path) => {
    const pageUrl = createPageUrl(path);
    return location.pathname === pageUrl || location.pathname === pageUrl.replace(/\/$/, '');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Blur background */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50" />
      
      <nav className="relative flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className="relative flex flex-col items-center py-2 px-4"
            >
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-2xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="relative"
              >
                <item.icon 
                  className={cn(
                    'w-6 h-6 transition-all duration-300',
                    active 
                      ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' 
                      : 'text-slate-500'
                  )} 
                />
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"
                    style={{ boxShadow: '0 0 10px rgba(0,255,255,0.8)' }}
                  />
                )}
              </motion.div>
              <span className={cn(
                'text-xs mt-1 font-medium transition-colors duration-300',
                active ? 'text-cyan-400' : 'text-slate-500'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}