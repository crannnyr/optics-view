import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { sendEmail } from '../../../lib/email';

export type ViewMode = 'active' | 'verify' | 'history' | 'analytics' | 'withdrawals';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function useOrders() {
  const [orders, setOrders]           = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [viewMode, setViewMode]       = useState<ViewMode>('active');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const [searchQuery, setSearchQuery]       = useState('');
  const [dateFilter, setDateFilter]         = useState<'all' | 'today' | 'week' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter]     = useState('all');

  useEffect(() => { fetchOrders(); fetchWithdrawals(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*, products(name, images, image_url, supplier))')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*, retailer:profiles!retailer_id(store_name, email, store_slug)')
      .order('created_at', { ascending: false });
    if (data) setWithdrawals(data);
  };

  const writeNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    orderId?: string
  ) => {
    await supabase.from('notifications').insert({ user_id: userId, title, message, type, order_id: orderId ?? null });
  };

  const callEdgeFunction = async (fnName: string, body: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || `${fnName} failed`);
    return result;
  };

  const shippingAddress = (order: any) =>
    `${order.shipping_city}, ${order.shipping_state} · ${order.shipping_area}`;

  // ── Status Updates ────────────────────────────────────────

  const updateStatus = async (orderId: string, newStatus: string) => {
    setStatusLoading(orderId);
    const order = orders.find(o => o.id === orderId);

    try {
      if (newStatus === 'shipped') {
        try {
          await callEdgeFunction('credit-shipped-order', { order_id: orderId });
        } catch (err) {
          console.error('Edge function error, falling back:', err);
          await supabase.from('orders').update({
            status: 'shipped',
            shipped_at: new Date().toISOString(),
          }).eq('id', orderId);
        }

        if (order?.user_id) {
          await writeNotification(order.user_id, 'Order Shipped!',
            'Your order is on its way. Expected delivery in 7 business days.', 'success', orderId);
        }

        // Email customer
        if (order?.customer_email) {
          sendEmail({
            type: 'order_shipped',
            to_email: order.customer_email,
            to_name: order.customer_name,
            data: {
              customer_name: order.customer_name,
              order_id: order.id,
              shipping_address: shippingAddress(order),
            },
          });
        }

      } else if (newStatus === 'delivered') {
        await supabase.from('orders').update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        }).eq('id', orderId);

        if (order?.user_id) {
          await writeNotification(order.user_id, 'Order Delivered!',
            'Your order has been delivered. Enjoy your purchase!', 'success', orderId);
        }

        // Email customer
        if (order?.customer_email) {
          sendEmail({
            type: 'order_delivered',
            to_email: order.customer_email,
            to_name: order.customer_name,
            data: {
              customer_name: order.customer_name,
              order_id: order.id,
            },
          });
        }

      } else if (newStatus === 'rejected') {
        await supabase.from('orders').update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: 'Rejected by admin',
        }).eq('id', orderId);

        if (order?.user_id) {
          await writeNotification(order.user_id, 'Order Rejected',
            'Your order has been rejected. Please contact support for assistance.', 'error', orderId);
        }

        // Email customer
        if (order?.customer_email) {
          sendEmail({
            type: 'order_status_update',
            to_email: order.customer_email,
            to_name: order.customer_name,
            data: {
              customer_name: order.customer_name,
              order_id: order.id,
              status: 'rejected',
            },
          });
        }

      } else if (newStatus === 'approved') {
        await supabase.from('orders').update({
          status: 'approved',
          manual_payment_verified: true,
          payment_verified_via: 'admin_manual',
          verified_at: new Date().toISOString(),
        }).eq('id', orderId);

        if (order?.user_id) {
          await writeNotification(order.user_id, 'Order Approved!',
            'Your payment has been verified and your order is approved.', 'success', orderId);
        }

        // Email customer
        if (order?.customer_email) {
          sendEmail({
            type: 'order_status_update',
            to_email: order.customer_email,
            to_name: order.customer_name,
            data: {
              customer_name: order.customer_name,
              order_id: order.id,
              status: 'approved',
            },
          });
        }

      } else {
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      }
    } catch (err) {
      console.error('updateStatus error:', err);
      alert('Failed to update status. Please try again.');
    }

    await fetchOrders();
    setStatusLoading(null);
  };

  const verifyPayment = async (orderId: string, valid: boolean) => {
    if (!confirm(valid
      ? 'Confirm payment received? Order will be approved.'
      : 'Reject this order as unpaid/fake?'
    )) return;

    setStatusLoading(orderId);
    if (valid) {
      await updateStatus(orderId, 'approved');
    } else {
      await updateStatus(orderId, 'rejected');
    }
    setStatusLoading(null);
  };

  const markUnavailable = async (orderId: string) => {
    if (!confirm('Mark as unavailable? A refund code will be generated for the customer.')) return;
    setStatusLoading(orderId);

    const order = orders.find(o => o.id === orderId);
    const refundCode = `RFD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const refundAmount = Math.max(0, (order?.total_amount || 0) - 1000);

    await supabase.from('orders').update({
      status: 'unavailable',
      refund_code: refundCode,
      refund_amount: refundAmount,
    }).eq('id', orderId);

    if (order?.user_id) {
      await writeNotification(
        order.user_id,
        'Product No Longer Available',
        `Unfortunately a product in your order is no longer available. Your refund code is ${refundCode}.`,
        'warning',
        orderId
      );
    }

    // Email customer
    if (order?.customer_email) {
      sendEmail({
        type: 'order_status_update',
        to_email: order.customer_email,
        to_name: order.customer_name,
        data: {
          customer_name: order.customer_name,
          order_id: order.id,
          status: 'unavailable',
        },
      });
    }

    await fetchOrders();
    setStatusLoading(null);
  };

  const markRefunded = async (orderId: string) => {
    if (!confirm('Confirm you have sent the refund to the customer?')) return;
    setStatusLoading(orderId);

    const order = orders.find(o => o.id === orderId);
    await supabase.from('orders').update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    }).eq('id', orderId);

    if (order?.user_id) {
      await writeNotification(
        order.user_id,
        'Refund Processed',
        `Your refund of ₦${(order?.refund_amount || 0).toLocaleString()} has been sent.`,
        'success',
        orderId
      );
    }

    // Email customer
    if (order?.customer_email) {
      sendEmail({
        type: 'order_status_update',
        to_email: order.customer_email,
        to_name: order.customer_name,
        data: {
          customer_name: order.customer_name,
          order_id: order.id,
          status: 'refunded',
        },
      });
    }

    await fetchOrders();
    setStatusLoading(null);
  };

  const processWithdrawal = async (
    withdrawalId: string,
    action: 'approve' | 'reject',
    adminNote?: string
  ) => {
    setStatusLoading(withdrawalId);
    try {
      await callEdgeFunction('approve-withdrawal', { withdrawal_id: withdrawalId, action, admin_note: adminNote });

      // Email retailer if approved
      if (action === 'approve') {
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal?.retailer?.email) {
          sendEmail({
            type: 'withdrawal_processed',
            to_email: withdrawal.retailer.email,
            to_name: withdrawal.retailer.store_name,
            data: {
              store_name: withdrawal.retailer.store_name,
              amount: withdrawal.amount,
              bank_name: withdrawal.bank_name,
              account_number: withdrawal.account_number,
              new_balance: 0, // will update when balance API is available
            },
          });
        }
      }

      await fetchWithdrawals();
    } catch (err) {
      console.error('Withdrawal error:', err);
      alert('Failed to process withdrawal. Try again.');
    }
    setStatusLoading(null);
  };

  // ── Filtering ─────────────────────────────────────────────

  // An order made up entirely of vendor-supplied items is managed via the
  // separate Vendor Orders tab (per-vendor approval + shipping deadline),
  // not here — so it shouldn't clutter admin's own fulfillment queue.
  // Mixed orders (some own items, some vendor items) still show here,
  // since admin still has their own items to ship — the vendor's portion
  // is just tracked separately.
  const isFullyVendorOrder = (order: any) =>
    order.items?.length > 0 && order.items.every((item: any) => item.products?.supplier === 'vendor');

  const filteredOrders = orders.filter(order => {
    if (['active', 'history', 'verify'].includes(viewMode) && isFullyVendorOrder(order)) return false;

    if (viewMode === 'verify') {
      return order.payment_method === 'transfer'
        && !order.manual_payment_verified
        && !['rejected', 'refunded'].includes(order.status);
    }
    if (viewMode === 'active') {
      if (!['pending', 'approved', 'shipped', 'pickup'].includes(order.status)) return false;
    } else if (viewMode === 'history') {
      if (!['delivered', 'rejected', 'unavailable', 'refunded'].includes(order.status)) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !order.customer_name?.toLowerCase().includes(q) &&
        !order.customer_email?.toLowerCase().includes(q) &&
        !order.id.toLowerCase().includes(q) &&
        !order.paystack_reference?.toLowerCase().includes(q)
      ) return false;
    }

    if (dateFilter === 'today') {
      if (new Date(order.created_at).toDateString() !== new Date().toDateString()) return false;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(order.created_at) < weekAgo) return false;
    } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      const d = new Date(order.created_at);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);
      if (d < new Date(customDateRange.start) || d > end) return false;
    }

    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    return true;
  });

  const unverifiedCount = orders.filter(
    o => o.payment_method === 'transfer' && !o.manual_payment_verified && !['rejected', 'refunded'].includes(o.status)
  ).length;

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

  return {
    orders,
    filteredOrders,
    withdrawals,
    viewMode, setViewMode,
    selectedOrder, setSelectedOrder,
    statusLoading,
    searchQuery, setSearchQuery,
    dateFilter, setDateFilter,
    customDateRange, setCustomDateRange,
    statusFilter, setStatusFilter,
    unverifiedCount,
    pendingWithdrawals,
    updateStatus,
    verifyPayment,
    markUnavailable,
    markRefunded,
    processWithdrawal,
    fetchOrders,
  };
}

// An order has vendor items if at least one line item is vendor-supplied —
// used by OrdersList to badge mixed orders (fully-vendor orders never reach
// the list at all, filtered out above).
export const hasVendorItems = (order: any) =>
  !!order.items?.some((item: any) => item.products?.supplier === 'vendor');
