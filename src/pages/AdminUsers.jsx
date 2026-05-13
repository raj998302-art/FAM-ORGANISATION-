import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Ban, 
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Wallet,
  Trophy,
  MoreVertical,
  Plus,
  Minus,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLES_BY_GROUP, canAssignRoles, canBanUsers } from '@/lib/roles';
import RoleBadge from '../components/ui/RoleBadge';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [wallets, setWallets] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletAction, setWalletAction] = useState('credit');
  const [banReason, setBanReason] = useState('');
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  const checkAdmin = async () => {
    const user = await apiClient.auth.me();
    setCurrentUser(user);
    if (!user.panels.includes('admin_panel') && !user.panels.includes('master_panel')) {
      navigate(createPageUrl('RolePanel'));
    }
  };

  const loadData = async () => {
    try {
      const [allProfiles, allWallets, users] = await Promise.all([
        apiClient.entities.UserProfile.list('-created_date', 200),
        apiClient.entities.Wallet.list(),
        apiClient.admin.getUsers()
      ]);
      
      setProfiles(allProfiles);
      setAllUsers(users || []);
      
      const walletMap = {};
      allWallets.forEach(w => {
        walletMap[w.user_email] = w;
      });
      setWallets(walletMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const currentUser = await apiClient.auth.me();
      
      await apiClient.entities.UserProfile.update(selectedUser.id, {
        is_banned: true,
        ban_reason: banReason,
        banned_at: new Date().toISOString(),
        banned_by: currentUser.email
      });

      await apiClient.entities.Notification.create({
        user_id: selectedUser.user_id,
        user_email: selectedUser.user_email,
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${banReason || 'Violation of terms'}`,
        type: 'system'
      });

      toast.success('User banned');
      setShowBanDialog(false);
      setBanReason('');
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to ban user');
    } finally {
      setSaving(false);
    }
  };

  const handleUnbanUser = async (profile) => {
    try {
      await apiClient.entities.UserProfile.update(profile.id, {
        is_banned: false,
        ban_reason: null,
        banned_at: null,
        banned_by: null
      });

      await apiClient.entities.Notification.create({
        user_id: profile.user_id,
        user_email: profile.user_email,
        title: 'Account Restored',
        message: 'Your account has been restored. You can now access all features.',
        type: 'system'
      });

      toast.success('User unbanned');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to unban');
    }
  };

  const handleWalletAction = async () => {
    if (!selectedUser || !walletAmount) return;

    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      const wallet = wallets[selectedUser.user_email];
      if (!wallet) {
        toast.error('Wallet not found');
        return;
      }

      const currentUser = await apiClient.auth.me();
      const newBalance = walletAction === 'credit' 
        ? wallet.balance + amount 
        : wallet.balance - amount;

      if (newBalance < 0) {
        toast.error('Insufficient balance for debit');
        setSaving(false);
        return;
      }

      await apiClient.entities.Wallet.update(wallet.id, {
        balance: newBalance
      });

      await apiClient.entities.Transaction.create({
        user_id: selectedUser.user_id,
        user_email: selectedUser.user_email,
        type: walletAction === 'credit' ? 'admin_credit' : 'admin_debit',
        amount: walletAction === 'credit' ? amount : -amount,
        status: 'completed',
        description: `${walletAction === 'credit' ? 'Credited' : 'Debited'} by admin`,
        processed_by: currentUser.email
      });

      await apiClient.entities.Notification.create({
        user_id: selectedUser.user_id,
        user_email: selectedUser.user_email,
        title: walletAction === 'credit' ? 'Funds Added' : 'Funds Deducted',
        message: `₹${amount} has been ${walletAction === 'credit' ? 'added to' : 'deducted from'} your wallet by admin.`,
        type: 'system'
      });

      toast.success(`₹${amount} ${walletAction}ed successfully`);
      setShowWalletDialog(false);
      setWalletAmount('');
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update wallet');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }
    // Only owner/co_owner can assign roles
    if (!canAssignRoles(currentUser)) {
      toast.error('Only Owner / Co-Owner can assign roles');
      return;
    }
    setSaving(true);
    try {
      // Find the User record to update roles
      const userRecord = allUsers.find(u => u.email === selectedUser.user_email);
      
      if (userRecord) {
        await apiClient.admin.assignRole(userRecord._id, selectedRoles);
      }
      
      await apiClient.entities.Notification.create({
        user_id: selectedUser.user_id,
        user_email: selectedUser.user_email,
        title: '🎖️ Roles Updated',
        message: `Your roles have been updated by admin.`,
        type: 'system'
      });
      toast.success('Roles assigned successfully!');
      setShowRoleDialog(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to assign roles');
    } finally {
      setSaving(false);
    }
  };

  const getUserRolesArray = (userEmail) => {
    const userRecord = allUsers.find(u => u.email === userEmail);
    if (!userRecord) return ['player'];
    if (userRecord.roles && Array.isArray(userRecord.roles)) return userRecord.roles;
    if (userRecord.role) return [userRecord.role];
    return ['player'];
  };

  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      profile.username?.toLowerCase().includes(query) ||
      profile.user_email?.toLowerCase().includes(query) ||
      profile.ff_uid?.includes(query)
    );
  });

  if (loading) {
    return <LoadingScreen message="Loading users..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
          <Users className="w-7 h-7" />
          USERS ({profiles.length})
        </NeonText>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, email, or UID..."
            className="pl-10 bg-slate-900/50 border-slate-700 text-white h-12 rounded-xl"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredProfiles.map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <GlowCard 
              glowColor={profile.is_banned ? 'red' : 'cyan'} 
              className={`p-4 ${profile.is_banned ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="" 
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-400">
                        {profile.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{profile.username || 'Unknown'}</p>
                      {profile.is_banned && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">BANNED</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{profile.user_email}</p>
                    {profile.ff_uid && (
                      <p className="text-xs text-cyan-400 font-mono">UID: {profile.ff_uid}</p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-slate-800 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  {canAssignRoles(currentUser) && (
                    <DropdownMenuItem 
                      className="text-yellow-400 focus:bg-slate-700"
                      onClick={() => {
                        setSelectedUser(profile);
                        setSelectedRoles(getUserRolesArray(profile.user_email));
                        setShowRoleDialog(true);
                      }}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Assign Roles
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-slate-200 focus:bg-slate-700"
                    onClick={() => {
                      setSelectedUser(profile);
                      setWalletAction('credit');
                      setShowWalletDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2 text-green-400" />
                    Credit Wallet
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-slate-200 focus:bg-slate-700"
                    onClick={() => {
                      setSelectedUser(profile);
                      setWalletAction('debit');
                      setShowWalletDialog(true);
                    }}
                  >
                    <Minus className="w-4 h-4 mr-2 text-red-400" />
                    Debit Wallet
                  </DropdownMenuItem>
                  {canBanUsers(currentUser) && (
                    profile.is_banned ? (
                      <DropdownMenuItem 
                        className="text-green-400 focus:bg-slate-700"
                        onClick={() => handleUnbanUser(profile)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unban User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        className="text-red-400 focus:bg-slate-700"
                        onClick={() => {
                          setSelectedUser(profile);
                          setShowBanDialog(true);
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Ban User
                      </DropdownMenuItem>
                    )
                  )}
                  <DropdownMenuItem
                    className="text-orange-400 focus:bg-slate-700"
                    onClick={() => navigate(createPageUrl('AdminWarnings'))}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Manage Warnings
                  </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-2 mb-1 flex flex-wrap gap-1">
                {getUserRolesArray(profile.user_email).map(role => (
                   <RoleBadge key={role} role={role} size="xs" />
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Wallet className="w-3 h-3 text-yellow-400 mx-auto mb-1" />
                  <span className="text-slate-300">
                    ₹{wallets[profile.user_email]?.balance || 0}
                  </span>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Trophy className="w-3 h-3 text-green-400 mx-auto mb-1" />
                  <span className="text-slate-300">{profile.tournaments_won || 0} Wins</span>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">Lvl {profile.level || 1}</span>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300 capitalize">{profile.rank || 'bronze'}</span>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Wallet Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {walletAction === 'credit' ? 'Credit' : 'Debit'} Wallet
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-400">User</p>
              <p className="font-semibold text-white">{selectedUser?.username}</p>
              <p className="text-xs text-slate-400">{selectedUser?.user_email}</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-400">Current Balance</p>
              <p className="text-2xl font-bold text-cyan-400">
                ₹{wallets[selectedUser?.user_email]?.balance || 0}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Amount (₹)</Label>
              <Input
                type="number"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-lg"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowWalletDialog(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant={walletAction === 'credit' ? 'success' : 'danger'} 
              className="flex-1"
              loading={saving}
              onClick={handleWalletAction}
            >
              {walletAction === 'credit' ? 'Credit' : 'Debit'}
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Assign Roles
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-400">User</p>
              <p className="font-semibold text-white">{selectedUser?.username}</p>
              <p className="text-xs text-slate-400">{selectedUser?.user_email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Select Roles</Label>
              <div className="max-h-60 overflow-y-auto space-y-4 p-2 bg-slate-800/20 rounded-lg border border-slate-700/50">
                {Object.entries(ROLES_BY_GROUP).map(([group, rolesList]) => (
                  <div key={group} className="space-y-2">
                    <div className="text-xs text-slate-500 font-bold uppercase sticky top-0 bg-slate-900/90 py-1 z-10 backdrop-blur-md">
                      {group}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rolesList.map(r => {
                        const isSelected = selectedRoles.includes(r.value);
                        return (
                          <button
                            key={r.value}
                            onClick={() => {
                              setSelectedRoles(prev => 
                                isSelected 
                                  ? prev.filter(role => role !== r.value)
                                  : [...prev, r.value]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/50'
                            }`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <GamingButton variant="outline" className="flex-1" onClick={() => setShowRoleDialog(false)}>Cancel</GamingButton>
            <GamingButton variant="gold" className="flex-1" loading={saving} onClick={handleAssignRole} icon={Crown}>Assign Roles</GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Ban User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400">
                This will prevent {selectedUser?.username} from accessing the app.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Ban Reason</Label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter reason for ban..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowBanDialog(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant="danger" 
              className="flex-1"
              loading={saving}
              onClick={handleBanUser}
              icon={Ban}
            >
              Ban User
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}