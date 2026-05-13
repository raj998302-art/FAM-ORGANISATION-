import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Trophy, 
  Wallet,
  Settings,
  Bell,
  MessageCircle,
  Coins,
  ChevronRight,
  Activity,
  Wrench,
  Award,
  Star,
  FileText,
  Cpu,
  TrendingUp,
  Zap,
  BarChart2
} from 'lucide-react';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import StatCard from '../components/ui/StatCard';
import LoadingScreen from '../components/ui/LoadingScreen';
import AppEmoji from '../components/ui/AppEmoji';


export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTournaments: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0,
    totalPrizePool: 0,
    unreadChats: 0,
    totalEvents: 0,
    pendingForms: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      if (!currentUser.panels.includes('master_panel')) {
        navigate(createPageUrl('RolePanel'));
        return;
      }
      setUser(currentUser);

      const [profiles, tournaments, withdrawals, chats, transactions, events, forms] = await Promise.all([
        apiClient.entities.UserProfile.list().catch(() => []),
        apiClient.entities.Tournament.list().catch(() => []),
        apiClient.entities.WithdrawalRequest.filter({ status: 'pending' }).catch(() => []),
        apiClient.entities.ChatMessage.filter({ is_admin_reply: false, read_by_admin: false }).catch(() => []),
        apiClient.entities.Transaction.list().catch(() => []),
        apiClient.entities.Event.list().catch(() => []),
        apiClient.entities.RoleApplication.filter({ status: 'pending' }).catch(() => []),
      ]);

      const activeTournaments = (tournaments || []).filter(t => 
        ['upcoming', 'registration_open', 'live'].includes(t.status)
      );
      const totalPrize = activeTournaments.reduce((sum, t) => sum + (t.prize_pool || 0), 0);
      const pendingDeposits = (transactions || []).filter(t => t.status === 'pending' && (t.type === 'deposit' || t.type === 'vip_subscription')).length;
      const totalRevenue = (transactions || []).filter(t => t.status === 'completed' && t.type === 'deposit').reduce((s, t) => s + (t.amount || 0), 0);

      setStats({
        totalUsers: (profiles || []).length,
        activeTournaments: activeTournaments.length,
        pendingWithdrawals: (withdrawals || []).length,
        pendingDeposits,
        totalPrizePool: totalPrize,
        unreadChats: (chats || []).length,
        totalEvents: (events || []).filter(e => e.status === 'active').length,
        pendingForms: (forms || []).length,
        totalRevenue,
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading admin panel..." />;
  }

  const adminMenuItems = [
    {
      title: 'Analytics Dashboard',
      description: 'Revenue, users, tournaments & insights',
      emojiName: 'stats',
      color: 'cyan',
      path: 'AdminAnalytics',
    },
    {
      title: 'Flash Sales',
      description: 'Create & manage time-limited coin offers',
      emojiName: 'zap',
      color: 'red',
      path: 'AdminFlashSale',
    },
    {
      title: 'Manage Tournaments',
      description: 'Create, edit, and manage all tournaments',
      emojiName: 'trophy',
      color: 'gold',
      path: 'AdminTournaments',
      badge: stats.activeTournaments
    },
    {
      title: 'Manage Events',
      description: 'Create events with thumbnails & rewards',
      emojiName: 'event',
      color: 'purple',
      path: 'AdminEvents',
      badge: stats.totalEvents
    },
    {
      title: 'User Management',
      description: 'View, ban, and manage user accounts',
      emojiName: 'team',
      color: 'cyan',
      path: 'AdminUsers',
      badge: stats.totalUsers
    },
    {
      title: 'Withdrawals',
      description: 'Process withdrawal requests',
      emojiName: 'coins',
      color: 'green',
      path: 'AdminWithdrawals',
      badge: stats.pendingWithdrawals,
      urgent: stats.pendingWithdrawals > 0
    },
    {
      title: 'Support Chats',
      description: 'Reply to user support messages',
      emojiName: 'chat',
      color: 'purple',
      path: 'AdminChats',
      badge: stats.unreadChats,
      urgent: stats.unreadChats > 0
    },
    {
      title: 'Deposits & VIP',
      description: 'Approve deposits & VIP subscriptions',
      emojiName: 'coins',
      color: 'gold',
      path: 'AdminDeposits',
      badge: stats.pendingDeposits,
      urgent: stats.pendingDeposits > 0
    },
    {
      title: 'Anti-Cheat Review',
      description: 'Review & verify match proof screenshots',
      emojiName: 'shield',
      color: 'orange',
      path: 'AdminAntiCheat',
    },
    {
      title: 'Dispute Resolution',
      description: 'Resolve player disputes & complaints',
      emojiName: 'forms',
      color: 'purple',
      path: 'AdminDisputes',
    },
    {
      title: 'Polls & Site Banners',
      description: 'Create polls, manage announcement banners',
      emojiName: 'stats',
      color: 'cyan',
      path: 'AdminPolls',
    },
    {
      title: 'Announcements',
      description: 'Post news & announcements to all users',
      emojiName: 'notification',
      color: 'cyan',
      path: 'AdminAnnouncements',
    },
    {
      title: 'User Warnings',
      description: 'Issue & manage user warnings (3 = auto-ban)',
      emojiName: 'ban',
      color: 'red',
      path: 'AdminWarnings',
    },
    {
      title: 'Warning Appeals',
      description: 'Review user appeals for warning removal',
      emojiName: 'forms',
      color: 'purple',
      path: 'AdminWarningAppeals',
    },
    {
      title: 'Promotion Reviews',
      description: 'Approve/reject staff promotion task submissions',
      emojiName: 'medal',
      color: 'gold',
      path: 'AdminPromotion',
    },
    {
      title: 'Role Applications',
      description: 'Review staff role applications',
      emojiName: 'forms',
      color: 'cyan',
      path: 'AdminForms',
      badge: stats.pendingForms,
      urgent: stats.pendingForms > 0
    },
    {
      title: 'Broadcast Notification',
      description: 'Send notifications to all users',
      emojiName: 'notification',
      color: 'orange',
      path: 'AdminBroadcast'
    },
    {
      title: 'Create Certificates',
      description: 'Award winners with certificates',
      emojiName: 'medal',
      color: 'gold',
      path: 'AdminCertificates'
    },
    {
      title: 'Payment Settings',
      description: 'QR scanner, UPI ID & payment config',
      emojiName: 'coins',
      color: 'blue',
      path: 'AdminPaymentSettings',
    },
    {
      title: 'Technical Panel',
      description: 'System settings & maintenance',
      emojiName: 'stats',
      color: 'red',
      path: 'TechnicalPanel',
    },
    {
      title: 'App Settings',
      description: 'Maintenance mode, limits, configs',
      emojiName: 'shield',
      color: 'blue',
      path: 'AdminSettings'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
            <AppEmoji name="shield" size={28} />
          </div>
          <div>
            <NeonText color="purple" size="2xl">OWNER PANEL</NeonText>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row 1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-3"
      >
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="cyan" />
        <StatCard icon={Trophy} label="Active Tournaments" value={stats.activeTournaments} color="gold" />
      </motion.div>

      {/* Quick Stats Row 2 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3 mb-3"
      >
        <StatCard icon={Coins} label="Prize Pool" value={`₹${stats.totalPrizePool}`} color="green" />
        <StatCard icon={TrendingUp} label="Revenue" value={`₹${stats.totalRevenue}`} color="purple" />
      </motion.div>

      {/* Alert Row */}
      {(stats.pendingWithdrawals > 0 || stats.pendingDeposits > 0 || stats.unreadChats > 0 || stats.pendingForms > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <GlowCard glowColor="red" className="p-3">
            <p className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Action Required
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.pendingWithdrawals > 0 && (
                <Link to={createPageUrl('AdminWithdrawals')}>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-lg">
                    {stats.pendingWithdrawals} withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''} pending
                  </span>
                </Link>
              )}
              {stats.pendingDeposits > 0 && (
                <Link to={createPageUrl('AdminDeposits')}>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg">
                    {stats.pendingDeposits} deposit{stats.pendingDeposits > 1 ? 's' : ''} pending
                  </span>
                </Link>
              )}
              {stats.unreadChats > 0 && (
                <Link to={createPageUrl('AdminChats')}>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg">
                    {stats.unreadChats} unread chat{stats.unreadChats > 1 ? 's' : ''}
                  </span>
                </Link>
              )}
              {stats.pendingForms > 0 && (
                <Link to={createPageUrl('AdminForms')}>
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-lg">
                    {stats.pendingForms} form{stats.pendingForms > 1 ? 's' : ''} pending
                  </span>
                </Link>
              )}
            </div>
          </GlowCard>
        </motion.div>
      )}

      {/* Menu Items */}
      <div className="space-y-3">
        {adminMenuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.04 }}
          >
            <Link to={createPageUrl(item.path)}>
              <GlowCard 
                glowColor={item.color} 
                className={`p-4 ${item.urgent ? 'ring-1 ring-red-500/50' : ''}`}
                animated
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/20 border border-${item.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                      <AppEmoji name={item.emojiName} size={26} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge !== undefined && (
                      <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                        item.urgent 
                          ? 'bg-red-500/20 text-red-400 animate-pulse' 
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </GlowCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 grid grid-cols-2 gap-3"
      >
        <Link to={createPageUrl('TechnicalPanel')}>
          <GamingButton variant="danger" className="w-full" icon={Wrench}>Maintenance</GamingButton>
        </Link>
        <Link to={createPageUrl('Home')}>
          <GamingButton variant="outline" className="w-full">Back to App</GamingButton>
        </Link>
      </motion.div>
    </div>
  );
}

