import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Edit3, Trash2, Zap, Save, Power } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ICON_OPTIONS = ['fire', 'zap', 'crown', 'star', 'gift', 'diamond', 'coins', 'trophy'];
const COLOR_OPTIONS = ['gold', 'purple', 'cyan', 'red', 'green'];

const empty = {
  title: '', desc: '', bonus_percent: 20, min_amount: 99,
  icon_name: 'fire', color: 'cyan',
  starts_at: '', ends_at: '', is_active: true, vip_only: false,
};

export default function AdminFlashSale() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const user = await apiClient.auth.me();
      if (!user.panels?.includes('master_panel')) { navigate(createPageUrl('AdminDashboard')); return; }
      await loadSales();
    } catch { navigate(createPageUrl('Home')); }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await apiClient.entities.FlashSale.list('-created_date', 50).catch(() => []);
      setSales(data || []);
    } catch { setSales([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setSelected(null); setForm(empty); setShowForm(true); };
  const openEdit = (s) => {
    setSelected(s);
    setForm({
      title: s.title || '', desc: s.desc || '',
      bonus_percent: s.bonus_percent || 20,
      min_amount: s.min_amount || 99,
      icon_name: s.icon_name || 'fire',
      color: s.color || 'cyan',
      starts_at: s.starts_at ? s.starts_at.slice(0,16) : '',
      ends_at: s.ends_at ? s.ends_at.slice(0,16) : '',
      is_active: s.is_active !== false,
      vip_only: s.vip_only || false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.ends_at) { toast.error('Title and end date required'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        bonus_percent: parseInt(form.bonus_percent),
        min_amount: parseInt(form.min_amount),
        starts_at: form.starts_at || new Date().toISOString(),
      };
      if (selected) {
        await apiClient.entities.FlashSale.update(selected.id, data);
        toast.success('Flash sale updated!');
      } else {
        await apiClient.entities.FlashSale.create(data);
        toast.success('Flash sale created!');
      }
      setShowForm(false);
      loadSales();
    } catch (e) { toast.error('Failed to save: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    try {
      await apiClient.entities.FlashSale.delete(s.id);
      toast.success('Deleted');
      setDeleteConfirm(null);
      loadSales();
    } catch { toast.error('Failed to delete'); }
  };

  const toggleActive = async (s) => {
    try {
      await apiClient.entities.FlashSale.update(s.id, { is_active: !s.is_active });
      toast.success(s.is_active ? 'Sale deactivated' : 'Sale activated');
      loadSales();
    } catch { toast.error('Failed'); }
  };

  const isLive = (s) => {
    if (!s.is_active) return false;
    const now = Date.now();
    const end = new Date(s.ends_at).getTime();
    const start = s.starts_at ? new Date(s.starts_at).getTime() : 0;
    return now >= start && now < end;
  };

  if (loading) return <LoadingScreen message="Loading flash sales..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <NeonText color="red" size="2xl" className="flex items-center gap-2">
            <AppEmoji name="zap" size={26} /> FLASH SALES
          </NeonText>
        </div>
        <GamingButton variant="primary" size="sm" icon={Plus} onClick={openCreate}>New Sale</GamingButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-xl font-black text-cyan-400">{sales.length}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-xl font-black text-green-400">{sales.filter(isLive).length}</p>
          <p className="text-xs text-slate-400">Live Now</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-xl font-black text-yellow-400">{sales.filter(s => s.is_active && !isLive(s)).length}</p>
          <p className="text-xs text-slate-400">Scheduled</p>
        </div>
      </div>

      {/* Sales list */}
      {sales.length === 0 ? (
        <div className="text-center py-16">
          <AppEmoji name="zap" size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-slate-400">No flash sales yet. Create one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale, i) => {
            const live = isLive(sale);
            return (
              <motion.div key={sale.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlowCard glowColor={live ? 'red' : sale.color || 'cyan'} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <AppEmoji name={sale.icon_name || 'fire'} size={32} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white">{sale.title}</h3>
                          {live && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse font-bold">LIVE</span>}
                          {sale.vip_only && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 rounded-full">VIP Only</span>}
                          {!sale.is_active && <span className="text-xs bg-slate-500/20 text-slate-400 px-2 rounded-full">Inactive</span>}
                        </div>
                        <p className="text-xs text-slate-400">{sale.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-green-400">+{sale.bonus_percent}%</p>
                      <p className="text-xs text-slate-500">Min ₹{sale.min_amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>Ends: {sale.ends_at ? new Date(sale.ends_at).toLocaleString('en-IN') : '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(sale)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${sale.is_active ? 'border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'border-green-500/50 text-green-400 bg-green-500/10 hover:bg-green-500/20'}`}>
                      <Power className="w-3 h-3 inline mr-1" />{sale.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openEdit(sale)} className="p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700/50"><Edit3 className="w-4 h-4 text-cyan-400" /></button>
                    <button onClick={() => setDeleteConfirm(sale)} className="p-2 bg-slate-800/50 rounded-xl hover:bg-red-500/20"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AppEmoji name="zap" size={20} />{selected ? 'Edit Flash Sale' : 'New Flash Sale'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Weekend Mega Bonus" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Get extra coins on deposits!" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Bonus % *</Label>
                <Input type="number" value={form.bonus_percent} onChange={e => setForm({ ...form, bonus_percent: e.target.value })} className="bg-slate-800 border-slate-700 text-white" min="1" max="200" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Min Deposit (₹)</Label>
                <Input type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Icon</Label>
                <Select value={form.icon_name} onValueChange={v => setForm({ ...form, icon_name: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ICON_OPTIONS.map(ic => (
                      <SelectItem key={ic} value={ic} className="text-white capitalize">{ic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Color</Label>
                <Select value={form.color} onValueChange={v => setForm({ ...form, color: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {COLOR_OPTIONS.map(c => (
                      <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Start Date</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">End Date *</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div>
                <p className="text-white font-medium text-sm">Active</p>
                <p className="text-slate-400 text-xs">Enable this flash sale</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div>
                <p className="text-white font-medium text-sm">VIP Only</p>
                <p className="text-slate-400 text-xs">Only show to VIP members</p>
              </div>
              <Switch checked={form.vip_only} onCheckedChange={v => setForm({ ...form, vip_only: v })} />
            </div>

            {/* Live preview */}
            {form.title && (
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">Preview:</p>
                <div className="flex items-center gap-3">
                  <AppEmoji name={form.icon_name || 'fire'} size={28} />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{form.title}</p>
                    <p className="text-slate-400 text-xs">Min ₹{form.min_amount} · +{form.bonus_percent}% bonus</p>
                  </div>
                  <p className="text-green-400 font-black text-xl">+{form.bonus_percent}%</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</GamingButton>
            <GamingButton variant="primary" className="flex-1" loading={saving} icon={Save} onClick={handleSave}>Save</GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Flash Sale?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">Delete "{deleteConfirm?.title}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(deleteConfirm)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
