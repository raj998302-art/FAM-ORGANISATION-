import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingBag, Coins, CheckCircle, ChevronLeft, Star, Zap, Crown, Filter } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const RARITY_COLOR = { legendary:'yellow', epic:'purple', rare:'cyan', common:'slate' };
const RARITY_GLOW  = { legendary:'gold',   epic:'purple', rare:'cyan',  common:'cyan' };
const CATEGORIES   = ['all','border','badge','title','emote','boost'];

export default function Store() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [items, setItems]       = useState([]);
  const [wallet, setWallet]     = useState(null);
  const [category, setCategory] = useState('all');
  const [buying, setBuying]     = useState(null);
  const [preview, setPreview]   = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [its, ws] = await Promise.all([
        apiClient.integrations.Store.getItems(),
        apiClient.entities.Wallet.filter({ user_email: (await apiClient.auth.me()).email }),
      ]);
      setItems(its || []); if (ws[0]) setWallet(ws[0]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const buy = async (item) => {
    if (item.owned) { toast.info('Already owned!'); return; }
    setBuying(item.id);
    try {
      await apiClient.integrations.Store.purchase(item.id);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      toast.success(`${item.name} purchased!`);
      await load(); setPreview(null);
    } catch(e) { toast.error(e.message); }
    finally { setBuying(null); }
  };

  if (loading) return <LoadingScreen message="Loading Store…"/>;

  const filtered = category === 'all' ? items : items.filter(i => i.category === category);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white p-1"><ChevronLeft className="w-6 h-6"/></button>
        <div className="flex-1">
          <NeonText color="purple" size="2xl" className="block">🛍️ Item Store</NeonText>
          <p className="text-slate-400 text-xs">Customize your profile with exclusive items</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30">
          <Coins className="w-4 h-4 text-yellow-400"/>
          <span className="text-yellow-400 font-bold text-sm">{wallet?.balance || 0}</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 ${category===cat?'bg-cyan-500/20 border-cyan-400 text-cyan-400':'bg-slate-800 border-slate-700 text-slate-400 hover:border-cyan-500/40'}`}>
            {cat === 'all' ? 'All' : cat === 'border' ? 'Borders' : cat === 'badge' ? 'Badges' : cat === 'title' ? 'Titles' : cat === 'emote' ? 'Emotes' : 'Boosts'}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {filtered.map((item, i) => {
          const rc = RARITY_COLOR[item.rarity] || 'slate';
          const rg = RARITY_GLOW[item.rarity] || 'cyan';
          const c = rc === 'yellow' ? 'yellow' : rc;
          return (
            <motion.div key={item.id} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} onClick={() => setPreview(item)}>
              <GlowCard glowColor={rg} className={`p-4 cursor-pointer relative ${item.owned?'opacity-90':''}`} animated>
                {item.owned && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-green-400"/></div>}
                <div className={`w-14 h-14 rounded-xl bg-${c}-500/20 flex items-center justify-center text-3xl mx-auto mb-2`}>{item.preview}</div>
                <p className="text-white font-bold text-sm text-center leading-tight">{item.name}</p>
                <p className={`text-xs font-bold text-center mt-0.5 text-${c}-400 uppercase tracking-wide`}>{item.rarity}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {item.owned ? (
                    <span className="text-green-400 text-xs font-bold">✓ Owned</span>
                  ) : (
                    <><Coins className="w-3 h-3 text-yellow-400"/><span className="text-yellow-400 font-bold text-sm">{item.price}</span></>
                  )}
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30"/>
          <p>No items in this category</p>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setPreview(null)}>
            <motion.div initial={{y:100}} animate={{y:0}} exit={{y:100}} transition={{type:'spring',damping:25}}
              className="w-full max-w-sm mb-4 mx-4" onClick={e => e.stopPropagation()}>
              <GlowCard glowColor={RARITY_GLOW[preview.rarity]} className="p-6">
                <div className={`w-24 h-24 rounded-2xl bg-${RARITY_COLOR[preview.rarity]===`yellow`?`yellow`:`${RARITY_COLOR[preview.rarity]}`}-500/20 flex items-center justify-center text-5xl mx-auto mb-4`}>{preview.preview}</div>
                <NeonText color={RARITY_GLOW[preview.rarity]} size="xl" className="block text-center mb-1">{preview.name}</NeonText>
                <p className={`text-xs text-center uppercase font-bold text-${RARITY_COLOR[preview.rarity]==='yellow'?'yellow':RARITY_COLOR[preview.rarity]}-400 mb-2`}>{preview.rarity}</p>
                <p className="text-slate-400 text-sm text-center mb-4">{preview.desc}</p>
                {!preview.owned && <div className="flex items-center justify-center gap-1.5 mb-4"><Coins className="w-5 h-5 text-yellow-400"/><span className="text-yellow-400 font-black text-xl">{preview.price} coins</span></div>}
                {preview.owned ? (
                  <div className="text-center text-green-400 font-bold flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5"/>Already Owned</div>
                ) : (
                  <GamingButton variant={(wallet?.balance||0)>=preview.price?'primary':'outline'} size="lg" className="w-full" icon={ShoppingBag}
                    onClick={() => buy(preview)} disabled={buying===preview.id||(wallet?.balance||0)<preview.price}>
                    {buying===preview.id ? 'Buying…' : (wallet?.balance||0)<preview.price ? `Need ${preview.price-(wallet?.balance||0)} more coins` : `Buy for ${preview.price} Coins`}
                  </GamingButton>
                )}
                {(wallet?.balance||0) < preview.price && !preview.owned && (
                  <GamingButton variant="gold" size="sm" className="w-full mt-2" icon={Coins} onClick={() => { setPreview(null); navigate(createPageUrl('Deposit')); }}>Top Up Coins</GamingButton>
                )}
              </GlowCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
