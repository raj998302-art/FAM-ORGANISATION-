import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Bell, 
  ChevronLeft, 
  Send, 
  Users,
  Trophy,
  Gift,
  AlertCircle,
  Megaphone,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import AppEmoji from '../components/ui/AppEmoji';
import { checkPermission, PERMISSIONS } from '@/lib/permissions';

export default function AdminBroadcast() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [sent, setSent] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'broadcast',
    target: 'all',
    targetEmail: ''
  });

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  const checkAdmin = async () => {
    const user = await apiClient.auth.me();
    if (!checkPermission(user, PERMISSIONS.SEND_BROADCAST)) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    try {
      const profiles = await apiClient.entities.UserProfile.list();
      setUserCount(profiles.length);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title?.trim() || !formData.message?.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    try {
      let sentCount = 0;

      if (formData.target === 'specific') {
        // Target a specific user by email
        if (!formData.targetEmail?.trim()) {
          toast.error('Enter target user email');
          setSending(false);
          return;
        }
        const created = await apiClient.entities.Notification.create({
          user_email: formData.targetEmail.trim().toLowerCase(),
          title: formData.title,
          message: formData.message,
          type: formData.type || 'broadcast',
          is_read: false,
          created_date: new Date().toISOString(),
        });
        sentCount = created ? 1 : 0;
        toast.success(`Notification sent to ${formData.targetEmail}`);

      } else if (formData.target === 'vip') {
        // VIP users only — get all profiles then filter by VIP role in user list
        const profiles = await apiClient.entities.UserProfile.list('-created_date', 500).catch(() => []);
        const vipProfiles = (profiles || []).filter(p =>
          p.vip_role && p.vip_role !== 'none' && p.vip_role !== ''
        );
        if (vipProfiles.length === 0) {
          toast.error('No VIP users found');
          setSending(false);
          return;
        }
        const BATCH = 20;
        for (let i = 0; i < vipProfiles.length; i += BATCH) {
          const batch = vipProfiles.slice(i, i + BATCH);
          await Promise.all(batch.map(p =>
            apiClient.entities.Notification.create({
              user_email: p.user_email,
              title: formData.title,
              message: formData.message,
              type: formData.type || 'broadcast',
              is_read: false,
              created_date: new Date().toISOString(),
            }).catch(() => null)
          ));
        }
        sentCount = vipProfiles.length;
        toast.success(`Sent to ${sentCount} VIP users!`);

      } else {
        // All users — use the dedicated backend broadcast endpoint (fast, server-side)
        const result = await apiClient.admin.broadcastNotification(
          formData.title,
          formData.message,
          formData.type || 'broadcast'
        );
        sentCount = result?.sent_to || 0;
        toast.success(`Broadcast sent to ${sentCount} users!`);
      }

      setSent(true);
      setTimeout(() => {
        setSent(false);
        setFormData({ title: '', message: '', type: 'broadcast', target: 'all', targetEmail: '' });
      }, 3000);

    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send: ' + (error.message || 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const templates = [
    {
      title: 'New Tournament Alert!',
      message: 'A new tournament is now open for registration! Join now before slots fill up.',
      type: 'tournament'
    },
    {
      title: 'Winner Announcement',
      message: 'Congratulations to all winners! Check your wallet for prize credits.',
      type: 'result'
    },
    {
      title: 'Bonus Event',
      message: 'Special bonus event is now live! Refer friends and earn extra rewards.',
      type: 'reward'
    },
    {
      title: '⚠️ Maintenance Notice',
      message: 'Scheduled maintenance will begin shortly. Thank you for your patience.',
      type: 'system'
    }
  ];

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="orange" size="2xl" className="flex items-center gap-2">
          <AppEmoji name="notification" size={28}/>
          BROADCAST
        </NeonText>
      </div>

      {/* User Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlowCard glowColor="cyan" className="p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{userCount}</p>
              <p className="text-sm text-slate-400">Users will receive this notification</p>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Quick Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <p className="text-sm text-slate-400 mb-3">Quick Templates:</p>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((template, index) => (
            <button
              key={index}
              onClick={() => setFormData({
                title: template.title,
                message: template.message,
                type: template.type
              })}
              className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-left hover:border-orange-500/50 transition-colors"
            >
              <p className="text-sm font-medium text-white truncate">{template.title}</p>
              <p className="text-xs text-slate-400 mt-1 truncate">{template.type}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlowCard glowColor="orange" className="p-5">
          {sent ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-10 h-10 text-green-400" />
              </motion.div>
              <NeonText color="green" size="xl">Notification Sent!</NeonText>
              <p className="text-slate-400 mt-2">All {userCount} users have been notified.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Notification Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="broadcast">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-orange-400" />
                        General Broadcast
                      </div>
                    </SelectItem>
                    <SelectItem value="tournament">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        Tournament
                      </div>
                    </SelectItem>
                    <SelectItem value="reward">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-400" />
                        Reward
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        System Alert
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter notification title..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                  placeholder="Enter notification message..."
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label className="text-slate-300">Send To</Label>
                <Select value={formData.target || 'all'} onValueChange={(v) => setFormData({...formData, target: v, targetEmail: ''})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">All Users ({userCount})</SelectItem>
                    <SelectItem value="vip" className="text-white">VIP Users Only</SelectItem>
                    <SelectItem value="specific" className="text-white">Specific User (by email)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.target === 'specific' && (
                  <Input
                    value={formData.targetEmail || ''}
                    onChange={(e) => setFormData({...formData, targetEmail: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                    placeholder="user@email.com"
                  />
                )}
              </div>

              {/* Preview */}
              {formData.title && formData.message && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Preview:</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{formData.title}</p>
                      <p className="text-sm text-slate-400">{formData.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <GamingButton
                variant="gold"
                size="lg"
                className="w-full"
                icon={Send}
                loading={sending}
                onClick={handleSend}
              >
                {formData.target === 'specific' ? 'Send to User' : formData.target === 'vip' ? 'Send to VIP Users' : `Send to ${userCount} Users`}
              </GamingButton>
            </div>
          )}
        </GlowCard>
      </motion.div>
    </div>
  );
}