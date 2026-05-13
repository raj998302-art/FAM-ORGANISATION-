import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Plus, Crown, Trophy, Target, TrendingUp, MessageCircle } from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Teams() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');
  const [member4, setMember4] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      const teams = await apiClient.entities.Team.list('-total_wins', 50);
      setAllTeams(teams);

      const userTeam = teams.find(t => 
        t.captain_email === currentUser.email || 
        t.members?.some(m => m.user_email === currentUser.email)
      );
      setMyTeam(userTeam);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !teamTag.trim()) {
      toast.error('Please fill team name and tag');
      return;
    }

    setCreating(true);
    try {
      const profiles = await apiClient.entities.UserProfile.filter({ user_email: user.email });
      const username = profiles[0]?.username || 'Player';

      let logoUrl = '';
      if (logoFile) {
        const uploadResult = await apiClient.integrations.Core.UploadFile(logoFile);
        logoUrl = uploadResult.file_url;
      }

      const members = [{
        user_id: user.id,
        user_email: user.email,
        username: username,
        role: 'captain'
      }];

      // Add additional members if provided
      for (const memberUsername of [member2, member3, member4]) {
        if (memberUsername.trim()) {
          const memberProfiles = await apiClient.entities.UserProfile.filter({ username: memberUsername.trim() });
          if (memberProfiles.length > 0) {
            members.push({
              user_id: memberProfiles[0].user_id,
              user_email: memberProfiles[0].user_email,
              username: memberProfiles[0].username,
              role: 'member'
            });
          }
        }
      }

      await apiClient.entities.Team.create({
        team_name: teamName,
        team_tag: teamTag.toUpperCase(),
        captain_id: user.id,
        captain_email: user.email,
        logo_url: logoUrl,
        members: members
      });

      toast.success('Team created successfully! 🎉');
      setShowCreateDialog(false);
      setTeamName('');
      setTeamTag('');
      setLogoFile(null);
      setLogoPreview('');
      setMember2('');
      setMember3('');
      setMember4('');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading teams..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="cyan" size="2xl" className="flex items-center gap-2 mb-2">
          <Users className="w-7 h-7" />
          TEAMS
        </NeonText>
        <p className="text-slate-400">Create or join a squad</p>
      </motion.div>

      {/* My Team */}
      {myTeam && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="text-cyan-400 font-semibold mb-3">MY TEAM</h3>
          <GlowCard glowColor="cyan" className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  {myTeam.logo_url ? (
                    <img src={myTeam.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">{myTeam.team_name}</h3>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded">
                      [{myTeam.team_tag}]
                    </span>
                  </div>
                  {myTeam.captain_email === user.email && (
                    <span className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                      <Crown className="w-3 h-3" />
                      Captain
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <button
                onClick={() => navigate(createPageUrl('TeamChat'))}
                className="w-full flex items-center justify-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-cyan-500/20 transition-colors font-semibold"
              >
                <MessageCircle className="w-5 h-5" />
                Team Chat
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Wins</p>
                <p className="text-lg font-bold text-white">{myTeam.total_wins || 0}</p>
              </div>
              <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Matches</p>
                <p className="text-lg font-bold text-white">{myTeam.total_matches || 0}</p>
              </div>
              <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Earnings</p>
                <p className="text-lg font-bold text-white">₹{myTeam.total_earnings || 0}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">MEMBERS ({myTeam.members?.length || 0})</p>
              <div className="space-y-2">
                {myTeam.members?.map((member, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-300">
                        {member.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{member.username}</p>
                    </div>
                    {member.role === 'captain' && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        </motion.div>
      )}

      {/* Create Team Button */}
      {!myTeam && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GlowCard glowColor="purple" className="p-6 text-center">
            <Users className="w-16 h-16 text-purple-400 mx-auto mb-3" />
            <h3 className="font-bold text-white text-lg mb-2">Create Your Team</h3>
            <p className="text-slate-400 text-sm mb-4">
              Build your squad and dominate tournaments together
            </p>
            <GamingButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateDialog(true)}
            >
              Create Team
            </GamingButton>
          </GlowCard>
        </motion.div>
      )}

      {/* All Teams Leaderboard */}
      <div>
        <h3 className="text-cyan-400 font-semibold mb-3">TOP TEAMS</h3>
        <div className="space-y-3">
          {allTeams.slice(0, 20).map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlowCard glowColor={index < 3 ? 'gold' : 'slate'} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-300">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{team.team_name}</p>
                      <span className="text-xs text-cyan-400">[{team.team_tag}]</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {team.total_wins} wins • {team.members?.length || 0} members
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-400">{team.total_wins}</p>
                    <p className="text-xs text-slate-500">Wins</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Team Name (max 50 characters)</Label>
              <Input
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={50}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Team Tag (2-4 letters)</Label>
              <Input
                placeholder="e.g., FFA"
                value={teamTag}
                onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                maxLength={4}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Team Logo (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
              {logoPreview && (
                <img src={logoPreview} alt="Preview" className="mt-2 w-20 h-20 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <Label className="text-slate-300">Team Members (Optional - 3 slots)</Label>
              <Input
                placeholder="Member 2 username"
                value={member2}
                onChange={(e) => setMember2(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1 mb-2"
              />
              <Input
                placeholder="Member 3 username"
                value={member3}
                onChange={(e) => setMember3(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mb-2"
              />
              <Input
                placeholder="Member 4 username"
                value={member4}
                onChange={(e) => setMember4(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">You are the captain (slot 1). Add up to 3 more members.</p>
            </div>
            <GamingButton
              variant="primary"
              onClick={handleCreateTeam}
              loading={creating}
              className="w-full"
            >
              Create Team
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}