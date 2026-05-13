import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Settings, 
  ChevronLeft, 
  Wrench,
  Shield,
  Coins,
  Save,
  Power,
  PowerOff
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

import { checkPermission, PERMISSIONS } from '@/lib/permissions';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  
  const [formData, setFormData] = useState({
    maintenance_mode: false,
    maintenance_message: 'Server is under maintenance. Please try again later.',
    maintenance_end_time: '',
    min_withdrawal: 50,
    max_withdrawal: 10000,
    referral_bonus: 10,
    signup_bonus: 20,
    app_version: '1.0.0',
    force_update: false,
    update_url: '',
    announcement: '',
    blocked_uids: []
  });

  useEffect(() => {
    checkAdmin();
    loadSettings();
  }, []);

  const checkAdmin = async () => {
    const user = await apiClient.auth.me();
    if (!checkPermission(user, PERMISSIONS.MANAGE_SETTINGS)) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadSettings = async () => {
    try {
      const allSettings = await apiClient.entities.AppSettings.list();
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
        setFormData({
          maintenance_mode: allSettings[0].maintenance_mode || false,
          maintenance_message: allSettings[0].maintenance_message || 'Server is under maintenance.',
          maintenance_end_time: allSettings[0].maintenance_end_time || '',
          min_withdrawal: allSettings[0].min_withdrawal || 50,
          max_withdrawal: allSettings[0].max_withdrawal || 10000,
          referral_bonus: allSettings[0].referral_bonus || 10,
          signup_bonus: allSettings[0].signup_bonus || 20,
          app_version: allSettings[0].app_version || '1.0.0',
          force_update: allSettings[0].force_update || false,
          update_url: allSettings[0].update_url || '',
          announcement: allSettings[0].announcement || '',
          blocked_uids: allSettings[0].blocked_uids || []
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...formData,
        min_withdrawal: parseInt(formData.min_withdrawal),
        max_withdrawal: parseInt(formData.max_withdrawal),
        referral_bonus: parseInt(formData.referral_bonus),
        signup_bonus: parseInt(formData.signup_bonus)
      };

      if (settings) {
        await apiClient.entities.AppSettings.update(settings.id, data);
      } else {
        await apiClient.entities.AppSettings.create({
          key: 'main',
          ...data
        });
      }

      toast.success('Settings saved!');
      loadSettings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleMaintenance = async () => {
    setSaving(true);
    try {
      const newMode = !formData.maintenance_mode;
      
      if (settings) {
        await apiClient.entities.AppSettings.update(settings.id, {
          maintenance_mode: newMode
        });
      } else {
        await apiClient.entities.AppSettings.create({
          key: 'main',
          maintenance_mode: newMode,
          maintenance_message: formData.maintenance_message
        });
      }

      setFormData({...formData, maintenance_mode: newMode});
      toast.success(newMode ? 'Maintenance mode enabled!' : 'Maintenance mode disabled!');
      loadSettings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to toggle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="blue" size="2xl" className="flex items-center gap-2">
          <Settings className="w-7 h-7" />
          SETTINGS
        </NeonText>
      </div>

      {/* Maintenance Mode */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlowCard 
          glowColor={formData.maintenance_mode ? 'red' : 'green'} 
          className={`p-5 mb-6 ${formData.maintenance_mode ? 'animate-pulse' : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                formData.maintenance_mode ? 'bg-red-500/20' : 'bg-green-500/20'
              }`}>
                <Wrench className={`w-6 h-6 ${formData.maintenance_mode ? 'text-red-400' : 'text-green-400'}`} />
              </div>
              <div>
                <p className="font-bold text-white">Maintenance Mode</p>
                <p className={`text-sm ${formData.maintenance_mode ? 'text-red-400' : 'text-green-400'}`}>
                  {formData.maintenance_mode ? 'ACTIVE - Users blocked' : 'INACTIVE - App running normally'}
                </p>
              </div>
            </div>
            <GamingButton
              variant={formData.maintenance_mode ? 'success' : 'danger'}
              size="sm"
              icon={formData.maintenance_mode ? Power : PowerOff}
              loading={saving}
              onClick={toggleMaintenance}
            >
              {formData.maintenance_mode ? 'Turn OFF' : 'Turn ON'}
            </GamingButton>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Maintenance Message</Label>
              <Textarea
                value={formData.maintenance_message}
                onChange={(e) => setFormData({...formData, maintenance_message: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Message to show users..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Expected End Time</Label>
              <Input
                type="datetime-local"
                value={formData.maintenance_end_time}
                onChange={(e) => setFormData({...formData, maintenance_end_time: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Wallet Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlowCard glowColor="gold" className="p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-white">Wallet Settings</p>
              <p className="text-sm text-slate-400">Configure withdrawal and bonus limits</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Min Withdrawal (₹)</Label>
              <Input
                type="number"
                value={formData.min_withdrawal}
                onChange={(e) => setFormData({...formData, min_withdrawal: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Max Withdrawal (₹)</Label>
              <Input
                type="number"
                value={formData.max_withdrawal}
                onChange={(e) => setFormData({...formData, max_withdrawal: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Referral Bonus (₹)</Label>
              <Input
                type="number"
                value={formData.referral_bonus}
                onChange={(e) => setFormData({...formData, referral_bonus: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Signup Bonus (₹)</Label>
              <Input
                type="number"
                value={formData.signup_bonus}
                onChange={(e) => setFormData({...formData, signup_bonus: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* App Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlowCard glowColor="cyan" className="p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="font-bold text-white">App Configuration</p>
              <p className="text-sm text-slate-400">Version and update settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">App Version</Label>
                <Input
                  value={formData.app_version}
                  onChange={(e) => setFormData({...formData, app_version: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., 1.0.0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Force Update</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    checked={formData.force_update}
                    onCheckedChange={(checked) => setFormData({...formData, force_update: checked})}
                  />
                  <span className="text-sm text-slate-400">
                    {formData.force_update ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Update URL</Label>
              <Input
                value={formData.update_url}
                onChange={(e) => setFormData({...formData, update_url: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Play Store URL..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Announcement Banner</Label>
              <Textarea
                value={formData.announcement}
                onChange={(e) => setFormData({...formData, announcement: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Announcement to show on home screen..."
              />
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Save Button */}
      <GamingButton
        variant="primary"
        size="lg"
        className="w-full"
        icon={Save}
        loading={saving}
        onClick={handleSave}
      >
        Save All Settings
      </GamingButton>
    </div>
  );
}