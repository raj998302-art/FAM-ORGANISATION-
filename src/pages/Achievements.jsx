import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Award, 
  Trophy, 
  Target,
  Users,
  TrendingUp,
  Flame,
  Star,
  Lock,
  Gift
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Achievements() {
  const [loading, setLoading] = useState(true);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      const definitions = await apiClient.entities.AchievementDef.list();
      let achList = definitions.length > 0 ? definitions : [
        { type: 'first_win', name: 'First Victory', description: 'Win your first tournament', reward: 200, icon: 'Trophy', color: 'gold', condition_field: 'tournaments_won', condition_value: 1 },
        { type: 'win_streak_5', name: 'Hot Streak', description: 'Win 5 tournaments in a row', reward: 500, icon: 'Flame', color: 'red', condition_field: 'win_streak', condition_value: 5 },
        { type: 'tournaments_10', name: 'Competitor', description: 'Play 10 tournaments', reward: 150, icon: 'Target', color: 'cyan', condition_field: 'tournaments_played', condition_value: 10 },
        { type: 'kills_100', name: 'Sharpshooter', description: 'Get 100 total kills', reward: 200, icon: 'Target', color: 'red', condition_field: 'total_kills', condition_value: 100 },
        { type: 'earnings_1000', name: 'Money Maker', description: 'Earn ₹1000 total', reward: 300, icon: 'TrendingUp', color: 'green', condition_field: 'total_earnings', condition_value: 1000 },
        { type: 'referrals_5', name: 'Influencer', description: 'Refer 5 friends', reward: 300, icon: 'Users', color: 'cyan', condition_field: 'referral_count', condition_value: 5 },
      ];
      setAllAchievements(achList);

      const profiles = await apiClient.entities.UserProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) setProfile(profiles[0]);

      const achievements = await apiClient.entities.Achievement.filter({ user_email: currentUser.email });
      setUnlockedAchievements(achievements);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (type) => {
    return unlockedAchievements.some(a => a.achievement_type === type);
  };

  const canUnlock = (achievement) => {
    if (!profile) return false;
    
    if (achievement.condition_field && achievement.condition_value) {
       return (profile[achievement.condition_field] || 0) >= achievement.condition_value;
    }
    
    // Fallbacks if not set up with numeric conditions
    switch (achievement.type) {
      case 'first_win':
        return profile.tournaments_won >= 1;
      case 'tournaments_10':
        return profile.tournaments_played >= 10;
      case 'tournaments_50':
        return profile.tournaments_played >= 50;
      case 'tournaments_100':
        return profile.tournaments_played >= 100;
      case 'kills_100':
        return profile.total_kills >= 100;
      case 'kills_500':
        return profile.total_kills >= 500;
      case 'kills_1000':
        return profile.total_kills >= 1000;
      case 'earnings_1000':
        return profile.total_earnings >= 1000;
      case 'earnings_5000':
        return profile.total_earnings >= 5000;
      case 'earnings_10000':
        return profile.total_earnings >= 10000;
      case 'referrals_5':
        return profile.referral_count >= 5;
      case 'referrals_10':
        return profile.referral_count >= 10;
      default:
        return false;
    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
       case 'Flame': return Flame;
       case 'Star': return Star;
       case 'Target': return Target;
       case 'Award': return Award;
       case 'TrendingUp': return TrendingUp;
       case 'Users': return Users;
       default: return Trophy;
    }
  };

  const claimAchievement = async (achievement) => {
     try {
        setLoading(true);
        // Add to unlocked
        await apiClient.entities.Achievement.create({
           user_email: user.email,
           achievement_type: achievement.type,
           claimed_at: new Date().toISOString()
        });
        
        // Add XP to profile
        if (profile) {
           await apiClient.entities.UserProfile.update(profile.id || profile._id, {
              xp: (profile.xp || 0) + achievement.reward
           });
        }
        
        toast.success(`Claimed +${achievement.reward} XP from ${achievement.name}!`);
        await loadData();
     } catch (err) {
        console.error(err);
        toast.error("Failed to claim achievement");
        setLoading(false);
     }
  };

  const unlockedCount = allAchievements.filter(a => isUnlocked(a.type)).length;

  if (loading) {
    return <LoadingScreen message="Loading achievements..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="gold" size="2xl" className="flex items-center gap-2 mb-2">
          <Award className="w-7 h-7" />
          ACHIEVEMENTS
        </NeonText>
        <p className="text-slate-400">Unlock XP rewards and level up!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlowCard glowColor="purple" className="p-5 mb-6">
          <div className="text-center">
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
              {unlockedCount}/{allAchievements.length}
            </div>
            <p className="text-slate-400 text-sm">Achievements Unlocked</p>
            <div className="mt-3 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(unlockedCount / allAchievements.length) * 100}%` }}
              />
            </div>
          </div>
        </GlowCard>
      </motion.div>

      <div className="grid grid-cols-1 gap-3">
        {allAchievements.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.type);
          const canBeUnlocked = canUnlock(achievement);
          const Icon = getIcon(achievement.icon);

          return (
            <motion.div
              key={achievement.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.03 }}
            >
              <GlowCard 
                glowColor={unlocked ? achievement.color : 'slate'}
                className={cn(
                  "p-4",
                  !unlocked && "opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0",
                    unlocked 
                      ? `bg-${achievement.color}-500/20` 
                      : "bg-slate-800"
                  )}>
                    {unlocked ? (
                      <Icon className={`w-8 h-8 text-${achievement.color}-400`} />
                    ) : (
                      <Lock className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-bold mb-1",
                      unlocked ? "text-white" : "text-slate-500"
                    )}>
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {canBeUnlocked && !unlocked ? (
                         <button 
                           onClick={() => claimAchievement(achievement)}
                           className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded bg-yellow-500 hover:bg-yellow-400 text-slate-900 transition-colors"
                         >
                            <Gift className="w-3 h-3" />
                            Claim Reward
                         </button>
                      ) : (
                        <span className={cn(
                          "text-xs font-semibold px-2 py-1 rounded",
                          unlocked 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-slate-800 text-slate-500"
                        )}>
                          {unlocked ? "Unlocked" : "Locked"}
                        </span>
                      )}
                      
                      <span className="text-sm font-bold text-cyan-400">
                        +{achievement.reward} XP
                      </span>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}