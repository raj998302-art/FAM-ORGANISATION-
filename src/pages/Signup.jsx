import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Navigate, Link } from 'react-router-dom';

export default function Signup() {
  const { isAuthenticated, checkAppState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Optionally pre-read the query param when page loads to give visual feedback
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
       localStorage.setItem('referralCode', params.get('ref').toUpperCase());
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    
    // Extract referral code from URL search string if present
    const params = new URLSearchParams(window.location.search);
    let referralCode = params.get('ref') || '';
    
    // Or fallback to checking locally stored one if needed
    if (!referralCode) {
      referralCode = localStorage.getItem('referralCode') || '';
    }

    try {
      await apiClient.auth.signupViaEmailPassword(email, password, fullName, referralCode);
      if (referralCode) localStorage.removeItem('referralCode'); // Clear it after use
      await checkAppState();
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { url } = await apiClient.auth.getGoogleAuthUrl();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        toast.error('Please allow popups for this site to connect your account.');
        return;
      }
      
      const handleMessage = async (event) => {
         if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            const apiHost = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : window.location.origin;
            const redirectUri = apiHost + '/api/auth/google/callback';
            
            try {
               const data = await apiClient.auth.verifyGoogleAuth(event.data.code, redirectUri);
               
               if (data.token) {
                 localStorage.setItem('token', data.token);
                 toast.success('Signed in successfully!');
                 window.location.href = '/'; // full reload
               } else {
                 throw new Error('No token returned');
               }
            } catch (err) {
               toast.error('OAuth Exchange Failed: ' + err.message);
            }
         }
      };
      
      window.addEventListener('message', handleMessage);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 flex items-center justify-center px-4">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/40 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div 
          animate={{ boxShadow: ['0 0 30px rgba(6,182,212,0.2)', '0 0 60px rgba(6,182,212,0.5)', '0 0 30px rgba(6,182,212,0.2)'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-slate-900/90 border border-cyan-500/30 p-8 sm:p-10 rounded-3xl backdrop-blur-3xl relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.4)]"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
          
          <div className="flex justify-center mb-8 relative">
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
               transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
               className="absolute inset-0 bg-cyan-500/30 blur-2xl rounded-full scale-150" 
             />
             <div className="w-20 h-20 rounded-2xl overflow-hidden border border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.5)] relative z-10">
               <img
                 src="https://i.ibb.co/39H03P4C/file-00000000b718720782db0e5073b7aac2.png"
                 alt="Fire Arena MAX"
                 className="w-full h-full object-contain bg-slate-900"
                 onError={(e) => { e.target.parentElement.innerHTML = '<div class=\"w-full h-full bg-slate-800 flex items-center justify-center text-4xl\">🔥</div>'; }}
               />
             </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400 uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
              Join Fire Arena
            </h2>
            <p className="text-cyan-400/80 text-xs tracking-widest font-bold mt-2 uppercase">Custom Backend Active</p>
          </div>
          
          {error && <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm text-center">{error}</div>}

          <form onSubmit={handleSignup} className="space-y-4 mb-6 relative z-10">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur" />
              <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required 
                className="relative w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required 
                className="relative w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="relative w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur" />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                className="relative w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading} 
              className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </motion.button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-900 text-slate-400">Or</span></div>
          </div>

          <div className="space-y-4">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group w-full relative overflow-hidden bg-slate-800 hover:bg-slate-700/80 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border border-slate-700 hover:border-cyan-500/50 shadow-lg"
            >
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="relative z-10 text-sm">Continue with Google</span>
            </button>
            <p className="text-center text-xs text-slate-400">
              Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Login</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
