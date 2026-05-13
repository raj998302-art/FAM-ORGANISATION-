import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Calendar, Trophy, Users, Clock, Star, Gift, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toast } from 'sonner';

export default function Events() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      const allEvents = await apiClient.entities.Event.list('-created_date');
      setEvents(allEvents);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (event) => {
    try {
      const profiles = await apiClient.entities.UserProfile.filter({ user_email: user.email });
      
      const existing = await apiClient.entities.EventParticipant.filter({
        event_id: event.id,
        user_email: user.email
      });

      if (existing.length > 0) {
        toast.error('Already joined this event');
        return;
      }

      await apiClient.entities.EventParticipant.create({
        event_id: event.id,
        user_id: user.id,
        user_email: user.email,
        username: profiles[0]?.username || 'Player',
        joined_at: new Date().toISOString()
      });

      await apiClient.entities.Event.update(event.id, {
        current_participants: (event.current_participants || 0) + 1
      });

      toast.success('Successfully joined event!');
      await loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to join event');
    }
  };

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    return e.event_type === filter;
  });

  const getEventColor = (type) => {
    const colors = {
      seasonal: 'orange',
      community: 'cyan',
      special: 'purple',
      challenge: 'green',
      celebration: 'gold'
    };
    return colors[type] || 'cyan';
  };

  const getEventIcon = (type) => {
    const icons = {
      seasonal: Calendar,
      community: Users,
      special: Star,
      challenge: Trophy,
      celebration: Gift
    };
    return icons[type] || Calendar;
  };

  if (loading) {
    return <LoadingScreen message="Loading events..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="purple" size="2xl" className="mb-2 flex items-center gap-2">
          <Star className="w-7 h-7" />
          SPECIAL EVENTS
        </NeonText>
        <p className="text-slate-400">Join exclusive events and win amazing rewards</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar" style={{WebkitOverflowScrolling:'touch',touchAction:'pan-x',overscrollBehaviorX:'contain'}}>
        {['all', 'seasonal', 'community', 'special', 'challenge', 'celebration'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              filter === type
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No events available</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const EventIcon = getEventIcon(event.event_type);
            const color = getEventColor(event.event_type);
            const isActive = event.status === 'active';
            const isUpcoming = event.status === 'upcoming';

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard glowColor={color} className="overflow-hidden" animated>
                  {/* Thumbnail Banner */}
                  {(event.thumbnail_url || event.image_url) && (
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={event.thumbnail_url || event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.parentElement.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                      {event.is_featured && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                          FEATURED
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center`}>
                        <EventIcon className={`w-6 h-6 text-${color}-400`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                        <p className="text-slate-400 text-sm">{event.description}</p>
                      </div>
                    </div>
                    {event.is_featured && !(event.thumbnail_url || event.image_url) && (
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        FEATURED
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300">
                        {isActive ? 'Active Now' : new Date(event.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-300">
                        {event.current_participants || 0}/{event.max_participants || '∞'}
                      </span>
                    </div>
                  </div>

                  {event.rewards && event.rewards.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-slate-400 mb-2">Rewards:</p>
                      <div className="flex flex-wrap gap-2">
                        {event.rewards.slice(0, 3).map((reward, i) => (
                          <div key={i} className="bg-slate-700/50 px-2 py-1 rounded-lg text-xs text-cyan-400">
                            #{reward.position}: {reward.reward_description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isActive && (
                      <GamingButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleJoinEvent(event)}
                        className="flex-1"
                      >
                        Join Event
                      </GamingButton>
                    )}
                    <Link to={createPageUrl(`EventDetails?id=${event.id}`)} className="flex-1">
                      <GamingButton variant="outline" size="sm" className="w-full">
                        View Details <ArrowRight className="w-4 h-4 ml-1" />
                      </GamingButton>
                    </Link>
                  </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}