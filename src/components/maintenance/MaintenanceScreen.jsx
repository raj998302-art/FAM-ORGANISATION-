import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, AlertTriangle } from 'lucide-react';

export default function MaintenanceScreen({ message, endTime }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950" />
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Icon */}
        <motion.div
          className="mx-auto mb-8 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center"
          animate={{ 
            boxShadow: [
              '0 0 30px rgba(0,255,255,0.2)',
              '0 0 60px rgba(0,255,255,0.4)',
              '0 0 30px rgba(0,255,255,0.2)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Wrench className="w-16 h-16 text-cyan-400" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          SERVER MAINTENANCE
        </motion.h1>

        {/* Alert */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-medium">Scheduled Downtime</span>
        </div>

        {/* Message */}
        <p className="text-slate-400 mb-8 leading-relaxed">
          {message || 'We are currently performing scheduled maintenance to improve your gaming experience. Please check back soon!'}
        </p>

        {/* End Time */}
        {endTime && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 text-sm">
              Expected back: {new Date(endTime).toLocaleString()}
            </span>
          </div>
        )}

        {/* Loading indicator */}
        <div className="mt-8">
          <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-600 text-sm">FIRE ARENA</p>
      </div>
    </div>
  );
}