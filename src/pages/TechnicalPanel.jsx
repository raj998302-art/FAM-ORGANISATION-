import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Settings, ChevronLeft, RefreshCw, Server, AlertTriangle,
  ToggleLeft, ToggleRight, Save, Activity, Database,
  Cpu, Shield, Clock, CheckCircle, Wrench, Globe
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getUserPermissions } from '@/lib/permissions';
import { useSocket } from '@/lib/SocketContext';

export default function TechnicalPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('settings');
  const { isConnected } = useSocket();

  const [form, setForm] = useState({
    maintenance_mode: false,
    maintenance_message: '',
    max_deposit: 10000,
    min_deposit: 10,
    max_withdrawal: 5000,
    min_withdrawal: 50,
    registration_enabled: true,
    app_name: 'FAM Organisation',
    support_email: '',
    discord_url: '',
    instagram_url: '',
    website_url: '',
    spin_wheel_enabled: true,
    daily_missions_enabled: true,
    referral_bonus: 10,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      const perms = getUserPermissions(currentUser);
      if (!perms.includes('MANAGE_SETTINGS') && !perms.includes('MANAGE_SYSTEM') && !perms.includes('all')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);

      const [allSettings, allLogs] = await Promise.all([
        apiClient.entities.AppSettings.list(),
        apiClient.admin.getLogs(),
      ]);

      if (allSettings.length > 0) {
        const s = allSettings[0];
        setSettings(s);
        setSettingsId(s.id);
        setForm(prev => ({ ...prev, ...s }));
      }
      setLogs(allLogs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settingsId) {
        await apiClient.entities.AppSettings.update(settingsId, form);
      } else {
        await apiClient.entities.AppSettings.create(form);
      }

      // Log the action
      await apiClient.entities.SystemLog.create({
        event: 'SETTINGS_UPDATED', user_email: user.email,
        changes: Object.keys(form), timestamp: new Date().toISOString()
      });

      toast.success('Settings saved successfully!');
      loadData();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggleMaintenance = async () => {
    const newMode = !form.maintenance_mode;
    const updatedForm = { ...form, maintenance_mode: newMode };
    setForm(updatedForm);
    try {
      if (settingsId) await apiClient.entities.AppSettings.update(settingsId, { maintenance_mode: newMode });
      toast.success(`Maintenance mode ${newMode ? 'ENABLED' : 'DISABLED'}`);
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading Technical Panel..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-28 pt-4 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(createPageUrl('RolePanel'))} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1">
            <NeonText color="blue" size="xl">TECHNICAL PANEL</NeonText>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-xs">System configuration & logs</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold ${isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}/>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </button>
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <GlowCard glowColor={form.maintenance_mode ? 'orange' : 'green'} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Maintenance</p>
                <p className={`font-bold text-sm ${form.maintenance_mode ? 'text-orange-400' : 'text-green-400'}`}>
                  {form.maintenance_mode ? 'ACTIVE' : 'OFF'}
                </p>
              </div>
              <button onClick={toggleMaintenance}
                className={`p-2 rounded-xl transition-all ${form.maintenance_mode ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-green-500/20 border border-green-500/50'}`}>
                {form.maintenance_mode ? <ToggleRight className="w-5 h-5 text-orange-400" /> : <ToggleLeft className="w-5 h-5 text-green-400" />}
              </button>
            </div>
          </GlowCard>
          <GlowCard glowColor={form.registration_enabled ? 'cyan' : 'red'} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Registration</p>
                <p className={`font-bold text-sm ${form.registration_enabled ? 'text-cyan-400' : 'text-red-400'}`}>
                  {form.registration_enabled ? 'OPEN' : 'CLOSED'}
                </p>
              </div>
              <Switch checked={form.registration_enabled}
                onCheckedChange={v => setForm(f => ({ ...f, registration_enabled: v }))} />
            </div>
          </GlowCard>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['settings', 'limits', 'features', 'logs'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${tab === t ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <GlowCard glowColor="blue" className="p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Settings className="w-4 h-4 text-blue-400" /> App Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">App Name</label>
                <Input value={form.app_name} onChange={e => setForm(f => ({ ...f, app_name: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Support Email</label>
                <Input value={form.support_email} onChange={e => setForm(f => ({ ...f, support_email: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="support@example.com" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Discord URL</label>
                <Input value={form.discord_url} onChange={e => setForm(f => ({ ...f, discord_url: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="https://discord.gg/..." />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Instagram URL</label>
                <Input value={form.instagram_url} onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <span>🌐</span> Website URL
                </label>
                <Input value={form.website_url || ''} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white" placeholder="https://yourwebsite.com" />
                <p className="text-xs text-slate-500 mt-1">Official website link shown to users in the app</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Maintenance Message</label>
                <Textarea value={form.maintenance_message} onChange={e => setForm(f => ({ ...f, maintenance_message: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white resize-none" rows={2}
                  placeholder="We'll be back soon..." />
              </div>
            </div>
          </GlowCard>
        </motion.div>
      )}

      {tab === 'limits' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <GlowCard glowColor="cyan" className="p-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-cyan-400" /> Financial Limits</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'min_deposit', label: 'Min Deposit (₹)' },
                { key: 'max_deposit', label: 'Max Deposit (₹)' },
                { key: 'min_withdrawal', label: 'Min Withdrawal (₹)' },
                { key: 'max_withdrawal', label: 'Max Withdrawal (₹)' },
                { key: 'referral_bonus', label: 'Referral Bonus (₹)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 block mb-1">{label}</label>
                  <Input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    className="bg-slate-800 border-slate-700 text-white" />
                </div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
      )}

      {tab === 'features' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {[
            { key: 'spin_wheel_enabled', label: 'Spin Wheel', desc: 'Daily spin wheel for players' },
            { key: 'daily_missions_enabled', label: 'Daily Missions', desc: 'Daily mission challenges' },
            { key: 'registration_enabled', label: 'New Registrations', desc: 'Allow new user signups' },
            { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Block all user access' },
          ].map(({ key, label, desc }) => (
            <GlowCard key={key} glowColor={form[key] ? 'cyan' : 'purple'} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <Switch checked={!!form[key]} onCheckedChange={v => setForm(f => ({ ...f, [key]: v }))} />
              </div>
            </GlowCard>
          ))}
        </motion.div>
      )}

      {tab === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No system logs</div>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 50).map((log, i) => (
                <GlowCard key={i} glowColor="blue" className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-cyan-400 text-xs font-mono font-bold">{log.data?.event || log.event}</p>
                      <p className="text-xs text-slate-400 truncate">{log.data?.user_email || log.user_email}</p>
                    </div>
                    <p className="text-xs text-slate-500 flex-shrink-0">
                      {new Date(log.timestamp||log.createdAt||Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Save Button */}
      {tab !== 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
          <GamingButton variant="primary" className="w-full" icon={Save} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save Settings'}
          </GamingButton>
        </motion.div>
      )}
    </div>
  );
}
