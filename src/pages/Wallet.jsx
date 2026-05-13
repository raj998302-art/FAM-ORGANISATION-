import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History,
  Gift,
  Trophy,
  AlertCircle,
  Plus,
  Minus,
  Coins,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState(null);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);

      // Load wallet
      let wallets = await apiClient.entities.Wallet.filter({ user_email: currentUser.email });
      if (wallets.length === 0) {
        // Create wallet if doesn't exist
        const newWallet = await apiClient.entities.Wallet.create({
          user_id: currentUser.id,
          user_email: currentUser.email,
          balance: 0,
          bonus_balance: 0
        });
        wallets = [newWallet];
      }
      setWallet(wallets[0]);

      // Load transactions
      const txns = await apiClient.entities.Transaction.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );
      setTransactions(txns);

      // Load settings
      const allSettings = await apiClient.entities.AppSettings.list();
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const minWithdraw = settings?.min_withdrawal || 50;
    const maxWithdraw = settings?.max_withdrawal || 10000;

    if (amount < minWithdraw) {
      toast.error(`Minimum withdrawal is ₹${minWithdraw}`);
      return;
    }

    if (amount > maxWithdraw) {
      toast.error(`Maximum withdrawal is ₹${maxWithdraw}`);
      return;
    }

    if (amount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!paymentMethod || !paymentDetails) {
      toast.error('Please fill all payment details');
      return;
    }

    setWithdrawing(true);

    try {
      // Check for pending withdrawal first
      const pendingRequests = await apiClient.entities.WithdrawalRequest.filter({
        user_email: user.email,
        status: 'pending'
      }).catch(() => []);

      if (pendingRequests && pendingRequests.length > 0) {
        toast.error('You already have a pending withdrawal request. Please wait for it to be processed.');
        setWithdrawing(false);
        return;
      }

      // Single backend call — creates transaction, withdrawal request & notification
      await apiClient.integrations.Payment.Withdraw({
        amount,
        method: paymentMethod,
        details: paymentDetails
      });

      toast.success('Withdrawal request submitted! Admin will process within 24 hours.');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setPaymentMethod('');
      setPaymentDetails('');
      loadData();

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit request');
    } finally {
      setWithdrawing(false);
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesFilter = filter === 'all' ? true :
      filter === 'credit' ? txn.amount > 0 :
      txn.amount < 0;
    
    const matchesSearch = search === '' || 
      txn.description?.toLowerCase().includes(search.toLowerCase()) ||
      txn.type?.toLowerCase().includes(search.toLowerCase()) ||
      txn.amount?.toString().includes(search);
    
    return matchesFilter && matchesSearch;
  });

  const getTransactionIcon = (type, amount) => {
    if (type === 'prize_win' || type === 'referral' || type === 'bonus') {
      return <Gift className="w-5 h-5 text-green-400" />;
    }
    if (type === 'entry_fee') {
      return <Trophy className="w-5 h-5 text-orange-400" />;
    }
    if (amount > 0) {
      return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
    }
    return <ArrowUpRight className="w-5 h-5 text-red-400" />;
  };

  if (loading) {
    return <LoadingScreen message="Loading wallet..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-20 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <NeonText color="cyan" size="2xl" className="flex items-center gap-2">
          <WalletIcon className="w-7 h-7" />
          WALLET
        </NeonText>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlowCard glowColor="cyan" className="p-6 mb-6 relative overflow-hidden">
          {/* Background sparkles */}
          <div className="absolute inset-0">
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-cyan-500/20" />
            <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-cyan-500/20" />
          </div>

          <div className="relative">
            <p className="text-slate-400 text-sm mb-1">Available Balance</p>
            <motion.p
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              ₹{wallet?.balance?.toFixed(2) || '0.00'}
            </motion.p>

            {/* Bonus Balance */}
            {wallet?.bonus_balance > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">
                  + ₹{wallet.bonus_balance} Bonus
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-400">Total Won</p>
                <p className="text-lg font-bold text-green-400">
                  ₹{wallet?.total_won || 0}
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-400">Total Spent</p>
                <p className="text-lg font-bold text-orange-400">
                  ₹{wallet?.total_spent || 0}
                </p>
              </div>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <GamingButton
          variant="primary"
          size="lg"
          icon={Plus}
          onClick={() => setShowDeposit(true)}
          className="w-full"
        >
          Add Money
        </GamingButton>
        <GamingButton
          variant="secondary"
          size="lg"
          icon={Minus}
          onClick={() => setShowWithdraw(true)}
          className="w-full"
        >
          Withdraw
        </GamingButton>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <GlowCard glowColor="green" className="p-3 text-center">
          <ArrowDownLeft className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">Deposited</p>
          <p className="font-bold text-green-400">₹{wallet?.total_deposited || 0}</p>
        </GlowCard>
        <GlowCard glowColor="red" className="p-3 text-center">
          <ArrowUpRight className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">Withdrawn</p>
          <p className="font-bold text-red-400">₹{wallet?.total_withdrawn || 0}</p>
        </GlowCard>
        <GlowCard glowColor="gold" className="p-3 text-center">
          <Coins className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">Net P/L</p>
          <p className={`font-bold ${(wallet?.total_won || 0) - (wallet?.total_spent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{((wallet?.total_won || 0) - (wallet?.total_spent || 0))}
          </p>
        </GlowCard>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <NeonText color="cyan" size="lg" className="flex items-center gap-2">
            <History className="w-5 h-5" />
            TRANSACTION LEDGER
          </NeonText>
        </div>

        {/* Search Box */}
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white mb-4"
        />

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-4">
          <TabsList className="w-full bg-slate-900/50 border border-slate-700 p-1 h-auto grid grid-cols-3">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 py-2"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="credit" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-slate-400 py-2"
            >
              Credits
            </TabsTrigger>
            <TabsTrigger 
              value="debit" 
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-slate-400 py-2"
            >
              Debits
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transaction List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTransactions.map((txn, index) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlowCard 
                  glowColor={txn.amount > 0 ? 'green' : 'red'} 
                  className="p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        txn.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {getTransactionIcon(txn.type, txn.amount)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{txn.description || txn.type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-xs text-slate-400">
                          {safeFormat(txn.created_date || txn.createdAt || txn.timestamp || Date.now(), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        txn.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        txn.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        txn.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTransactions.length === 0 && (
            <GlowCard glowColor="cyan" className="p-8 text-center">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No transactions yet</p>
            </GlowCard>
          )}
        </div>
      </motion.div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Withdraw Funds</DialogTitle>
            <DialogDescription className="text-slate-400">
              Minimum ₹{settings?.min_withdrawal || 50} • Maximum ₹{settings?.max_withdrawal || 10000}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Amount (₹)</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-slate-800 border-slate-700 text-white text-lg"
              />
              <p className="text-xs text-slate-400">
                Available: ₹{wallet?.balance || 0}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="paytm">Paytm</SelectItem>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                {paymentMethod === 'bank_transfer' ? 'Account Details' : 'UPI ID / Number'}
              </Label>
              <Input
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                placeholder={paymentMethod === 'bank_transfer' ? 'Account Number, IFSC' : 'Enter UPI ID or phone number'}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <p className="text-xs text-yellow-400">
                  Withdrawals are processed within 24-48 hours. Make sure your payment details are correct.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowWithdraw(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant="secondary" 
              className="flex-1"
              loading={withdrawing}
              onClick={handleWithdraw}
            >
              Withdraw
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Money</DialogTitle>
            <DialogDescription className="text-slate-400">
              Contact admin to add funds to your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-10 h-10 text-yellow-400" />
            </div>
            <p className="text-slate-300 mb-4 font-semibold">
              1 Coin = ₹1 | Instant Credit
            </p>
            <Link to={createPageUrl('Deposit')}>
              <GamingButton
                variant="primary"
                onClick={() => setShowDeposit(false)}
              >
                Go to Deposit Page
              </GamingButton>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}