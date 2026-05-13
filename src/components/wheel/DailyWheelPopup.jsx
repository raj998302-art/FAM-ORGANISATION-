import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import GlowCard from '../ui/GlowCard';
import GamingButton from '../ui/GamingButton';

export default function DailyWheelPopup({ user, onClose, showIcon = false }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [reward, setReward] = useState(null);

  const prizes = [
    { coins: 5, color: '#06b6d4', label: '5' },
    { coins: 10, color: '#22c55e', label: '10' },
    { coins: 5, color: '#06b6d4', label: '5' },
    { coins: 25, color: '#eab308', label: '25' },
    { coins: 10, color: '#22c55e', label: '10' },
    { coins: 5, color: '#06b6d4', label: '5' },
    { coins: 50, color: '#a855f7', label: '50' },
    { coins: 10, color: '#22c55e', label: '10' },
  ];

  useEffect(() => {
    checkDailySpin();
  }, [user]);

  const checkDailySpin = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const spins = await apiClient.entities.SpinReward.filter({
      user_email: user.email,
      spin_date: today
    });

    const hasSpun = spins.length > 0;
    setCanSpin(!hasSpun);
    
    // Only show popup on first load if user hasn't spun today
    if (!hasSpun && !showIcon && !localStorage.getItem(`wheel_shown_${today}`)) {
      setShowPopup(true);
      localStorage.setItem(`wheel_shown_${today}`, 'true');
    }
  };

  const handleSpin = async () => {
    if (!canSpin || spinning) return;

    setSpinning(true);
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const prize = prizes[randomIndex];
    
    const degreesPerSegment = 360 / prizes.length;
    const extraRotations = 5 * 360;
    const targetRotation = extraRotations + (360 - (randomIndex * degreesPerSegment + degreesPerSegment / 2));

    setRotation(rotation + targetRotation);

    setTimeout(async () => {
      try {
        await apiClient.entities.SpinReward.create({
          user_id: user.id,
          user_email: user.email,
          reward_type: 'coins',
          reward_amount: prize.coins,
          spin_date: new Date().toISOString().split('T')[0]
        });

        const wallets = await apiClient.entities.Wallet.filter({ user_email: user.email });
        if (wallets.length > 0) {
          await apiClient.entities.Wallet.update(wallets[0].id, {
            bonus_balance: (wallets[0].bonus_balance || 0) + prize.coins
          });

          await apiClient.entities.Transaction.create({
            user_id: user.id,
            user_email: user.email,
            type: 'bonus',
            amount: prize.coins,
            status: 'completed',
            description: `Daily Wheel Reward: ₹${prize.coins}`
          });
        }

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setReward(prize);
        setCanSpin(false);
        toast.success(`You won ₹${prize.coins}!`);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Something went wrong');
      } finally {
        setSpinning(false);
      }
    }, 4000);
  };

  const closePopup = () => {
    setShowPopup(false);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Popup */}
      <AnimatePresence>
        {showPopup && !showIcon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative max-w-md w-full"
            >
              <GlowCard glowColor="purple" className="p-6 relative">
                <button
                  onClick={closePopup}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-4">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    DAILY REWARD WHEEL
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Spin once per day for free coins!</p>
                </div>

                {/* Wheel */}
                <div className="relative mx-auto mb-4" style={{ width: '250px', height: '250px' }}>
                  <motion.div
                    className="relative w-full h-full rounded-full border-4 border-purple-500"
                    style={{ 
                      rotate: rotation,
                      background: `conic-gradient(from 0deg, ${prizes.map((p, i) => 
                        `${p.color} ${i * 45}deg ${(i + 1) * 45}deg`
                      ).join(', ')})`
                    }}
                    transition={{ duration: 4, ease: 'easeOut' }}
                  >
                    {prizes.map((prize, index) => {
                      const angle = (360 / prizes.length) * index;
                      return (
                        <div
                          key={index}
                          className="absolute top-1/2 left-1/2"
                          style={{
                            transform: `rotate(${angle}deg) translate(70px) rotate(-${angle}deg)`,
                            transformOrigin: 'center',
                          }}
                        >
                          <div className="text-center">
                            <p className="text-lg font-bold text-white">₹{prize.label}</p>
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] z-10" />
                </div>

                {reward && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl"
                  >
                    <p className="text-green-400 font-bold">You won ₹{reward.coins}!</p>
                  </motion.div>
                )}

                <GamingButton
                  variant="primary"
                  size="lg"
                  onClick={handleSpin}
                  disabled={!canSpin || spinning}
                  loading={spinning}
                  className="w-full"
                >
                  {spinning ? 'SPINNING...' : canSpin ? 'SPIN NOW!' : 'Come Back Tomorrow'}
                </GamingButton>
              </GlowCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Icon - redirects to wheel page */}
      {showIcon && canSpin && (
        <Link to={createPageUrl('SpinWheel')}>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.6)]"
          >
            <Gift className="w-7 h-7 text-white animate-pulse" />
          </motion.button>
        </Link>
      )}
    </>
  );
}