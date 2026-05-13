import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Edit, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toast } from 'sonner';

export default function AdminAchievements() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    reward: 100,
    icon: 'Trophy',
    color: 'gold',
    condition_field: '',
    condition_value: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      if (!currentUser.panels.includes('achievement_panel') && !currentUser.panels.includes('master_panel')) {
        navigate('/role-panel');
        return;
      }
      setUser(currentUser);
      
      const definitions = await apiClient.entities.AchievementDef.list();
      setAchievements(definitions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type || !formData.reward) {
      toast.error('Name, Type, and Reward are required');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await apiClient.entities.AchievementDef.update(editingId, formData);
        toast.success("Achievement updated!");
      } else {
        await apiClient.entities.AchievementDef.create(formData);
        toast.success("Achievement created!");
      }
      setIsEditing(false);
      setEditingId(null);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save achievement");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      setLoading(true);
      try {
        await apiClient.entities.AchievementDef.delete(id);
        toast.success("Deleted successfully");
        await loadData();
      } catch (error) {
        toast.error("Failed to delete");
        setLoading(false);
      }
    }
  };

  const startEdit = (ach) => {
    setFormData({
      type: ach.type,
      name: ach.name,
      description: ach.description,
      reward: ach.reward,
      icon: ach.icon || 'Trophy',
      color: ach.color || 'gold',
      condition_field: ach.condition_field || '',
      condition_value: ach.condition_value || 0
    });
    setEditingId(ach._id || ach.id);
    setIsEditing(true);
  };

  const startCreate = () => {
    setFormData({
      type: '',
      name: '',
      description: '',
      reward: 100,
      icon: 'Trophy',
      color: 'gold',
      condition_field: '',
      condition_value: 0
    });
    setEditingId(null);
    setIsEditing(true);
  };

  if (loading && achievements.length === 0) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/role-panel')} className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <NeonText color="cyan" size="xl">Achievement Manager</NeonText>
        <div className="flex-1" />
        <GamingButton size="sm" onClick={startCreate} icon={Plus}>Create New</GamingButton>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <GlowCard glowColor="cyan" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{editingId ? 'Edit' : 'Create'} Achievement</h3>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-slate-400 block mb-1">Key/Type Identifier (e.g. 'first_win')</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                     value={formData.type} 
                     onChange={(e) => setFormData({...formData, type: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-xs text-slate-400 block mb-1">Display Name</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                     value={formData.name} 
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="text-xs text-slate-400 block mb-1">Description</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                     value={formData.description} 
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-xs text-slate-400 block mb-1">XP Reward</label>
                   <input 
                     type="number" 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                     value={formData.reward} 
                     onChange={(e) => setFormData({...formData, reward: parseInt(e.target.value) || 0})}
                   />
                </div>
                <div>
                   <label className="text-xs text-slate-400 block mb-1">Color Theme</label>
                   <select 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:outline-none" 
                     value={formData.color} 
                     onChange={(e) => setFormData({...formData, color: e.target.value})}
                   >
                      <option value="gold">Gold</option>
                      <option value="cyan">Cyan</option>
                      <option value="purple">Purple</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="red">Red</option>
                      <option value="orange">Orange</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs text-slate-400 block mb-1">Condition Field</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                     placeholder="e.g. tournaments_won"
                     value={formData.condition_field} 
                     onChange={(e) => setFormData({...formData, condition_field: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-xs text-slate-400 block mb-1">Target Value</label>
                   <input 
                     type="number" 
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                     value={formData.condition_value} 
                     onChange={(e) => setFormData({...formData, condition_value: parseInt(e.target.value) || 0})}
                   />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <GamingButton onClick={handleSave} icon={Save} loading={loading}>Save</GamingButton>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {achievements.length === 0 && !loading && (
           <p className="text-center text-slate-500 my-8">No achievements defined yet. Click "Create New" to add some.</p>
        )}
        {achievements.map((ach) => (
          <GlowCard key={ach.id || ach._id} glowColor={ach.color} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                 <h4 className="font-bold text-white tracking-wider flex items-center gap-2">
                    <Trophy className={`w-4 h-4 text-${ach.color}-400`} />
                    {ach.name}
                 </h4>
                 <p className="text-slate-400 text-sm mt-1">{ach.description}</p>
                 <div className="flex gap-4 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400">XP: +{ach.reward}</span>
                    {ach.condition_field && <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-400">{ach.condition_field} &ge; {ach.condition_value}</span>}
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => startEdit(ach)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-cyan-400"><Edit className="w-4 h-4" /></button>
                 <button onClick={() => handleDelete(ach.id || ach._id)} className="p-2 bg-slate-800 hover:bg-red-500/20 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
