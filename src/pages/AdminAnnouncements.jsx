import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Edit3, Trash2, Megaphone, Pin, Save, Star } from 'lucide-react';
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

const POST_TYPES = ['announcement', 'tournament', 'update', 'event', 'urgent'];
const GLOW = { announcement: 'cyan', tournament: 'gold', update: 'green', event: 'purple', urgent: 'red' };

const emptyForm = { title: '', content: '', type: 'announcement', image_url: '', cta_url: '', cta_label: '', is_pinned: false, is_urgent: false };

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [user, setUser] = useState(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const cu = await apiClient.auth.me();
      if (!cu.panels?.includes('master_panel') && !cu.panels?.includes('community_panel')) {
        navigate(createPageUrl('AdminDashboard')); return;
      }
      setUser(cu);
      await loadPosts();
    } catch { navigate(createPageUrl('Home')); }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.entities.Announcement.list('-created_date', 100).catch(() => []);
      setPosts(Array.isArray(data) ? data : []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setSelected(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (post) => {
    setSelected(post);
    setForm({
      title: post.title || '', content: post.content || '',
      type: post.type || 'announcement', image_url: post.image_url || '',
      cta_url: post.cta_url || '', cta_label: post.cta_label || '',
      is_pinned: post.is_pinned || false, is_urgent: post.is_urgent || false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        author: user?.full_name || user?.email,
        created_date: selected ? selected.created_date : new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      if (selected) {
        await apiClient.entities.Announcement.update(selected.id, data);
        toast.success('Post updated!');
      } else {
        await apiClient.entities.Announcement.create(data);
        // Notify all users about new announcement
        await apiClient.admin.broadcastNotification(
          form.title,
          form.content?.slice(0, 120) || 'New announcement from FAM admin!',
          'broadcast'
        );
        toast.success('Announcement published & users notified!');
      }
      setShowForm(false);
      loadPosts();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (post) => {
    try {
      await apiClient.entities.Announcement.delete(post.id);
      toast.success('Post deleted');
      setDeleteConfirm(null);
      loadPosts();
    } catch (e) { toast.error(e.message); }
  };

  const togglePin = async (post) => {
    try {
      await apiClient.entities.Announcement.update(post.id, { is_pinned: !post.is_pinned });
      loadPosts();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <LoadingScreen message="Loading announcements..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
            <Megaphone className="w-6 h-6" /> ANNOUNCEMENTS
          </NeonText>
        </div>
        <GamingButton variant="primary" size="sm" icon={Plus} onClick={openCreate}>New Post</GamingButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-xl font-black text-cyan-400">{posts.length}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-xl font-black text-yellow-400">{posts.filter(p => p.is_pinned).length}</p>
          <p className="text-xs text-slate-400">Pinned</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
          <p className="text-xl font-black text-red-400">{posts.filter(p => p.is_urgent).length}</p>
          <p className="text-xs text-slate-400">Urgent</p>
        </div>
      </div>

      {/* Posts list */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="w-14 h-14 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No posts yet. Create one!</p>
          </div>
        ) : posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlowCard glowColor={GLOW[post.type] || 'cyan'} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold uppercase text-slate-400">{post.type}</span>
                    {post.is_pinned && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 rounded flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> Pinned</span>}
                    {post.is_urgent && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 rounded animate-pulse">URGENT</span>}
                  </div>
                  <h3 className="font-bold text-white text-sm">{post.title}</h3>
                  {post.content && <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{post.content}</p>}
                  <p className="text-slate-600 text-xs mt-1">{post.created_date ? new Date(post.created_date).toLocaleDateString('en-IN') : '—'}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => togglePin(post)} className={`p-2 rounded-lg hover:bg-slate-700/50 ${post.is_pinned ? 'text-yellow-400' : 'text-slate-500'}`}>
                    <Pin className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(post)} className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button onClick={() => setDeleteConfirm(post)} className="p-2 bg-slate-800/50 rounded-lg hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-cyan-400" />
              {selected ? 'Edit Post' : 'Create Announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="Announcement title" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Content</Label>
              <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="bg-slate-800 border-slate-700 text-white min-h-[100px]" placeholder="Full announcement text..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {POST_TYPES.map(t => <SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Image/Banner URL</Label>
              <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
              {form.image_url && <img src={form.image_url} alt="Preview" className="rounded-lg max-h-28 w-full object-cover border border-slate-700" onError={e => { e.target.style.display='none'; }} />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">CTA Button URL</Label>
                <Input value={form.cta_url} onChange={e => setForm({...form, cta_url: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">CTA Label</Label>
                <Input value={form.cta_label} onChange={e => setForm({...form, cta_label: e.target.value})} className="bg-slate-800 border-slate-700 text-white" placeholder="Register Now" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div><p className="text-white text-sm font-medium">Pin to Top</p><p className="text-slate-400 text-xs">Shows first in announcements</p></div>
              <Switch checked={form.is_pinned} onCheckedChange={v => setForm({...form, is_pinned: v})} />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div><p className="text-white text-sm font-medium">Mark as Urgent</p><p className="text-slate-400 text-xs">Highlighted with pulsing red badge</p></div>
              <Switch checked={form.is_urgent} onCheckedChange={v => setForm({...form, is_urgent: v})} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</GamingButton>
            <GamingButton variant="primary" className="flex-1" loading={saving} icon={Save} onClick={handleSave}>Publish</GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post?</AlertDialogTitle>
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
