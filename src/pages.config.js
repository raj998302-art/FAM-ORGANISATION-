import Achievements from './pages/Achievements';
import AdminAchievements from './pages/AdminAchievements';
import AdminBroadcast from './pages/AdminBroadcast';
import AdminCertificates from './pages/AdminCertificates';
import AdminChats from './pages/AdminChats';
import AdminDashboard from './pages/AdminDashboard';
import AdminSettings from './pages/AdminSettings';
import AdminTournaments from './pages/AdminTournaments';
import AdminUsers from './pages/AdminUsers';
import AdminWithdrawals from './pages/AdminWithdrawals';
import Chat from './pages/Chat';
import ChatsHub from './pages/ChatsHub';
import Deposit from './pages/Deposit';
import DirectMessages from './pages/DirectMessages';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import MatchHistory from './pages/MatchHistory';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import PublicChat from './pages/PublicChat';
import SpinWheel from './pages/SpinWheel';
import Teams from './pages/Teams';
import TournamentDetails from './pages/TournamentDetails';
import Tournaments from './pages/Tournaments';
import TrophyRoom from './pages/TrophyRoom';
import Wallet from './pages/Wallet';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import AdminPaymentSettings from './pages/AdminPaymentSettings';
import VIPPlans from './pages/VIPPlans';
import VIPPanel from './pages/VIPPanel';
import RolePanel from './pages/RolePanel';
import TeamChat from './pages/TeamChat';
import AdminDeposits from './pages/AdminDeposits';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PaymentPanel from './pages/PaymentPanel';
import VIPZonePanel from './pages/VIPZonePanel';
import ModerationPanel from './pages/ModerationPanel';
import TechnicalPanel from './pages/TechnicalPanel';
import CommunityPanel from './pages/CommunityPanel';
import VIPChat from './pages/VIPChat';
import VIPTournaments from './pages/VIPTournaments';
import VIPTournamentPanel from './pages/VIPTournamentPanel';
import TeamPanel from './pages/TeamPanel';
import VIPSupport from './pages/VIPSupport';
import ResetPassword from './pages/ResetPassword';
import DailyRewards from './pages/DailyRewards';
import Store from './pages/Store';
import SeasonPass from './pages/SeasonPass';
import GiftCoins from './pages/GiftCoins';
import Missions from './pages/Missions';
import Predictions from './pages/Predictions';
import ReferralHub from './pages/ReferralHub';
import FlashSale from './pages/FlashSale';
import HowItWorks from './pages/HowItWorks';
import Forms from './pages/Forms';
import AdminForms from './pages/AdminForms';
import AdminFlashSale from './pages/AdminFlashSale';
import AdminAnalytics from './pages/AdminAnalytics';
import PromotionTasks from './pages/PromotionTasks';
import AdminPromotion from './pages/AdminPromotion';
import AdminWarnings from './pages/AdminWarnings';
import MyWarnings from './pages/MyWarnings';
import AdminWarningAppeals from './pages/AdminWarningAppeals';
import Announcements from './pages/Announcements';
import AdminAnnouncements from './pages/AdminAnnouncements';
import TournamentBracket from './pages/TournamentBracket';
import MatchProofSubmission from './pages/MatchProofSubmission';
import AdminAntiCheat from './pages/AdminAntiCheat';
import DisputeResolution from './pages/DisputeResolution';
import AdminDisputes from './pages/AdminDisputes';
import PrizeHistory from './pages/PrizeHistory';
import ReferralLeaderboard from './pages/ReferralLeaderboard';
import AdminPolls from './pages/AdminPolls';
import Polls from './pages/Polls';
import AdminEvents from './pages/AdminEvents';
import __Layout from './Layout.jsx';

export const PAGES = {
    // Normal Pages
    "Achievements": Achievements,
    "Chat": Chat,
    "ChatsHub": ChatsHub,
    "Deposit": Deposit,
    "DirectMessages": DirectMessages,
    "FAQ": FAQ,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "MatchHistory": MatchHistory,
    "Notifications": Notifications,
    "Profile": Profile,
    "PublicChat": PublicChat,
    "SpinWheel": SpinWheel,
    "Teams": Teams,
    "TournamentDetails": TournamentDetails,
    "Tournaments": Tournaments,
    "TrophyRoom": TrophyRoom,
    "Wallet": Wallet,
    "Events": Events,
    "EventDetails": EventDetails,
    "VIPPlans": VIPPlans,
    "VIPPanel": VIPPanel,
    "RolePanel": RolePanel,
    "TeamChat": TeamChat,
    "Login": Login,
    "Signup": Signup,

    // Legacy Admin Paths
    "AdminBroadcast": AdminBroadcast,
    "AdminCertificates": AdminCertificates,
    "AdminChats": AdminChats,
    "AdminDashboard": AdminDashboard,
    "AdminSettings": AdminSettings,
    "AdminTournaments": AdminTournaments,
    "AdminUsers": AdminUsers,
    "AdminWithdrawals": AdminWithdrawals,
    "AdminPaymentSettings": AdminPaymentSettings,
    "AdminDeposits": AdminDeposits,

    "VIPChat": VIPChat,
    "VIPTournaments": VIPTournaments,
    "VIPSupport": VIPSupport,
    "ResetPassword": ResetPassword,
    "DailyRewards": DailyRewards,
    "Store": Store,
    "SeasonPass": SeasonPass,
    "GiftCoins": GiftCoins,
    "Missions": Missions,
    "Predictions": Predictions,
    "ReferralHub": ReferralHub,
    "FlashSale": FlashSale,
    "HowItWorks": HowItWorks,
    "Forms": Forms,
    "AdminForms": AdminForms,
    "AdminEvents": AdminEvents,
    "AdminFlashSale": AdminFlashSale,
    "AdminAnalytics": AdminAnalytics,
    "PromotionTasks": PromotionTasks,
    "AdminPromotion": AdminPromotion,
    "AdminWarnings": AdminWarnings,
    "MyWarnings": MyWarnings,
    "AdminWarningAppeals": AdminWarningAppeals,
    "Announcements": Announcements,
    "AdminAnnouncements": AdminAnnouncements,
    "TournamentBracket": TournamentBracket,
    "MatchProofSubmission": MatchProofSubmission,
    "AdminAntiCheat": AdminAntiCheat,
    "DisputeResolution": DisputeResolution,
    "AdminDisputes": AdminDisputes,
    "PrizeHistory": PrizeHistory,
    "ReferralLeaderboard": ReferralLeaderboard,
    "AdminPolls": AdminPolls,
    "Polls": Polls,
    "PaymentPanel": PaymentPanel,
    "VIPZonePanel": VIPZonePanel,
    "ModerationPanel": ModerationPanel,
    "TechnicalPanel": TechnicalPanel,
    "CommunityPanel": CommunityPanel,
    "VIPTournamentPanel": VIPTournamentPanel,
    "TeamPanel": TeamPanel,

    // 🔥 NEW PANEL SYSTEM — each panel key routes to its dedicated page
    "master_panel": AdminDashboard,
    "admin_panel": AdminUsers,
    "payment_panel": PaymentPanel,
    "tournament_panel": AdminTournaments,
    "vip_tournament_panel": VIPTournamentPanel,
    "forms_panel": AdminForms,
    "technical_panel": TechnicalPanel,
    "team_panel": TeamPanel,
    "achievement_panel": AdminAchievements,
    "AdminAchievements": AdminAchievements,
    "vip_zone_panel": VIPZonePanel,
    "community_panel": CommunityPanel,
    "moderation_panel": ModerationPanel,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};