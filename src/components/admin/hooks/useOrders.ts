import { useState, useEffect } from 'react';
import { supabase, Order } from '../../../lib/supabase';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'verify' | 'history'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*, products(name, images, image_url))')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as any);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setStatusLoading(orderId);

    const updateData: any = { status: newStatus };

    // Add timestamps based on status
    if (newStatus === 'shipped') updateData.shipped_at = new Date().toISOString();
    if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();
    if (newStatus === 'rejected') updateData.rejected_at = new Date().toISOString();

    // Automatic verification if moving to approved
    if (newStatus === 'approved') updateData.manual_payment_verified = true;

    await supabase.from('orders').update(updateData).eq('id', orderId);
    await fetchOrders();
    setStatusLoading(null);
  };

  const verifyPayment = async (orderId: string, valid: boolean) => {
    if (!confirm(valid ? "Confirm payment received?" : "Mark as Fake/Unpaid? This will reject the order.")) return;

    setStatusLoading(orderId);

    try {
      if (valid) {
        // 1. Find the pending payment record for this order
        const { data: pendingPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (pendingPayment) {
          // 2. Update payment status to 'verified' (this triggers our database function)
          await supabase
            .from('payments')
            .update({ 
              status: 'verified',
              verified_at: new Date().toISOString()
            })
            .eq('id', pendingPayment.id);
        }

        // 3. Update order verification flags
        await supabase
          .from('orders')
          .update({ 
            manual_payment_verified: true, 
            payment_verified_via: 'admin_manual'
          })
          .eq('id', orderId);

      } else {
        // Payment is fake/rejected
        await supabase
          .from('orders')
          .update({
            status: 'rejected',
            manual_payment_verified: false,
            rejection_reason: 'Payment verification failed'
          })
          .eq('id', orderId);

        // Also mark the payment as rejected
        await supabase
          .from('payments')
          .update({ status: 'rejected' })
          .eq('order_id', orderId)
          .eq('status', 'pending');
      }

      await fetchOrders();
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setStatusLoading(null);
    }
  };

  // Enhanced filtering logic
  const filteredOrders = orders.filter(order => {
    // 1. VIEW MODE FILTER
    if (viewMode === 'verify') {
       // Only show pending transfers or unverified manual payments
       return (order.payment_method === 'transfer' && !order.manual_payment_verified && order.status !== 'rejected');
    }

    if (viewMode === 'active') {
      if (!['pending', 'approved', 'shipped', 'pickup'].includes(order.status)) return false;
    } else if (viewMode === 'history') {
      if (!['delivered', 'rejected'].includes(order.status)) return false;
    }

    // 2. TEXT SEARCH FILTER
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = order.customer_name?.toLowerCase().includes(query);
      const matchesEmail = order.customer_email?.toLowerCase().includes(query);
      const matchesOrderId = order.id.toLowerCase().includes(query);
      const matchesRef = order.paystack_reference?.toLowerCase().includes(query);

      if (!matchesName && !matchesEmail && !matchesOrderId && !matchesRef) return false;
    }

    // 3. DATE FILTER
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      const orderDate = new Date(order.created_at).toDateString();
      if (today !== orderDate) return false;
    } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      const orderDate = new Date(order.created_at);
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);
      if (orderDate < start || orderDate > end) return false;
    }

    // 4. STATUS FILTER (Only for Active/History)
    if (viewMode !== 'verify' && statusFilter !== 'all' && order.status !== statusFilter) return false;

    return true;
  });

  return {
    // State and Data
    orders,
    filteredOrders,
    viewMode,
    selectedOrder,
    statusLoading,
    searchQuery,
    dateFilter,
    customDateRange,
    statusFilter,
    
    // Setters
    setViewMode,
    setSelectedOrder,
    setSearchQuery,
    setDateFilter,
    setCustomDateRange,
    setStatusFilter,
    
    // Actions
    updateStatus,
    verifyPayment,
    fetchOrders
  };
}
