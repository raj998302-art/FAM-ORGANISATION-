import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
const safeFormat = (v,f='MMM d, h:mm a') => { try { const d=new Date(v); if(!v||isNaN(d.getTime())) return '—'; return format(d,f); } catch { return '—'; } };
import { 
  Wallet, 
  ChevronLeft, 
  Check, 
  X, 
  User,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import GlowCard from '../components/ui/GlowCard';
import NeonText from '../components/ui/NeonText';
import GamingButton from '../components/ui/GamingButton';
import LoadingScreen from '../components/ui/LoadingScreen';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { hasPaymentAccess } from '@/lib/roles';

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  const checkAdmin = async () => {
    const user = await apiClient.auth.me();
    if (!hasPaymentAccess(user)) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    try {
      const data = await apiClient.entities.WithdrawalRequest.list('-created_date', 200);
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    setProcessing(true);
    try {
      const currentUser = await apiClient.auth.me();

      // Update request
      await apiClient.entities.WithdrawalRequest.update(request.id, {
        status: 'approved',
        processed_by: currentUser.email,
        processed_at: new Date().toISOString()
      });

      // Update wallet
      const wallets = await apiClient.entities.Wallet.filter({ user_email: request.user_email });
      if (wallets.length > 0) {
        await apiClient.entities.Wallet.update(wallets[0].id, {
          total_withdrawn: (wallets[0].total_withdrawn || 0) + request.amount
        });
      }

      // Update transaction
      const transactions = await apiClient.entities.Transaction.filter({
        user_email: request.user_email,
        type: 'withdrawal',
        status: 'pending'
      });
      if (transactions.length > 0) {
        await apiClient.entities.Transaction.update(transactions[0].id, {
          status: 'completed'
        });
      }

      // Send notification
      await apiClient.entities.Notification.create({
        user_id: request.user_id,
        user_email: request.user_email,
        title: 'Withdrawal Approved',
        message: `Your withdrawal of ₹${request.amount} has been approved and processed.`,
        type: 'withdrawal'
      });

      toast.success('Withdrawal approved');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const currentUser = await apiClient.auth.me();

      // Update request
      await apiClient.entities.WithdrawalRequest.update(selectedRequest.id, {
        status: 'rejected',
        admin_note: rejectReason,
        processed_by: currentUser.email,
        processed_at: new Date().toISOString()
      });

      // Refund to wallet
      const wallets = await apiClient.entities.Wallet.filter({ user_email: selectedRequest.user_email });
      if (wallets.length > 0) {
        await apiClient.entities.Wallet.update(wallets[0].id, {
          balance: wallets[0].balance + selectedRequest.amount
        });
      }

      // Update transaction
      const transactions = await apiClient.entities.Transaction.filter({
        user_email: selectedRequest.user_email,
        type: 'withdrawal',
        status: 'pending'
      });
      if (transactions.length > 0) {
        await apiClient.entities.Transaction.update(transactions[0].id, {
          status: 'rejected'
        });
      }

      // Create refund transaction
      await apiClient.entities.Transaction.create({
        user_id: selectedRequest.user_id,
        user_email: selectedRequest.user_email,
        type: 'refund',
        amount: selectedRequest.amount,
        status: 'completed',
        description: `Withdrawal rejected: ${rejectReason || 'Request rejected by admin'}`
      });

      // Send notification
      await apiClient.entities.Notification.create({
        user_id: selectedRequest.user_id,
        user_email: selectedRequest.user_email,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of ₹${selectedRequest.amount} was rejected. Reason: ${rejectReason || 'Not specified'}. Amount has been refunded.`,
        type: 'withdrawal'
      });

      toast.success('Withdrawal rejected and refunded');
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedRequest(null);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return <LoadingScreen message="Loading withdrawals..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(createPageUrl('AdminDashboard'))} className="p-2">
          <ChevronLeft className="w-6 h-6 text-slate-400" />
        </button>
        <div>
          <NeonText color="green" size="2xl" className="flex items-center gap-2">
            <Wallet className="w-7 h-7" />
            WITHDRAWALS
          </NeonText>
          {pendingCount > 0 && (
            <p className="text-sm text-orange-400">{pendingCount} pending requests</p>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="w-full bg-slate-900/50 border border-slate-700 p-1 h-auto grid grid-cols-4">
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-slate-400 py-2"
          >
            Pending
          </TabsTrigger>
          <TabsTrigger 
            value="approved" 
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 text-slate-400 py-2"
          >
            Approved
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-slate-400 py-2"
          >
            Rejected
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 py-2"
          >
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlowCard 
              glowColor={
                request.status === 'pending' ? 'orange' :
                request.status === 'approved' ? 'green' :
                'red'
              } 
              className="p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      request.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                      request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">₹{request.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">{request.payment_method?.toUpperCase()}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {safeFormat(request.created_date, 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-white">{request.username || 'User'}</span>
                </div>
                <p className="text-xs text-slate-400">{request.user_email}</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300 break-all">{request.payment_details}</span>
                </div>
              </div>

              {request.admin_note && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg mb-3">
                  <p className="text-xs text-red-400">Note: {request.admin_note}</p>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <GamingButton
                    variant="success"
                    size="sm"
                    className="flex-1"
                    icon={Check}
                    loading={processing}
                    onClick={() => handleApprove(request)}
                  >
                    Approve
                  </GamingButton>
                  <GamingButton
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    icon={X}
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRejectDialog(true);
                    }}
                  >
                    Reject
                  </GamingButton>
                </div>
              )}

              {request.processed_by && (
                <p className="text-xs text-slate-500 mt-2">
                  Processed by: {request.processed_by}
                </p>
              )}
            </GlowCard>
          </motion.div>
        ))}

        {filteredRequests.length === 0 && (
          <GlowCard glowColor="cyan" className="p-8 text-center">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No {filter !== 'all' ? filter : ''} withdrawal requests</p>
          </GlowCard>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Reject Withdrawal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <p className="text-sm text-red-400">
                  Amount will be refunded to user's wallet.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Rejection Reason</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="e.g., Invalid payment details"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <GamingButton 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </GamingButton>
            <GamingButton 
              variant="danger" 
              className="flex-1"
              loading={processing}
              onClick={handleReject}
              icon={X}
            >
              Reject & Refund
            </GamingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}