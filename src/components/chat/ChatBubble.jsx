import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import { Shield, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatBubble({ message, isCurrentUser }) {
  const isAdmin = message.is_admin_reply;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        'flex gap-2 max-w-[85%]',
        isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
        isAdmin 
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
          : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
      )}>
        {isAdmin ? (
          <Shield className="w-4 h-4 text-purple-400" />
        ) : (
          <span className="text-xs font-bold text-cyan-400">
            {message.username?.[0]?.toUpperCase() || 'U'}
          </span>
        )}
      </div>

      {/* Message */}
      <div className={cn(
        'rounded-2xl px-4 py-2.5 max-w-full',
        isAdmin 
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30'
          : isCurrentUser
            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
            : 'bg-slate-800 border border-slate-700'
      )}>
        {/* Admin label */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3 h-3 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400">Support Team</span>
          </div>
        )}

        {/* Message content */}
        <p className="text-sm text-slate-200 break-words whitespace-pre-wrap">
          {message.message}
        </p>

        {/* Attachment */}
        {message.attachment_url && (
          <img 
            src={message.attachment_url} 
            alt="Attachment" 
            className="mt-2 rounded-lg max-w-full h-auto max-h-48 object-cover"
          />
        )}

        {/* Time and status */}
        <div className={cn(
          'flex items-center gap-1.5 mt-1.5',
          isCurrentUser ? 'justify-end' : 'justify-start'
        )}>
          <span className="text-[10px] text-slate-500">
            {safeFormat(message.created_date, 'h:mm a')}
          </span>
          {isCurrentUser && !isAdmin && (
            message.read_by_admin ? (
              <CheckCheck className="w-3 h-3 text-cyan-400" />
            ) : (
              <Check className="w-3 h-3 text-slate-500" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}