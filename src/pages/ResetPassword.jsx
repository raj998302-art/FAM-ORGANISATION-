import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid reset link. Request a new one.'); return; }
    setLoading(true); setError('');
    try {
      await apiClient.auth.resetPassword(token, password);
      setDone(true);
      toast.success('Password reset! You can now login.');
    } catch(err) { setError(err.message || 'Reset failed. Link may have expired.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-950 to-slate-950"/>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-sm relative z-10">
        <div className="bg-slate-900/90 border border-cyan-500/30 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.3)]">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"/>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <Flame className="w-8 h-8 text-cyan-400"/>
            </div>
          </div>

          {done ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4"/>
              <h2 className="text-xl font-black text-white mb-2">Password Reset!</h2>
              <p className="text-slate-400 text-sm mb-6">Your password has been updated successfully.</p>
              <Link to="/login" className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-center">Go to Login</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">New Password</h2>
                <p className="text-slate-400 text-sm mt-1">Set your new Fire Arena MAX password</p>
              </div>
              {error && <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg text-sm text-center">{error}</div>}
              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                  <Input type={showPw?'text':'password'} placeholder="New password (min 6 chars)" value={password}
                    onChange={e=>setPassword(e.target.value)} required
                    className="bg-slate-900 border-slate-700 text-white focus:border-cyan-400 pr-10"/>
                  <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-3 text-slate-400">
                    {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
                <Input type="password" placeholder="Confirm new password" value={confirm}
                  onChange={e=>setConfirm(e.target.value)} required
                  className="bg-slate-900 border-slate-700 text-white focus:border-cyan-400"/>
                <motion.button whileTap={{scale:0.97}} type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  {loading ? 'Resetting…' : 'Reset Password'}
                </motion.button>
                <p className="text-center text-xs text-slate-500"><Link to="/login" className="text-cyan-400 hover:underline">Back to Login</Link></p>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
