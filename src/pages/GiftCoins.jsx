import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gift, Send, ChevronLeft, Coins, ArrowRight, ArrowLeft, Users, History } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function GiftCoins() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [wallet, setWallet]     = useState(null);
  const [email, setEmail]       = useState('');
  const [amount, setAmount]     = useState('');
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);
  const [history, setHistory]   = useState({ sent: [], received: [] });
  const [tab, setTab]           = useState('send'); // send | history

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const user = await apiClient.auth.me();
      const [ws, hist] = await Promise.all([
        apiClient.entities.Wallet.filter({ user_email: user.email }),
        apiClient.integrations.Gift.getHistory(),
      ]);
      if (ws[0]) setWallet(ws[0]);
      setHistory(hist || { sent: [], received: [] });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const send = async (e) => {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!email) { toast.error('Enter recipient email'); return; }
    if (!amt || amt < 10) { toast.error('Minimum gift is 10 coins'); return; }
    if (amt > (wallet?.balance || 0)) { toast.error('Insufficient coins'); return; }
    setSending(true);
    try {
      await apiClient.integrations.Gift.send(email, amt, message);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      toast.success(`🎁 ${amt} coins gifted to ${email}!`);
      setEmail(''); setAmount(''); setMessage('');
      await load();
    } catch(e) { toast.error(e.message); }
    finally { setSending(false); }
  };

  if (loading) return <LoadingScreen message="Loading…"/>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div>
          <NeonText color="cyan" size="2xl" className="block">🎁 Gift Coins</NeonText>
          <p className="text-slate-400 text-xs">Send coins to your friends instantly</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30">
          <Coins className="w-4 h-4 text-yellow-400"/>
          <span className="text-yellow-400 font-bold text-sm">{wallet?.balance || 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['send','Send Gift'],['history','History']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tab===t?'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400':'bg-slate-800 border border-slate-700 text-slate-400'}`}>
            {t==='send'?<><Gift className="w-4 h-4 inline mr-1"/>{l}</>:<><History className="w-4 h-4 inline mr-1"/>{l}</>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'send' ? (
          <motion.div key="send" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} className="space-y-4">
            <GlowCard glowColor="cyan" className="p-5">
              <form onSubmit={send} className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-semibold block mb-1.5">Recipient Email</label>
                  <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="friend@example.com" type="email" required
                    className="bg-slate-800 border-slate-700 text-white focus:border-cyan-400"/>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-semibold block mb-1.5">Amount (coins)</label>
                  <Input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Min 10 coins" type="number" min="10" required
                    className="bg-slate-800 border-slate-700 text-white focus:border-cyan-400 text-xl font-bold h-14 text-center"/>
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {QUICK_AMOUNTS.map(a => (
                      <button key={a} type="button" onClick={() => setAmount(a.toString())}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${parseInt(amount)===a?'bg-cyan-500/20 border-cyan-400 text-cyan-400':'bg-slate-800 border-slate-700 text-slate-400 hover:border-cyan-500/40'}`}>
                        {a} coins
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-semibold block mb-1.5">Message (optional)</label>
                  <Input value={message} onChange={e=>setMessage(e.target.value)} placeholder="e.g. Happy Birthday! 🎉" maxLength={100}
                    className="bg-slate-800 border-slate-700 text-white focus:border-cyan-400"/>
                </div>
                {parseInt(amount) >= 10 && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-slate-300 text-sm">You send</span>
                    <span className="text-cyan-400 font-black">{amount} 🪙</span>
                  </motion.div>
                )}
                <GamingButton variant="primary" size="lg" className="w-full" icon={Send} disabled={sending || !email || !amount}>
                  {sending ? 'Sending Gift…' : `Send ${amount||'?'} Coins`}
                </GamingButton>
              </form>
            </GlowCard>

            <GlowCard glowColor="purple" className="p-4">
              <p className="text-purple-400 font-bold text-sm mb-1">💡 Gift Rules</p>
              <ul className="text-slate-400 text-xs space-y-0.5">
                <li>• Minimum gift: 10 coins</li>
                <li>• Recipient must have a FAM account</li>
                <li>• Gifts are instant and non-refundable</li>
                <li>• VIP users get gifting priority support</li>
              </ul>
            </GlowCard>
          </motion.div>
        ) : (
          <motion.div key="history" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} className="space-y-4">
            {/* Received */}
            {history.received.length > 0 && (
              <div>
                <h3 className="text-green-400 font-bold text-sm mb-2 flex items-center gap-1.5"><ArrowLeft className="w-4 h-4"/> Received</h3>
                <div className="space-y-2">
                  {history.received.map((g,i) => (
                    <GlowCard key={i} glowColor="green" className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-semibold">From {g.sender_name || g.sender_email}</p>
                        {g.message && <p className="text-slate-400 text-xs">"{g.message}"</p>}
                        <p className="text-slate-500 text-xs">{g.sent_at ? new Date(g.sent_at).toLocaleDateString('en-IN') : ''}</p>
                      </div>
                      <span className="text-green-400 font-black text-lg">+{g.amount} 🪙</span>
                    </GlowCard>
                  ))}
                </div>
              </div>
            )}
            {/* Sent */}
            {history.sent.length > 0 && (
              <div>
                <h3 className="text-orange-400 font-bold text-sm mb-2 flex items-center gap-1.5"><ArrowRight className="w-4 h-4"/> Sent</h3>
                <div className="space-y-2">
                  {history.sent.map((g,i) => (
                    <GlowCard key={i} glowColor="orange" className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-semibold">To {g.recipient_email}</p>
                        {g.message && <p className="text-slate-400 text-xs">"{g.message}"</p>}
                        <p className="text-slate-500 text-xs">{g.sent_at ? new Date(g.sent_at).toLocaleDateString('en-IN') : ''}</p>
                      </div>
                      <span className="text-orange-400 font-black text-lg">-{g.amount} 🪙</span>
                    </GlowCard>
                  ))}
                </div>
              </div>
            )}
            {history.sent.length === 0 && history.received.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                <p>No gift history yet</p>
                <p className="text-xs mt-1">Send your first gift!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
