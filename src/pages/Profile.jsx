import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReferralCodeInput from '../components/profile/ReferralCodeInput';

import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  User, 
  Edit3, 
  Camera, 
  Trophy, 
  Swords, 
  Target,
  Gift,
  Copy,
  Check,
  Save,
  Gamepad2,
  Crown,
  Share2,
  LogOut,
  Settings,
  AlertCircle,
  AlertTriangle,
  Star,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import RankBadge from '../components/profile/RankBadge';
import LevelProgress from '../components/profile/LevelProgress';
import RoleBadge from '../components/ui/RoleBadge';
import { getUserRoles } from '@/lib/permissions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [copied, setCopied] = useState(false);
  const [showUidDialog, setShowUidDialog] = useState(false);
  const [ffUid, setFfUid] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      // Load profile — filter returns flat data (via fixId spreading)
      let profiles = await apiClient.entities.UserProfile.filter({ user_email: currentUser.email });
      
      if (!profiles || profiles.length === 0) {
        // Profile might not exist yet — create it
        await apiClient.entities.UserProfile.create({
          user_email: currentUser.email,
          user_id: currentUser.id,
          username: currentUser.full_name?.split(' ')[0] || currentUser.email?.split('@')[0] || 'Player',
          referral_code: 'FA' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          level: 1, xp: 0, rank: 'bronze',
        });
        profiles = await apiClient.entities.UserProfile.filter({ user_email: currentUser.email });
      }

      const p = profiles[0] || {};
      // Ensure avatar_url falls back to user-level avatar if set
      if (!p.avatar_url && currentUser.avatar_url) p.avatar_url = currentUser.avatar_url;
      if (!p.username || p.username === 'Player') {
        p.username = currentUser.full_name?.split(' ')[0] || currentUser.email?.split('@')[0] || 'Player';
      }

      setProfile(p);
      setEditData({
        username: p?.username || '',
        ff_uid: p?.ff_uid || '',
        ign: p?.ign || '',
        avatar_url: p?.avatar_url || '',
      });

      // Load wallet
      const wallets = await apiClient.entities.Wallet.filter({ user_email: currentUser.email });
      if (wallets && wallets.length > 0) setWallet(wallets[0]);
      else {
        // Create wallet if missing
        await apiClient.entities.Wallet.create({ user_email: currentUser.email, user_id: currentUser.id, balance: 0, bonus_balance: 0, winnings: 0 });
        const freshWallets = await apiClient.entities.Wallet.filter({ user_email: currentUser.email });
        if (freshWallets?.length > 0) setWallet(freshWallets[0]);
      }

    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = (email) => {
    const hash = email.split('@')[0].toUpperCase().slice(0, 4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FA${hash}${random}`;
  };

  const handleSave = async () => {
    if (!editData.username?.trim()) {
      toast.error('Username is required');
      return;
    }
    setSaving(true);
    try {
      const updateData = {
        username: editData.username.trim(),
        ign: editData.ign?.trim() || '',
        avatar_url: editData.avatar_url?.trim() || profile?.avatar_url || '',
      };
      await apiClient.entities.UserProfile.update(profile.id, updateData);
      toast.success('Profile updated!');
      setEditing(false);
      // Force fresh load
      await loadData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkUid = async () => {
    if (!ffUid?.trim() || ffUid.length < 9) {
      toast.error('Enter a valid Free Fire UID (minimum 9 digits)');
      return;
    }

    // 15-day cooldown: if already has UID and it was set within 15 days, block
    if (profile?.ff_uid && profile?.ff_uid_set_date) {
      const setDate = new Date(profile.ff_uid_set_date);
      const daysSince = Math.floor((Date.now() - setDate.getTime()) / 86400000);
      if (daysSince < 15) {
        toast.error(`You can update your UID after ${15 - daysSince} more day(s). (15-day cooldown)`);
        return;
      }
    }

    // Check if UID is already used by another account
    const existingProfiles = await apiClient.entities.UserProfile.filter({ ff_uid: ffUid.trim() }).catch(() => []);
    if (existingProfiles.length > 0 && existingProfiles[0].id !== profile.id) {
      toast.error('This UID is already linked to another account');
      return;
    }

    setSaving(true);
    try {
      await apiClient.entities.UserProfile.update(profile.id, {
        ff_uid: ffUid.trim(),
        ff_uid_verified: true,
        ff_uid_set_date: new Date().toISOString(),
      });
      toast.success('Free Fire UID linked successfully! You can update it again after 15 days.');
      setShowUidDialog(false);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to link UID');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setSaving(true);
    try {
      const result = await apiClient.integrations.Core.UploadAvatar(file);
      const avatarUrl = result?.url || result?.secure_url || result?.avatar_url;
      if (avatarUrl && profile?.id) {
        // Explicitly save the URL to the UserProfile entity
        await apiClient.entities.UserProfile.update(profile.id, { avatar_url: avatarUrl });
      }
      toast.success('Profile picture updated!');
      // Force fresh reload
      await loadData();
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profile.referral_code);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const appLink = window.location.origin + '/signup?ref=' + profile?.referral_code;
    const text = `🔥 Join FIRE ARENA MAX - The ultimate Free Fire MAX tournament platform!\n\nCompete in paid tournaments, win real prizes & climb the leaderboard!\n\n📲 Join here: ${appLink}\n\n🎁 Use my referral code: ${profile?.referral_code} to get a bonus when you join!`;
    if (navigator.share) {
      navigator.share({ title: 'Fire Arena MAX', text, url: appLink });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Invite link copied! Share it with friends!');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlowCard glowColor="cyan" className="p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-cyan-500/50 cursor-pointer hover:border-cyan-400 transition-colors"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center ${profile?.avatar_url ? 'hidden' : 'flex'}`}>
                    <User className="w-10 h-10 text-cyan-400" />
                  </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera className="w-4 h-4 text-slate-900" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <Input
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Username"
                  />
                  <Input
                    value={editData.ign}
                    onChange={(e) => setEditData({...editData, ign: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="In-Game Name (IGN)"
                  />
                  <div className="flex gap-2">
                    <GamingButton
                      variant="primary"
                      size="sm"
                      icon={Save}
                      loading={saving}
                      onClick={handleSave}
                    >
                      Save
                    </GamingButton>
                    <GamingButton
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </GamingButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{profile?.username || 'Player'}</h2>
                    <button onClick={() => setEditing(true)}>
                      <Edit3 className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                    </button>
                  </div>
                  {profile?.ign && (
                    <p className="text-sm text-cyan-400 font-semibold mt-1">IGN: {profile.ign}</p>
                  )}
                  <p className="text-sm text-slate-400">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <RankBadge rank={profile?.rank || 'bronze'} size="sm" />
                    {getUserRoles(user)[0] !== 'player' && (
                      <RoleBadge role={getUserRoles(user)[0]} size="sm" />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <LevelProgress level={profile?.level || 1} xp={profile?.xp || 0} />
          </div>
        </GlowCard>
      </motion.div>

      {/* Free Fire UID */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlowCard glowColor={profile?.ff_uid ? 'green' : 'orange'} className="p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                profile?.ff_uid ? 'bg-green-500/20' : 'bg-orange-500/20'
              }`}>
                <Gamepad2 className={`w-6 h-6 ${profile?.ff_uid ? 'text-green-400' : 'text-orange-400'}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Free Fire MAX UID</p>
                {profile?.ff_uid ? (
                  <p className="text-lg font-mono font-bold text-white">{profile.ff_uid}</p>
                ) : (
                  <p className="text-sm text-orange-400 font-semibold">Not linked — Required to join tournaments!</p>
                )}
              </div>
            </div>
            {(() => {
              const cooldownDays = profile?.ff_uid && profile?.ff_uid_set_date
                ? Math.max(0, 15 - Math.floor((Date.now() - new Date(profile.ff_uid_set_date)) / 86400000))
                : 0;
              return (
                <GamingButton
                  variant={profile?.ff_uid ? 'outline' : 'primary'}
                  size="sm"
                  disabled={cooldownDays > 0}
                  onClick={() => {
                    setFfUid(profile?.ff_uid || '');
                    setShowUidDialog(true);
                  }}
                >
                  {cooldownDays > 0 ? `Change in ${cooldownDays}d` : profile?.ff_uid ? 'Change UID' : 'Link UID'}
                </GamingButton>
              );
            })()}
          </div>
          
          {!profile?.ff_uid && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400">
                  <strong>Required:</strong> You must link your Free Fire MAX UID before joining any tournament. Find your UID in the game's profile section (tap your avatar → ID).
                </p>
              </div>
            </div>
          )}
          {profile?.ff_uid && profile?.ff_uid_set_date && (() => {
            const daysLeft = Math.max(0, 15 - Math.floor((Date.now() - new Date(profile.ff_uid_set_date)) / 86400000));
            return daysLeft > 0 ? (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-xs text-yellow-400">
                  UID change available in <strong>{daysLeft} day(s)</strong> (15-day cooldown to prevent fraud).
                </p>
              </div>
            ) : null;
          })()}
        </GlowCard>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <GlowCard glowColor="purple" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Swords className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{profile?.tournaments_played || 0}</p>
              <p className="text-xs text-slate-400">Matches</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="gold" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{profile?.tournaments_won || 0}</p>
              <p className="text-xs text-slate-400">Wins</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="red" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{profile?.total_kills || 0}</p>
              <p className="text-xs text-slate-400">Total Kills</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="green" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">₹{profile?.total_earnings || 0}</p>
              <p className="text-xs text-slate-400">Earnings</p>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Referral Code Input for new players */}
      {!profile?.referred_by && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <ReferralCodeInput user={user} profile={profile} onSuccess={loadData} />
        </motion.div>
      )}

      {/* Referral Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlowCard glowColor="purple" className="p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-6 h-6 text-purple-400" />
            <NeonText color="purple" size="lg">REFER & EARN</NeonText>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl mb-4">
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-1">Your Referral Code</p>
              <p className="text-xl font-mono font-bold text-white tracking-wider">
                {profile?.referral_code || 'LOADING...'}
              </p>
            </div>
            <button
              onClick={copyReferralCode}
              className="p-3 bg-purple-500/20 rounded-xl hover:bg-purple-500/30 transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-purple-400" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-slate-800/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-purple-400">{profile?.referral_count || 0}</p>
              <p className="text-xs text-slate-400">Referrals</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-400">₹{profile?.referral_earnings || 0}</p>
              <p className="text-xs text-slate-400">Earned</p>
            </div>
          </div>

          <GamingButton
            variant="secondary"
            className="w-full"
            icon={Share2}
            onClick={shareReferral}
          >
            Share & Earn ₹10 per referral
          </GamingButton>
        </GlowCard>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <GamingButton
          variant="outline"
          className="w-full justify-start"
          icon={Settings}
          onClick={() => {}}
        >
          Settings
        </GamingButton>

        {/* My Warnings */}
        <GamingButton
          variant="outline"
          className="w-full justify-start border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
          icon={AlertTriangle}
          onClick={() => navigate(createPageUrl('MyWarnings'))}
        >
          My Warnings & Appeals
        </GamingButton>

        {/* Prize History */}
        <GamingButton
          variant="outline"
          className="w-full justify-start border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
          icon={Trophy}
          onClick={() => navigate(createPageUrl('PrizeHistory'))}
        >
          Prize History
        </GamingButton>

        {/* Disputes */}
        <GamingButton
          variant="outline"
          className="w-full justify-start border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
          icon={Star}
          onClick={() => navigate(createPageUrl('DisputeResolution'))}
        >
          Dispute Resolution
        </GamingButton>

        {/* Polls */}
        <GamingButton
          variant="outline"
          className="w-full justify-start"
          icon={Star}
          onClick={() => navigate(createPageUrl('Polls'))}
        >
          Community Polls
        </GamingButton>

        {/* Promotion tasks (staff only) */}
        {(user?.roles?.includes('tournament_manager') || user?.roles?.includes('senior_tournament_manager')) && (
          <GamingButton
            variant="outline"
            className="w-full justify-start border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
            icon={Star}
            onClick={() => navigate(createPageUrl('PromotionTasks'))}
          >
            Promotion Tasks
          </GamingButton>
        )}

        <a href="https://discord.gg/SprEPdYMz" target="_blank" rel="noopener noreferrer" className="block">
          <GamingButton
            variant="outline"
            className="w-full justify-start border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
            icon={MessageSquare}
          >
            Join our Discord Server
          </GamingButton>
        </a>

        <GamingButton
          variant="ghost"
          className="w-full justify-start text-red-400 hover:bg-red-500/10"
          icon={LogOut}
          onClick={() => {
            apiClient.auth.logout(window.location.origin + '/');
          }}
        >
          Logout
        </GamingButton>
      </motion.div>

      {/* Link UID Dialog */}
      <Dialog open={showUidDialog} onOpenChange={setShowUidDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Link Free Fire UID</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Free Fire UID</Label>
              <Input
                value={ffUid}
                onChange={(e) => setFfUid(e.target.value)}
                placeholder="Enter your 10-digit UID"
                className="bg-slate-800 border-slate-700 text-white text-lg font-mono"
                maxLength={12}
              />
              <p className="text-xs text-slate-400">
                Find your UID in Free Fire MAX: Profile → Your ID (10-digit number)
              </p>
            </div>

            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5" />
                <p className="text-xs text-cyan-400">
                  Make sure to enter the correct UID. You can only change it once every 30 days.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowUidDialog(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant="primary" 
              className="flex-1"
              loading={saving}
              onClick={handleLinkUid}
            >
              Link UID
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}