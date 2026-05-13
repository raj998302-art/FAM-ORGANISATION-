import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { ChevronLeft, QrCode, Upload, Save, Eye, Coins } from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { hasPaymentAccess } from '@/lib/roles';
import { checkPermission, PERMISSIONS } from '@/lib/permissions';

export default function AdminPaymentSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [canEditSettings, setCanEditSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    payment_scanner_url: '',
    payment_upi_id: '',
    payment_whatsapp: '',
    payment_instructions: ''
  });

  useEffect(() => {
    checkAccess();
    loadData();
  }, []);

  const checkAccess = async () => {
    const user = await apiClient.auth.me();
    if (!hasPaymentAccess(user)) {
      navigate(createPageUrl('Home'));
    }
    // Only owner/co_owner can edit QR/UPI settings
    setCanEditSettings(checkPermission(user, PERMISSIONS.MANAGE_SYSTEM));
  };

  const loadData = async () => {
    try {
      const settingsList = await apiClient.entities.AppSettings.list();
      if (settingsList.length > 0) {
        setSettings(settingsList[0]);
        setFormData({
          payment_scanner_url: settingsList[0].payment_scanner_url || '',
          payment_upi_id: settingsList[0].payment_upi_id || '',
          payment_whatsapp: settingsList[0].payment_whatsapp || '',
          payment_instructions: settingsList[0].payment_instructions || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadScanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile(file);
      setFormData(prev => ({ ...prev, payment_scanner_url: file_url }));
      toast.success('Scanner image uploaded!');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        await apiClient.entities.AppSettings.update(settings.id, formData);
      } else {
        await apiClient.entities.AppSettings.create({ key: 'main', ...formData });
      }
      toast.success('Payment settings saved!');
      loadData();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };



  if (loading) return <LoadingScreen message="Loading payment settings..." />;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="gold" size="2xl" className="flex items-center gap-2">
          <Coins className="w-7 h-7" /> PAYMENT SETTINGS
        </NeonText>
      </div>

      {/* Scanner & UPI Settings */}
      <GlowCard glowColor="cyan" className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white">QR Scanner & UPI Settings</h3>
        </div>

        {/* Scanner Preview */}
        <div className="flex justify-center mb-4">
          {formData.payment_scanner_url ? (
            <div className="relative">
              <div className="p-3 bg-white rounded-2xl">
                <img src={formData.payment_scanner_url} alt="Scanner" className="w-48 h-48 object-contain" />
              </div>
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">Active</span>
            </div>
          ) : (
            <div className="w-48 h-48 bg-slate-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-600">
              <QrCode className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-slate-500 text-xs">No scanner uploaded</p>
            </div>
          )}
        </div>

        {canEditSettings ? (
          <>
            {/* Upload Button - Owner/Co-Owner only */}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleUploadScanner} className="hidden" />
              <GamingButton variant="outline" size="sm" className="w-full mb-4" loading={uploading} icon={Upload}>
                {uploading ? 'Uploading...' : 'Upload New Scanner Image'}
              </GamingButton>
            </label>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">UPI ID</Label>
                <Input
                  value={formData.payment_upi_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_upi_id: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  placeholder="e.g. yourname@paytm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">WhatsApp Support Number</Label>
                <Input
                  value={formData.payment_whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_whatsapp: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g. +91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Payment Instructions (shown to users)</Label>
                <Textarea
                  value={formData.payment_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_instructions: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g. Use your registered name as payment note..."
                  rows={3}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center">
            <Eye className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="text-orange-400 font-semibold">View Only</p>
            <p className="text-slate-400 text-xs mt-1">Only Owner / Co-Owner can edit QR scanner & UPI settings</p>
            {formData.payment_upi_id && <p className="text-cyan-400 font-mono mt-3 text-sm">UPI: {formData.payment_upi_id}</p>}
          </div>
        )}
      </GlowCard>

      {canEditSettings && (
        <GamingButton variant="primary" size="lg" className="w-full" icon={Save} loading={saving} onClick={handleSave}>
          Save Payment Settings
        </GamingButton>
      )}
    </div>
  );
}