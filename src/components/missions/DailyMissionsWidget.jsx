import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Target, 
  Check, 
  ChevronRight,
  Gift,
  Trophy,
  Users,
  Coins,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../ui/GlowCard';
import { cn } from '@/lib/utils';

export default function DailyMissionsWidget({ user }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMissions();
    }
  }, [user]);

  const loadMissions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let todayMissions = await apiClient.entities.DailyMission.filter({
        user_email: user.email,
        mission_date: today
      });

      // Create missions if don't exist for today
      if (todayMissions.length === 0) {
        const missionTemplates = [
          {
            mission_type: 'join_tournament',
            mission_title: 'Join a Tournament',
            mission_description: 'Participate in any tournament',
            target_count: 1,
            reward_xp: 50
          },
          {
            mission_type: 'daily_login',
            mission_title: 'Daily Login',
            mission_description: 'Login to Fire Arena today',
            target_count: 1,
            reward_xp: 20,
            is_completed: true,
            current_progress: 1
          },
          {
            mission_type: 'refer_friend',
            mission_title: 'Invite Friends',
            mission_description: 'Share your referral code',
            target_count: 1,
            reward_xp: 100
          }
        ];

        for (const template of missionTemplates) {
          await apiClient.entities.DailyMission.create({
            user_id: user.id,
            user_email: user.email,
            mission_date: today,
            ...template
          });
        }

        todayMissions = await apiClient.entities.DailyMission.filter({
          user_email: user.email,
          mission_date: today
        });
      }

      setMissions(todayMissions);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (mission) => {
    if (mission.current_progress < mission.target_count) {
      toast.error('Mission not completed yet');
      return;
    }

    try {
      // Update mission
      await apiClient.entities.DailyMission.update(mission.id, {
        is_completed: true,
        completed_at: new Date().toISOString()
      });

      const xpReward = mission.reward_xp || (mission.reward_coins ? mission.reward_coins * 10 : 20);

      // Add reward to profile
      const profiles = await apiClient.entities.UserProfile.filter({ user_email: user.email });
      if (profiles.length > 0) {
        await apiClient.entities.UserProfile.update(profiles[0].id, {
          xp: (profiles[0].xp || 0) + xpReward
        });

        await apiClient.entities.Notification.create({
          user_id: user.id,
          user_email: user.email,
          title: "Mission Completed!",
          message: `You earned +${xpReward} XP from Daily Mission: ${mission.mission_title}`,
          type: 'success',
          is_read: false
        });
      }

      toast.success(`+${xpReward} XP earned!`);
      loadMissions();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to claim reward');
    }
  };

  const getMissionIcon = (type) => {
    switch (type) {
      case 'join_tournament': return Trophy;
      case 'win_match': return Target;
      case 'refer_friend': return Users;
      case 'daily_login': return Check;
      case 'add_funds': return Coins;
      default: return Zap;
    }
  };

  if (loading || missions.length === 0) return null;

  const completedCount = missions.filter(m => m.is_completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <GlowCard glowColor="purple" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Daily Missions</h3>
          </div>
          <span className="text-sm text-purple-400 font-semibold">
            {completedCount}/{missions.length}
          </span>
        </div>

        <div className="space-y-2">
          {missions.slice(0, 3).map((mission) => {
            const Icon = getMissionIcon(mission.mission_type);
            const isComplete = mission.current_progress >= mission.target_count;
            const isClaimed = mission.is_completed;

            return (
              <div
                key={mission.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all",
                  isClaimed 
                    ? "bg-slate-800/30 opacity-60" 
                    : isComplete
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : "bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isClaimed ? "bg-green-500/20" : "bg-blue-500/20"
                  )}>
                    {isClaimed ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Icon className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {mission.mission_title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                          style={{ width: `${(mission.current_progress / mission.target_count) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {mission.current_progress}/{mission.target_count}
                      </span>
                    </div>
                  </div>
                </div>

                {isClaimed ? (
                  <span className="text-xs text-green-400 font-semibold">Claimed</span>
                ) : isComplete ? (
                  <button
                    onClick={() => claimReward(mission)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs font-semibold transition-colors"
                  >
                    <Gift className="w-3 h-3" />
                    +{mission.reward_xp || (mission.reward_coins ? mission.reward_coins * 10 : 20)} XP
                  </button>
                ) : (
                  <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                    +{mission.reward_xp || (mission.reward_coins ? mission.reward_coins * 10 : 20)} XP
                    <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </GlowCard>
    </motion.div>
  );
}