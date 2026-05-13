import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Trash2, Save, BarChart2, Edit3, Power } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const emptyPoll = { question: '', options: ['', ''], is_active: true, expires_at: '', allow_multiple: false };
const emptyBanner = { message: '', style: 'info', cta_url: '', cta_label: '', dismissable: true, is_active: true, expires_at: '' };
const BANNER_STYLES = ['info', 'warning', 'success', 'urgent', 'promo'];

export default function AdminPolls() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState([]);
  const [banners, setBanners] = useState([]);
  const [tab, setTab] = useState('polls');
  const [showPollForm, setShowPollForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pollForm, setPollForm] = useState(emptyPoll);
  const [bannerForm, setBannerForm] = useState(emptyBanner);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const cu = await apiClient.auth.me();
      if (!cu.panels?.includes('master_panel') && !cu.panels?.includes('community_panel')) {
        navigate(createPageUrl('AdminDashboard')); return;
      }
      await Promise.all([loadPolls(), loadBanners()]);
    } catch { navigate(createPageUrl('Home')); }
    finally { setLoading(false); }
  };

  const loadPolls = async () => {
    const data = await apiClient.entities.Poll.list('-created_date', 50).catch(() => []);
    setPolls(Array.isArray(data) ? data : []);
  };
  const loadBanners = async () => {
    const data = await apiClient.entities.AdminBanner.list('-created_date', 30).catch(() => []);
    setBanners(Array.isArray(data) ? data : []);
  };

  // ── Poll CRUD ──
  const savePoll = async () => {
    if (!pollForm.question.trim()) { toast.error('Poll question required'); return; }
    const validOpts = pollForm.options.filter(o => o.trim());
    if (validOpts.length < 2) { toast.error('At least 2 options required'); return; }
    setSaving(true);
    try {
      const data = {
        question: pollForm.question.trim(),
        options: validOpts.map(o => ({ text: o.trim(), votes: 0 })),
        is_active: pollForm.is_active,
        allow_multiple: pollForm.allow_multiple,
        expires_at: pollForm.expires_at || null,
        created_date: selectedPoll ? selectedPoll.created_date : new Date().toISOString(),
        total_votes: selectedPoll?.total_votes || 0,
      };
      selectedPoll ? await apiClient.entities.Poll.update(selectedPoll.id, data) : await apiClient.entities.Poll.create(data);
      toast.success(selectedPoll ? 'Poll updated!' : 'Poll created!');
      setShowPollForm(false); setSelectedPoll(null); setPollForm(emptyPoll);
      loadPolls();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const togglePoll = async (poll) => {
    await apiClient.entities.Poll.update(poll.id, { is_active: !poll.is_active });
    loadPolls();
  };

  // ── Banner CRUD ──
  const saveBanner = async () => {
    if (!bannerForm.message.trim()) { toast.error('Banner message required'); return; }
    setSaving(true);
    try {
      const data = { ...bannerForm, created_date: selectedBanner ? selectedBanner.created_date : new Date().toISOString() };
      selectedBanner ? await apiClient.entities.AdminBanner.update(selectedBanner.id, data) : await apiClient.entities.AdminBanner.create(data);
      toast.success(selectedBanner ? 'Banner updated!' : 'Banner created!');
      setShowBannerForm(false); setSelectedBanner(null); setBannerForm(emptyBanner);
      loadBanners();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggleBanner = async (banner) => {
    await apiClient.entities.AdminBanner.update(banner.id, { is_active: !banner.is_active });
    loadBanners();
  };

  const deleteItem = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.entityType === 'Poll') await apiClient.entities.Poll.delete(deleteConfirm.id);
      else await apiClient.entities.AdminBanner.delete(deleteConfirm.id);
      toast.success('Deleted');
      setDeleteConfirm(null);
      deleteConfirm.entityType === 'Poll' ? loadPolls() : loadBanners();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingScreen message="Loading polls & banners..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2"><ChevronLeft className="w-6 h-6 text-slate-400" /></button>
          <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
            <BarChart2 className="w-6 h-6" /> POLLS & BANNERS
          </NeonText>
        </div>
        <GamingButton variant="primary" size="sm" icon={Plus}
          onClick={() => tab === 'polls' ? (setSelectedPoll(null), setPollForm(emptyPoll), setShowPollForm(true)) : (setSelectedBanner(null), setBannerForm(emptyBanner), setShowBannerForm(true))}>
          New {tab === 'polls' ? 'Poll' : 'Banner'}
        </GamingButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['polls','Polls'],['banners','Site Banners']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${tab === t ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{l}</button>
        ))}
      </div>

      {/* Polls tab */}
      {tab === 'polls' && (
        <div className="space-y-4">
          {polls.length === 0 ? (
            <div className="text-center py-12"><BarChart2 className="w-14 h-14 text-slate-700 mx-auto mb-3" /><p className="text-slate-400">No polls yet</p></div>
          ) : polls.map((poll, i) => (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard glowColor={poll.is_active ? 'cyan' : 'slate'} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${poll.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{poll.is_active ? 'Active' : 'Closed'}</span>
                      <span className="text-slate-500 text-xs">{poll.total_votes || 0} votes</span>
                    </div>
                    <p className="text-white font-bold">{poll.question}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button onClick={() => togglePoll(poll)} className={`p-2 rounded-lg ${poll.is_active ? 'text-red-400 hover:bg-red-500/20' : 'text-green-400 hover:bg-green-500/20'}`}><Power className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedPoll(poll); setPollForm({ question: poll.question, options: poll.options?.map(o => o.text || o) || ['',''], is_active: poll.is_active, expires_at: poll.expires_at || '', allow_multiple: poll.allow_multiple || false }); setShowPollForm(true); }} className="p-2 rounded-lg hover:bg-slate-700/50"><Edit3 className="w-4 h-4 text-cyan-400" /></button>
                    <button onClick={() => setDeleteConfirm({ ...poll, entityType: 'Poll' })} className="p-2 rounded-lg hover:bg-red-500/20"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(poll.options || []).map((opt, oi) => {
                    const text = opt.text || opt;
                    const votes = opt.votes || 0;
                    const total = poll.total_votes || 1;
                    const pct = Math.round((votes / total) * 100);
                    return (
                      <div key={oi} className="relative">
                        <div className="absolute inset-0 bg-cyan-500/10 rounded-lg" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between px-3 py-2">
                          <span className="text-slate-300 text-sm">{text}</span>
                          <span className="text-cyan-400 text-xs font-bold">{votes} ({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Banners tab */}
      {tab === 'banners' && (
        <div className="space-y-4">
          {banners.length === 0 ? (
            <div className="text-center py-12"><BarChart2 className="w-14 h-14 text-slate-700 mx-auto mb-3" /><p className="text-slate-400">No site banners yet</p></div>
          ) : banners.map((banner, i) => (
            <motion.div key={banner.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard glowColor={banner.is_active ? 'cyan' : 'slate'} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${banner.style === 'urgent' ? 'bg-red-500/20 text-red-400' : banner.style === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{banner.style}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${banner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{banner.is_active ? 'Live' : 'Off'}</span>
                    </div>
                    <p className="text-white text-sm">{banner.message}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleBanner(banner)} className={`p-2 rounded-lg ${banner.is_active ? 'text-red-400' : 'text-green-400'}`}><Power className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedBanner(banner); setBannerForm({ message: banner.message || '', style: banner.style || 'info', cta_url: banner.cta_url || '', cta_label: banner.cta_label || '', dismissable: banner.dismissable !== false, is_active: banner.is_active !== false, expires_at: banner.expires_at || '' }); setShowBannerForm(true); }} className="p-2 rounded-lg"><Edit3 className="w-4 h-4 text-cyan-400" /></button>
                    <button onClick={() => setDeleteConfirm({ ...banner, entityType: 'AdminBanner' })} className="p-2 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Poll Form */}
      <Dialog open={showPollForm} onOpenChange={setShowPollForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><BarChart2 className="w-5 h-5 text-cyan-400" />{selectedPoll ? 'Edit Poll' : 'Create Poll'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Question *</Label>
              <Input value={pollForm.question} onChange={e => setPollForm({...pollForm, question: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="What's your favourite map?" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Options (min 2)</Label>
              {pollForm.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={opt} onChange={e => { const opts = [...pollForm.options]; opts[i] = e.target.value; setPollForm({...pollForm, options: opts}); }} className="bg-slate-800 border-slate-700 text-white flex-1" placeholder={`Option ${i+1}`} />
                  {pollForm.options.length > 2 && <button onClick={() => setPollForm({...pollForm, options: pollForm.options.filter((_,oi)=>oi!==i)})} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
              {pollForm.options.length < 6 && <button onClick={() => setPollForm({...pollForm, options: [...pollForm.options, '']})} className="text-cyan-400 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Option</button>}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Expires At (optional)</Label>
              <Input type="datetime-local" value={pollForm.expires_at} onChange={e => setPollForm({...pollForm, expires_at: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-white text-sm">Active</p>
              <Switch checked={pollForm.is_active} onCheckedChange={v => setPollForm({...pollForm, is_active: v})} />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div><p className="text-white text-sm">Allow Multiple Votes</p><p className="text-slate-400 text-xs">Users can vote for more than one option</p></div>
              <Switch checked={pollForm.allow_multiple} onCheckedChange={v => setPollForm({...pollForm, allow_multiple: v})} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowPollForm(false)}>Cancel</GamingButton>
            <GamingButton variant="primary" className="flex-1" loading={saving} icon={Save} onClick={savePoll}>Save Poll</GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Form */}
      <Dialog open={showBannerForm} onOpenChange={setShowBannerForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader><DialogTitle className="text-white">Site Banner</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Message *</Label>
              <Input value={bannerForm.message} onChange={e => setBannerForm({...bannerForm, message: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="Maintenance at 2 AM IST..." />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Style</Label>
              <Select value={bannerForm.style} onValueChange={v => setBannerForm({...bannerForm, style: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{BANNER_STYLES.map(s => <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">CTA URL</Label>
                <Input value={bannerForm.cta_url} onChange={e => setBannerForm({...bannerForm, cta_url: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">CTA Label</Label>
                <Input value={bannerForm.cta_label} onChange={e => setBannerForm({...bannerForm, cta_label: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="Learn More" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Expires At</Label>
              <Input type="datetime-local" value={bannerForm.expires_at} onChange={e => setBannerForm({...bannerForm, expires_at: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-white text-sm">Dismissable by users</p>
              <Switch checked={bannerForm.dismissable} onCheckedChange={v => setBannerForm({...bannerForm, dismissable: v})} />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <p className="text-white text-sm">Active (show on site)</p>
              <Switch checked={bannerForm.is_active} onCheckedChange={v => setBannerForm({...bannerForm, is_active: v})} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowBannerForm(false)}>Cancel</GamingButton>
            <GamingButton variant="primary" className="flex-1" loading={saving} icon={Save} onClick={saveBanner}>Save Banner</GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
