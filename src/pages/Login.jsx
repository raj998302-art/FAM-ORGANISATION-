import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowLeft } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function Login() {
  const { isAuthenticated, checkAppState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Handle Google OAuth redirect fallback (when popup is blocked)
  useEffect(() => {
    const googleCode = searchParams.get('google_code');
    const discordCode = searchParams.get('discord_code');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError('Sign-in failed: ' + oauthError);
      return;
    }

    if (discordCode) {
      setLoading(true);
      const backendUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
      const redirectUri = `${backendUrl}/api/auth/discord/callback`;
      apiClient.auth.verifyDiscordAuth(discordCode, redirectUri)
        .then(data => {
          if (data.token) {
            localStorage.setItem('token', data.token);
            toast.success('Logged in with Discord!');
            window.location.href = '/';
          } else {
            throw new Error('No token returned');
          }
        })
        .catch(err => {
          setError('Discord sign-in failed: ' + err.message);
          setLoading(false);
        });
      return;
    }

    if (googleCode) {
      setLoading(true);
      // Use the canonical backend redirect URI
      const backendUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
      const redirectUri = `${backendUrl}/api/auth/google/callback`;

      apiClient.auth.verifyGoogleAuth(googleCode, redirectUri)
        .then(data => {
          if (data.token) {
            localStorage.setItem('token', data.token);
            toast.success('Logged in successfully!');
            window.location.href = '/';
          } else {
            throw new Error('No token returned');
          }
        })
        .catch(err => {
          setError('Google sign-in failed: ' + err.message);
          setLoading(false);
        });
    }
  }, [searchParams]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.auth.loginViaEmailPassword(email, password);
      await checkAppState();
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error('Enter your email'); return; }
    setForgotLoading(true);
    try {
      await apiClient.auth.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch(err) { setForgotSent(true); } // Always show success (security)
    finally { setForgotLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await apiClient.auth.getGoogleAuthUrl();
      
      // Handle not-configured case
      if (result.error) {
        setError('Google Sign-In is not configured yet. Please contact the admin or use email login.');
        setLoading(false);
        return;
      }
      
      const { url, redirect_uri } = result;
      const authWindow = window.open(url, 'oauth_popup', 'width=500,height=620,left=200,top=80,scrollbars=yes');
      setLoading(false);

      if (!authWindow) {
        // Popup blocked — do a full redirect
        window.location.href = url;
        return;
      }

      const handleMessage = async (event) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.code) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
          setLoading(true);
          try {
            const data = await apiClient.auth.verifyGoogleAuth(event.data.code, redirect_uri);
            if (data.token) {
              localStorage.setItem('token', data.token);
              toast.success('Logged in with Google!');
              window.location.href = '/';
            } else {
              throw new Error('Authentication failed — no token received');
            }
          } catch (err) {
            setError('Google sign-in failed: ' + (err.message || 'Unknown error'));
          } finally {
            setLoading(false);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }
      }, 800);

    } catch (error) {
      setLoading(false);
      setError(error.message || 'Unable to connect to server. Please try again.');
    }
  };

  const handleDiscordLogin = async () => {
    try {
      const { url, redirect_uri } = await apiClient.auth.getDiscordAuthUrl();
      const authWindow = window.open(url, 'discord_oauth', 'width=600,height=700,left=200,top=100');
      if (!authWindow) {
        toast.info('Redirecting to Discord sign-in...');
        window.location.href = url;
        return;
      }
      const handleMessage = async (event) => {
        if (event.data?.type === 'DISCORD_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          try {
            const data = await apiClient.auth.verifyDiscordAuth(event.data.code, redirect_uri);
            if (data.token) {
              localStorage.setItem('token', data.token);
              toast.success('Logged in with Discord!');
              window.location.href = '/';
            }
          } catch (err) {
            setError('Discord login failed: ' + err.message);
          }
        }
      };
      window.addEventListener('message', handleMessage);
      const checkClosed = setInterval(() => {
        if (authWindow.closed) { clearInterval(checkClosed); window.removeEventListener('message', handleMessage); }
      }, 1000);
    } catch (error) {
      setError(error.message || 'Discord login not configured yet');
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
          
          <div className="flex justify-center mb-6 relative">
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-cyan-500/25 blur-2xl rounded-full scale-150" 
            />
            <div className="relative z-10">
              <img
                src="https://i.ibb.co/39H03P4C/file-00000000b718720782db0e5073b7aac2.png"
                alt="Fire Arena MAX"
                className="w-20 h-20 rounded-2xl object-contain shadow-[0_0_40px_rgba(6,182,212,0.5)] border border-cyan-400/40"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-400/50 items-center justify-center hidden">
                <span className="text-4xl">🔥</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400 uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
              Fire Arena MAX
            </h2>
            <p className="text-slate-500 text-xs tracking-widest font-bold mt-1 uppercase">India's #1 Free Fire Tournament</p>
          </div>
          
          {error && <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg text-sm text-center">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4 mb-6 relative z-10">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required 
                className="relative w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur" />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required 
                className="relative w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); }}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors bg-transparent border-none">
                      Forgot Password?
                    </button>
                    {/* Forgot Password Modal */}
                    <AnimatePresence>
                      {showForgot && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                          <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}}
                            className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <button onClick={() => setShowForgot(false)} className="float-right text-slate-400 hover:text-white -mt-1 -mr-1"><span className="text-xl">×</span></button>
                            <h3 className="text-xl font-black text-white mb-1">Reset Password</h3>
                            <p className="text-slate-400 text-sm mb-4">We'll send a reset link to your email</p>
                            {forgotSent ? (
                              <div className="text-center py-4">
                                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                                </div>
                                <p className="text-green-400 font-bold mb-1">Email Sent!</p>
                                <p className="text-slate-400 text-sm mb-4">Check your inbox (and spam folder).</p>
                                <button onClick={() => setShowForgot(false)} className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mx-auto">
                                  <ArrowLeft className="w-4 h-4"/> Back to Login
                                </button>
                              </div>
                            ) : (
                              <form onSubmit={handleForgotPassword} className="space-y-3">
                                <input type="email" placeholder="Your account email" value={forgotEmail}
                                  onChange={e => setForgotEmail(e.target.value)} required
                                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400"/>
                                <button type="submit" disabled={forgotLoading}
                                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl">
                                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                                </button>
                                <button type="button" onClick={() => setShowForgot(false)}
                                  className="w-full text-slate-400 text-sm flex items-center justify-center gap-1 hover:text-slate-300">
                                  <ArrowLeft className="w-4 h-4"/> Back to Login
                                </button>
                              </form>
                            )}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading} 
              className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50"
            >
              {loading ? 'Logging in...' : 'Login'}
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
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="relative z-10 text-sm">Continue with Google</span>
            </button>

            {/* Discord Login */}
            <button
              type="button"
              onClick={handleDiscordLogin}
              disabled={loading}
              className="group w-full relative overflow-hidden bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border border-[#4752C4] hover:border-[#3c45a5] shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.118 18.1.136 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="text-sm">Continue with Discord</span>
            </button>

            <p className="text-center text-xs text-slate-400">
              Need an account? <Link to="/signup" className="text-cyan-400 hover:text-cyan-300">Sign Up</Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
