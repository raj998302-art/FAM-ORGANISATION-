import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ message = 'Loading...', fullScreen = false }) {
  // fullScreen=true  → used ONLY on first app load (fixed overlay, z-50)
  // fullScreen=false → used by individual pages (normal in-page flow, no overlay)
  const wrapClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950'
    : 'min-h-screen flex flex-col items-center justify-center bg-slate-950';
  return (
    <div className={wrapClass}>
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Logo/Icon */}
      <motion.div
        className="relative mb-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-24 h-24 rounded-full border-4 border-cyan-500/30" />
        <motion.div
          className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-cyan-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              boxShadow: '0 0 40px rgba(0, 255, 255, 0.6), 0 0 80px rgba(0, 255, 255, 0.3)'
            }}
          />
        </div>
      </motion.div>

      {/* Fire Arena Logo */}
      <motion.h1
        className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-4"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          textShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
        }}
      >
        FIRE ARENA MAX
      </motion.h1>

      {/* Loading text */}
      <motion.p
        className="text-cyan-400/80 text-sm tracking-widest uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}