import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import { 
  Trophy, 
  Users, 
  Clock, 
  MapPin, 
  Coins,
  ChevronLeft,
  Flame,
  Swords,
  Copy,
  Check,
  AlertCircle,
  Crown,
  Medal,
  Award,
  Lock,
  Upload,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TournamentDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  const [tournament, setTournament] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState(['', '', '']);
  const [copied, setCopied] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadData();
    }
  }, [tournamentId]);

  const loadData = async () => {
    try {
      const [currentUser, tournaments] = await Promise.all([
        apiClient.auth.me(),
        apiClient.entities.Tournament.filter({ id: tournamentId })
      ]);
      
      setUser(currentUser);
      
      if (tournaments.length > 0) {
        setTournament(tournaments[0]);
        
        // Check if user has already joined
        const isJoined = tournaments[0].participants?.some(
          p => p.user_email === currentUser.email
        );
        setHasJoined(isJoined);
      }

      // Load profile and wallet
      const [profiles, wallets] = await Promise.all([
        apiClient.entities.UserProfile.filter({ user_email: currentUser.email }),
        apiClient.entities.Wallet.filter({ user_email: currentUser.email })
      ]);

      if (profiles.length > 0) setProfile(profiles[0]);
      if (wallets.length > 0) setWallet(wallets[0]);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (profile.is_banned) {
      toast.error('Your account is banned from joining tournaments.');
      return;
    }

    if (!wallet || wallet.balance < tournament.entry_fee) {
      toast.error(`Insufficient balance. You need ₹${tournament.entry_fee} to join.`);
      navigate(createPageUrl('Wallet'));
      return;
    }

    // Check duplicate by username or uid
    const existingParticipant = tournament.participants?.find(
      p => p.ff_uid === profile?.ff_uid || p.username === profile?.username
    );
    if (existingParticipant) {
      toast.error('You are already registered in this tournament.');
      return;
    }

    setJoining(true);

    try {
      const participant = {
        username: profile.username,
        ff_uid: profile.ff_uid,
        team_name: tournament.mode !== 'solo' ? teamName : null,
        team_members: tournament.mode === 'squad' ? teamMembers.filter(m => m) : 
                      tournament.mode === 'duo' ? [teamMembers[0]].filter(m => m) : [],
      };

      // Call secure backend route
      await apiClient.integrations.Tournament.Join(tournament.id, participant);

      // Create notification
      await apiClient.entities.Notification.create({
        user_id: user.id,
        user_email: user.email,
        title: 'Successfully Joined!',
        message: `You have joined ${tournament.title}. Entry fee: ₹${tournament.entry_fee}`,
        type: 'tournament',
        icon: 'trophy'
      });

      toast.success('Successfully joined tournament!');
      setShowJoinDialog(false);
      setHasJoined(true);
      loadData();

    } catch (error) {
      console.error('Error joining:', error);
      toast.error('Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const copyRoomDetails = () => {
    navigator.clipboard.writeText(`Room ID: ${tournament.room_id}\nPassword: ${tournament.room_password}`);
    setCopied(true);
    toast.success('Room details copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingScreen message="Loading tournament..." />;
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <GlowCard glowColor="red" className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <NeonText color="red" size="xl">Tournament Not Found</NeonText>
          <p className="text-slate-400 mt-2">This tournament doesn't exist or has been removed.</p>
          <GamingButton 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate(createPageUrl('Tournaments'))}
          >
            Back to Tournaments
          </GamingButton>
        </GlowCard>
      </div>
    );
  }

  const statusConfig = {
    upcoming: { label: 'UPCOMING', color: 'blue' },
    registration_open: { label: 'REGISTRATION OPEN', color: 'green' },
    registration_closed: { label: 'SLOTS FULL', color: 'orange' },
    live: { label: 'LIVE NOW', color: 'red' },
    completed: { label: 'COMPLETED', color: 'slate' },
    cancelled: { label: 'CANCELLED', color: 'red' },
  };

  const status = statusConfig[tournament.status];
  const slotsLeft = tournament.max_slots - (tournament.filled_slots || 0);
  const canJoin = tournament.status === 'registration_open' && slotsLeft > 0 && !hasJoined;

  const mapImages = {
    bermuda: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop',
    purgatory: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&h=600&fit=crop',
    kalahari: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=1200&h=600&fit=crop',
    alpine: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=600&fit=crop',
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Hero Image */}
      <div className="relative h-64">
        <img
          src={tournament.thumbnail_url || tournament.thumbnail || mapImages[tournament.map] || mapImages.bermuda}
          alt={tournament.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl text-sm font-bold uppercase ${
          status.color === 'red' ? 'bg-red-500/90 text-white animate-pulse' :
          status.color === 'green' ? 'bg-green-500/90 text-white' :
          status.color === 'blue' ? 'bg-blue-500/90 text-white' :
          status.color === 'orange' ? 'bg-orange-500/90 text-white' :
          'bg-slate-600/90 text-white'
        }`}>
          {tournament.status === 'live' && <Flame className="w-4 h-4 inline mr-1 animate-pulse" />}
          {status.label}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-20 relative z-10">
        {/* Title Card */}
        <GlowCard glowColor="cyan" className="p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  tournament.mode === 'solo' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' :
                  tournament.mode === 'duo' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                }`}>
                  <Swords className="w-3 h-3 inline mr-1" />
                  {tournament.mode.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{tournament.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-green-400">₹{tournament.prize_pool}</p>
              <p className="text-xs text-slate-400">Prize Pool</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
              <Clock className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs text-slate-400">Match Time</p>
                <p className="text-sm font-semibold text-white">
                  {safeFormat(tournament.match_time, 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
              <MapPin className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-slate-400">Map</p>
                <p className="text-sm font-semibold text-white capitalize">{tournament.map}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
              <Coins className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-slate-400">Entry Fee</p>
                <p className="text-sm font-semibold text-white">₹{tournament.entry_fee}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
              <Users className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-slate-400">Slots</p>
                <p className="text-sm font-semibold text-white">
                  {tournament.filled_slots || 0}/{tournament.max_slots}
                </p>
              </div>
            </div>
          </div>
        </GlowCard>

        {/* Room Details (for joined players when live) */}
        {hasJoined && tournament.room_id && (tournament.status === 'live' || tournament.status === 'registration_closed') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlowCard glowColor="green" className="p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <NeonText color="green" size="lg">ROOM DETAILS</NeonText>
                <button
                  onClick={copyRoomDetails}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg text-green-400 text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Room ID</p>
                  <p className="text-lg font-mono font-bold text-white">{tournament.room_id}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Password</p>
                  <p className="text-lg font-mono font-bold text-white">{tournament.room_password}</p>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}

        {/* Quick action links for registered players */}
        {hasJoined && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link to={createPageUrl(`TournamentBracket?id=${tournament.id}`)}>
              <GamingButton variant="outline" className="w-full" icon={Trophy}>View Bracket</GamingButton>
            </Link>
            <Link to={createPageUrl(`MatchProofSubmission?id=${tournament.id}`)}>
              <GamingButton variant="outline" className="w-full" icon={Upload}>Submit Proof</GamingButton>
            </Link>
            <Link to={createPageUrl('DisputeResolution')} className="col-span-2">
              <GamingButton variant="outline" className="w-full text-purple-400 border-purple-500/40">Raise a Dispute</GamingButton>
            </Link>
          </div>
        )}

        {/* Prize Distribution */}
        <GlowCard glowColor="gold" className="p-5 mb-4">
          <NeonText color="gold" size="lg" className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" />
            PRIZE DISTRIBUTION
          </NeonText>
          <div className="space-y-3">
            {(tournament.prize_distribution || [
              { position: 1, prize: Math.floor(tournament.prize_pool * 0.5) },
              { position: 2, prize: Math.floor(tournament.prize_pool * 0.3) },
              { position: 3, prize: Math.floor(tournament.prize_pool * 0.2) }
            ]).map((prize, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  index === 1 ? 'bg-slate-400/10 border border-slate-400/30' :
                  index === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                  'bg-slate-800/50 border border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {index === 0 ? <Crown className="w-6 h-6 text-yellow-400" /> :
                   index === 1 ? <Medal className="w-6 h-6 text-slate-300" /> :
                   index === 2 ? <Award className="w-6 h-6 text-amber-600" /> :
                   <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-sm text-slate-400">{prize.position}</span>
                  }
                  <span className="font-semibold text-white">
                    {index === 0 ? '1st Place' :
                     index === 1 ? '2nd Place' :
                     index === 2 ? '3rd Place' :
                     `#${prize.position}`
                    }
                  </span>
                </div>
                <span className={`font-bold text-lg ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-slate-300' :
                  index === 2 ? 'text-amber-600' :
                  'text-slate-400'
                }`}>
                  ₹{prize.prize}
                </span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Participants */}
        <GlowCard glowColor="purple" className="p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <NeonText color="purple" size="lg" className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              PARTICIPANTS ({tournament.filled_slots || 0})
            </NeonText>
            <button onClick={loadData}>
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          {tournament.participants?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tournament.participants.map((p, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    p.user_email === user?.email 
                      ? 'bg-cyan-500/10 border border-cyan-500/30' 
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white">
                        {p.username || 'Player'}
                        {p.user_email === user?.email && (
                          <span className="text-xs text-cyan-400 ml-2">(You)</span>
                        )}
                      </p>
                      {p.team_name && (
                        <p className="text-xs text-slate-400">{p.team_name}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    UID: {p.ff_uid?.slice(-6)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-4">No participants yet</p>
          )}
        </GlowCard>

        {/* Rules */}
        {tournament.rules && (
          <GlowCard glowColor="cyan" className="p-5 mb-4">
            <NeonText color="cyan" size="lg" className="mb-3">RULES</NeonText>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{tournament.rules}</p>
          </GlowCard>
        )}

        {/* Results */}
        {tournament.status === 'completed' && tournament.results?.length > 0 && (
          <GlowCard glowColor="gold" className="p-5 mb-4">
            <NeonText color="gold" size="lg" className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5" />
              RESULTS
            </NeonText>
            <div className="space-y-2">
              {tournament.results.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                    index === 1 ? 'bg-slate-400/10 border border-slate-400/30' :
                    index === 2 ? 'bg-amber-700/10 border border-amber-700/30' :
                    'bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-slate-900' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-600 text-slate-900' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {result.position}
                    </span>
                    <div>
                      <p className="font-medium text-white">{result.username}</p>
                      <p className="text-xs text-slate-400">{result.kills} kills</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-400">+₹{result.prize_won}</span>
                </div>
              ))}
            </div>
          </GlowCard>
        )}

        {/* Action Button */}
        <div className="sticky bottom-20 py-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          {hasJoined ? (
            <GamingButton 
              variant="success" 
              size="lg" 
              className="w-full"
              icon={Check}
              disabled
            >
              Already Joined ✓
            </GamingButton>
          ) : canJoin ? (
            <GamingButton 
              variant="primary" 
              size="lg" 
              className="w-full"
              icon={Swords}
              onClick={() => setShowJoinDialog(true)}
            >
              Join Now • ₹{tournament.entry_fee}
            </GamingButton>
          ) : tournament.status === 'registration_closed' || slotsLeft <= 0 ? (
            <GamingButton 
              variant="ghost" 
              size="lg" 
              className="w-full"
              icon={Lock}
              disabled
            >
              Slots Full
            </GamingButton>
          ) : tournament.status === 'completed' ? (
            <GamingButton 
              variant="ghost" 
              size="lg" 
              className="w-full"
              disabled
            >
              Tournament Ended
            </GamingButton>
          ) : (
            <GamingButton 
              variant="ghost" 
              size="lg" 
              className="w-full"
              disabled
            >
              Registration Not Open
            </GamingButton>
          )}
        </div>
      </div>

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Join Tournament</DialogTitle>
            <DialogDescription className="text-slate-400">
              Confirm your registration for {tournament.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Entry Fee */}
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Entry Fee</span>
                <span className="text-xl font-bold text-yellow-400">₹{tournament.entry_fee}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
                <span className="text-slate-400">Your Balance</span>
                <span className={`font-semibold ${wallet?.balance >= tournament.entry_fee ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{wallet?.balance || 0}
                </span>
              </div>
            </div>

            {/* Team Name (for duo/squad) */}
            {tournament.mode !== 'solo' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Team Name</Label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}

            {/* Team Members (for duo/squad) */}
            {tournament.mode === 'duo' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Teammate UID (Optional)</Label>
                <Input
                  value={teamMembers[0]}
                  onChange={(e) => setTeamMembers([e.target.value, '', ''])}
                  placeholder="Enter teammate's Free Fire UID"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}

            {tournament.mode === 'squad' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Teammate UIDs (Optional)</Label>
                {[0, 1, 2].map((index) => (
                  <Input
                    key={index}
                    value={teamMembers[index]}
                    onChange={(e) => {
                      const newMembers = [...teamMembers];
                      newMembers[index] = e.target.value;
                      setTeamMembers(newMembers);
                    }}
                    placeholder={`Teammate ${index + 1} UID`}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                ))}
              </div>
            )}

            {/* Your UID */}
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <p className="text-xs text-cyan-400 mb-1">Your Free Fire UID</p>
              <p className="font-mono font-semibold text-white">{profile?.ff_uid || 'Not linked'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowJoinDialog(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant="primary" 
              className="flex-1"
              loading={joining}
              onClick={handleJoin}
              disabled={!wallet || wallet.balance < tournament.entry_fee}
            >
              Confirm Join
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}