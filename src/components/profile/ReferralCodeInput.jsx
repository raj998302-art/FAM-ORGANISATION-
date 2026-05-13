import React, { useState } from 'react';
import { Gift, Check, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import GlowCard from '../ui/GlowCard';
import GamingButton from '../ui/GamingButton';
import { Input } from '@/components/ui/input';

export default function ReferralCodeInput({ user, profile, onSuccess }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (profile?.referred_by || submitted) {
    return (
      <GlowCard glowColor="green" className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-green-400 font-semibold">Referral Applied!</p>
            <p className="text-xs text-slate-400">Code: {profile?.referred_by || code}</p>
          </div>
        </div>
      </GlowCard>
    );
  }

  const handleApply = async () => {
    if (!code.trim()) { toast.error('Enter a referral code'); return; }
    if (code.trim().toUpperCase() === profile?.referral_code?.toUpperCase()) {
      toast.error("You can't use your own referral code!");
      return;
    }

    setLoading(true);
    try {
      // Find the referrer profile
      const referrers = await apiClient.entities.UserProfile.filter({ referral_code: code.trim().toUpperCase() });
      if (referrers.length === 0) {
        toast.error('Invalid referral code. Please check and try again.');
        setLoading(false);
        return;
      }

      const referrer = referrers[0];

      // Load app settings for bonus amount
      const settings = await apiClient.entities.AppSettings.list();
      const referralBonus = settings[0]?.referral_bonus || 10;

      // Update current user's profile with referred_by
      await apiClient.entities.UserProfile.update(profile.id, {
        referred_by: code.trim().toUpperCase()
      });

      // Update referral counts
      const referrerWallets = await apiClient.entities.Wallet.filter({ user_email: referrer.user_email });
      if (referrerWallets.length > 0) {
        await Promise.all([
          apiClient.entities.UserProfile.update(referrer.id, {
            referral_count: (referrer.referral_count || 0) + 1,
            // We do NOT update earnings or wallet balance yet. The reward is given upon first 100+ deposit.
          })
        ]);
      }

      toast.success(`Referral code applied! Your friend will get rewarded when you deposit ₹100+`);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      toast.error('Failed to apply referral code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowCard glowColor="purple" className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-purple-400" />
        <p className="text-purple-400 font-semibold">Have a Referral Code?</p>
      </div>
      <p className="text-xs text-slate-400 mb-3">Enter your friend's referral code to reward them!</p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. FAJOHN1A2B"
          className="bg-slate-800 border-slate-700 text-white font-mono uppercase flex-1"
          maxLength={12}
        />
        <GamingButton variant="secondary" size="sm" onClick={handleApply} loading={loading} icon={loading ? Loader2 : Check}>
          Apply
        </GamingButton>
      </div>
    </GlowCard>
  );
}