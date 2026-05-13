import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Award, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';


export default function AdminCertificates() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  
  const [formData, setFormData] = useState({
    tournamentId: '',
    tournamentName: '',
    gameMode: 'solo',
    position: 1,
    winnerUsername: '',
    teamName: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      if (!currentUser.panels.includes('forms_panel') && !currentUser.panels.includes('master_panel')) {
        window.location.href = createPageUrl('RolePanel');
        return;
      }
      setUser(currentUser);

      const allTournaments = await apiClient.entities.Tournament.list('-created_date', 50);
      setTournaments(allTournaments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = (data) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);

    // Border
    const positionColors = {
      1: { primary: '#eab308', secondary: '#f59e0b' },
      2: { primary: '#94a3b8', secondary: '#cbd5e1' },
      3: { primary: '#d97706', secondary: '#f59e0b' }
    };
    const colors = positionColors[data.position] || positionColors[1];
    
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, 1140, 740);

    // Title
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 600, 120);

    // Subtitle
    ctx.fillStyle = '#06b6d4';
    ctx.font = '30px Arial';
    ctx.fillText('FIRE ARENA GAMING CHAMPIONSHIP', 600, 170);

    // Winner name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(data.teamName || data.winnerUsername, 600, 280);

    // Position
    const positionText = data.position === 1 ? '1ST PLACE' : data.position === 2 ? '2ND PLACE' : '3RD PLACE';
    ctx.fillStyle = colors.secondary;
    ctx.font = 'bold 70px Arial';
    ctx.fillText(positionText, 600, 380);

    // Tournament details
    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px Arial';
    ctx.fillText(data.tournamentName, 600, 450);
    ctx.fillText(`${data.gameMode.toUpperCase()} MODE`, 600, 490);
    ctx.fillText(new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 600, 530);

    // Footer
    ctx.fillStyle = '#475569';
    ctx.font = '20px Arial';
    ctx.fillText('FIRE ARENA - THE ULTIMATE GAMING ARENA', 600, 720);

    return canvas.toDataURL('image/png');
  };

  const handleCreate = async () => {
    if (!formData.tournamentId || !formData.winnerUsername) {
      toast.error('Please fill all required fields');
      return;
    }

    setCreating(true);
    try {
      const profiles = await apiClient.entities.UserProfile.filter({ username: formData.winnerUsername });
      if (profiles.length === 0) {
        toast.error('User not found');
        setCreating(false);
        return;
      }

      const winner = profiles[0];
      const certificateImage = generateCertificate({
        ...formData,
        winnerUsername: winner.username
      });

      await apiClient.entities.Certificate.create({
        user_id: winner.user_id,
        user_email: winner.user_email,
        username: winner.username,
        tournament_name: formData.tournamentName,
        tournament_id: formData.tournamentId,
        game_mode: formData.gameMode,
        position: parseInt(formData.position),
        team_name: formData.teamName || null,
        certificate_date: formData.date,
        certificate_image: certificateImage
      });

      const positionLabel = formData.position == 1 ? '1st Place' : formData.position == 2 ? '2nd Place' : '3rd Place';
      await apiClient.entities.Notification.create({
        user_id: winner.user_id,
        user_email: winner.user_email,
        title: 'Certificate Earned!',
        message: `Congratulations! You've earned a certificate for ${positionLabel} in ${formData.tournamentName}`,
        type: 'reward'
      });

      toast.success('Certificate created successfully!');
      setFormData({
        tournamentId: '',
        tournamentName: '',
        gameMode: 'solo',
        position: 1,
        winnerUsername: '',
        teamName: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create certificate');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  const positionText = formData.position == 1 ? '1st Place' : formData.position == 2 ? '2nd Place' : '3rd Place';

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <NeonText color="gold" size="2xl" className="flex items-center gap-2 mb-2">
            <Award className="w-7 h-7" />
            CREATE CERTIFICATE
          </NeonText>
          <p className="text-slate-400">Award winners with digital certificates</p>
        </motion.div>

        <GlowCard glowColor="purple" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-slate-300">Tournament</Label>
              <Select 
                value={formData.tournamentId} 
                onValueChange={(value) => {
                  const tournament = tournaments.find(t => t.id === value);
                  setFormData({
                    ...formData,
                    tournamentId: value,
                    tournamentName: tournament?.title || '',
                    gameMode: tournament?.mode || 'solo'
                  });
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {tournaments.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Winner Username</Label>
              <Input
                value={formData.winnerUsername}
                onChange={(e) => setFormData({ ...formData, winnerUsername: e.target.value })}
                placeholder="Enter username"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Position</Label>
              <Select value={formData.position.toString()} onValueChange={(value) => setFormData({ ...formData, position: parseInt(value) })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">🥇 1st Place</SelectItem>
                  <SelectItem value="2">🥈 2nd Place</SelectItem>
                  <SelectItem value="3">🥉 3rd Place</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Team Name (Optional)</Label>
              <Input
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                placeholder="For squad/duo tournaments"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>

          <GamingButton
            variant="primary"
            size="lg"
            icon={creating ? Loader2 : Plus}
            onClick={handleCreate}
            loading={creating}
            className="w-full"
          >
            Generate Certificate
          </GamingButton>
        </GlowCard>

        <div className="mt-6 flex gap-3">
          <Link to={createPageUrl('AdminDashboard')} className="flex-1">
            <GamingButton variant="outline" className="w-full">
              Back to Dashboard
            </GamingButton>
          </Link>
        </div>
      </div>
    </div>
  );
}