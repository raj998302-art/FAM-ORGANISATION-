import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import BottomNav from './components/navigation/BottomNav';
import TopHeader from './components/navigation/TopHeader';
import MaintenanceScreen from './components/maintenance/MaintenanceScreen';
import BannedScreen from './components/maintenance/BannedScreen';
import LoadingScreen from './components/ui/LoadingScreen';
import { hasAnyAdminPanelAccess } from '@/lib/permissions';
import { usePWANotifications } from './hooks/usePWANotifications';
import AdminBanner from './components/ui/AdminBanner';

const noLayoutPages = ['Website', 'Login', 'Signup', 'ResetPassword'];
const adminPages = [
  'AdminDashboard', 'AdminTournaments', 'AdminUsers', 'AdminWithdrawals',
  'AdminChats', 'AdminBroadcast', 'AdminSettings', 'AdminPaymentSettings',
  'AdminCertificates', 'AdminDeposits', 'AdminAchievements',
  'AdminEvents', 'AdminForms', 'AdminFlashSale', 'AdminAnalytics',
  'AdminPromotion', 'PromotionTasks',
  'AdminWarnings', 'AdminWarningAppeals', 'MyWarnings',
  'AdminAnnouncements', 'Announcements',
  'AdminAntiCheat', 'AdminDisputes', 'AdminPolls',
  'TournamentBracket', 'MatchProofSubmission',
  'DisputeResolution', 'PrizeHistory', 'ReferralLeaderboard', 'Polls',
  'RolePanel', 'VIPPanel', 'TeamChat', 'VIPSupport',
  'PaymentPanel', 'VIPZonePanel', 'ModerationPanel', 'TechnicalPanel',
  'CommunityPanel', 'VIPTournamentPanel', 'TeamPanel',
];

export default function Layout({ children, currentPageName }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isBanned, setIsBanned] = useState(false);

  const { requestPermission, setupDailyReminders, permission } = usePWANotifications();

  // Request notification permission after user loads (with small delay so UI is ready)
  useEffect(() => {
    if (user && permission === 'default') {
      const timer = setTimeout(async () => {
        const result = await requestPermission();
        if (result === 'granted') {
          await setupDailyReminders();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
    if (user && permission === 'granted') {
      setupDailyReminders();
    }
  }, [user, permission]);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    const handleMaintenance = () => {
      // Don't lock out staff
      if (user && hasAnyAdminPanelAccess(user)) return;
      setIsMaintenanceMode(true);
    };

    window.addEventListener('SYSTEM_MAINTENANCE', handleMaintenance);
    return () => window.removeEventListener('SYSTEM_MAINTENANCE', handleMaintenance);
  }, [user]);

  const initApp = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      if (!currentUser) {
        apiClient.auth.redirectToLogin(window.location.href);
        return;
      }
      setUser(currentUser);

      // We will also check profile username
      // Load profile
      let profileData = null;
      const profiles = await apiClient.entities.UserProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) {
        profileData = profiles[0];
        
        // Check if banned
        if (profileData.is_banned) {
          setIsBanned(true);
          setLoading(false);
          return;
        }
      } else {
        // Create new profile with referral code
        const refCode = localStorage.getItem('referralCode');
        const generateReferralCode = (email) => {
          return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() + 
                 Math.random().toString(36).substring(2, 6).toUpperCase();
        };
        const newReferralCode = generateReferralCode(currentUser.email);
        
        profileData = await apiClient.entities.UserProfile.create({
          user_id: currentUser.id,
          user_email: currentUser.email,
          username: currentUser.full_name || 'Player',
          referral_code: newReferralCode,
          referred_by: refCode || '',
          level: 1,
          xp: 0,
          rank: 'bronze'
        });

        // Remove localStorage ref to prevent re-using
        localStorage.removeItem('referralCode');

        // Send welcome notification
        await apiClient.entities.Notification.create({
          user_id: currentUser.id,
          user_email: currentUser.email,
          title: 'Welcome to Fire Arena Max!',
          message: 'Your profile has been created successfully. Complete your profile and start dominating!',
          type: 'system'
        });
      }
      setProfile(profileData);
      
      // Load wallet
      const wallets = await apiClient.entities.Wallet.filter({ user_email: currentUser.email });
      if (wallets.length > 0) {
        setWallet(wallets[0]);
      } else {
        const newWallet = await apiClient.entities.Wallet.create({
          user_id: currentUser.id,
          user_email: currentUser.email,
          balance: 0,
          bonus_balance: 0
        });
        setWallet(newWallet);
      }

      // Load settings
      const allSettings = await apiClient.entities.AppSettings.list();
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
        
        // Check maintenance mode — OWNER email always bypasses
        if (allSettings[0].maintenance_mode && !hasAnyAdminPanelAccess(currentUser)) {
          setIsMaintenanceMode(true);
        }
      }

    } catch (error) {
      console.error('Error initializing app:', error);
      // Redirect to login for auth/token errors
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('auth') || msg.includes('401') || msg.includes('login') || msg.includes('404') || msg.includes('token') || error?.status === 401 || error?.status === 404) {
        apiClient.auth.redirectToLogin(window.location.href);
      }
      return;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Starting Fire Arena..." />;
  }

  // Show banned screen
  if (isBanned && profile) {
    return <BannedScreen reason={profile.ban_reason} bannedAt={profile.banned_at} />;
  }

  // Show maintenance screen (skip for staff)
  if (isMaintenanceMode) {
    return (
      <MaintenanceScreen 
        message={settings?.maintenance_message} 
        endTime={settings?.maintenance_end_time}
      />
    );
  }

  // No layout for certain pages
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-slate-950">
        {children}
      </div>
    );
  }

  // Admin pages layout
  if (adminPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-slate-950 safe-area-pt" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>
    );
  }

  // Main app layout
  return (
    <div className="bg-slate-950" style={{ minHeight: '100dvh', overflowX: 'clip' }}>
{/* Daily Wheel removed */}
      <style>{`
        :root {
          --safe-area-inset-top: env(safe-area-inset-top);
          --safe-area-inset-bottom: env(safe-area-inset-bottom);
        }
        .safe-area-pt {
          padding-top: max(1rem, env(safe-area-inset-top));
        }
        .safe-area-pb {
          padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
      
      <TopHeader user={user} profile={profile} wallet={wallet} />
      <AdminBanner />
      
      <main>
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
}