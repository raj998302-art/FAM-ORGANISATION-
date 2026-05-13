import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { useLocation } from 'react-router-dom';
import { Trophy, Users, Gift, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function EventDetails() {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const params = new URLSearchParams(location.search);
      const eventId = params.get('id');

      const events = await apiClient.entities.Event.filter({ id: eventId });
      if (events.length > 0) {
        setEvent(events[0]);

        const eventParticipants = await apiClient.entities.EventParticipant.filter(
          { event_id: eventId },
          '-score'
        );
        setParticipants(eventParticipants);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading event..." />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      <Link to={createPageUrl('Events')}>
        <button className="flex items-center gap-2 text-slate-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
      </Link>

      <GlowCard glowColor="purple" className="overflow-hidden mb-6">
        {/* Thumbnail / Banner */}
        {(event.thumbnail_url || event.image_url || event.banner_url) && (
          <div className="relative h-44 overflow-hidden">
            <img
              src={event.banner_url || event.thumbnail_url || event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={e => { e.target.parentElement.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            {event.is_featured && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">
                FEATURED
              </div>
            )}
          </div>
        )}
        <div className="p-6">
        <NeonText color="purple" size="2xl" className="mb-4">
          {event.title}
        </NeonText>
        <p className="text-slate-300 mb-6">{event.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-slate-500 text-xs mb-1">Start Date</p>
            <p className="text-white font-semibold">
              {new Date(event.start_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">End Date</p>
            <p className="text-white font-semibold">
              {new Date(event.end_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Participants</p>
            <p className="text-white font-semibold flex items-center gap-1">
              <Users className="w-4 h-4 text-cyan-400" />
              {event.current_participants || 0}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              event.status === 'active' ? 'bg-green-500/20 text-green-400' :
              event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {event.status.toUpperCase()}
            </span>
          </div>
        </div>

        {event.rules && (
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Rules
            </h3>
            <p className="text-slate-300 text-sm whitespace-pre-line">{event.rules}</p>
          </div>
        )}
        </div>
      </GlowCard>

      {event.rewards && event.rewards.length > 0 && (
        <GlowCard glowColor="gold" className="p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Rewards
          </h3>
          <div className="space-y-2">
            {event.rewards.map((reward, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-400' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-600/20 text-slate-500'
                  }`}>
                    #{reward.position}
                  </div>
                  <span className="text-white">{reward.reward_description}</span>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      <GlowCard glowColor="cyan" className="p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" />
          Leaderboard
        </h3>
        {participants.length === 0 ? (
          <p className="text-slate-400 text-center py-6">No participants yet</p>
        ) : (
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-400' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-600/20 text-slate-500'
                  }`}>
                    #{i + 1}
                  </div>
                  <span className="text-white">{p.username}</span>
                </div>
                <span className="text-cyan-400 font-bold">{p.score || 0} pts</span>
              </div>
            ))}
          </div>
        )}
      </GlowCard>
    </div>
  );
}