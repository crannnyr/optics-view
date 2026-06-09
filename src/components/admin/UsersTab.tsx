import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../lib/email';
import {
  Search, Loader2, MessageCircle, Zap, RefreshCw
} from 'lucide-react';

interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_seen_at: string | null;
  role: string | null;
  store_name: string | null;
  order_count: number;
}

interface PendingOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  created_at: string;
  nudge_sent_at: string | null;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type MainTab = 'users' | 'nudge';

export default function UsersTab() {
  const [mainTab, setMainTab]             = useState<MainTab>('users');
  const [users, setUsers]                 = useState<AppUser[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [nudgeLoading, setNudgeLoading]   = useState(false);
  const [nudgingId, setNudgingId]         = useState<string | null>(null);
  const [search, setSearch]               = useState('');
  const [dateFilter, setDateFilter]       = useState<DateFilter>('all');
  const [customRange, setCustomRange]     = useState({ start: '', end: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadPendingOrders()]);
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, last_seen_at, role, store_name')
      .order('created_at', { ascending: false });

    if (!data) return;

    const { data: orderCounts } = await supabase
      .from('orders')
      .select('user_id')
      .not('user_id', 'is', null);

    const countMap = new Map<string, number>();
    for (const o of orderCounts || []) {
      countMap.set(o.user_id, (countMap.get(o.user_id) || 0) + 1);
    }

    setUsers(data.map(u => ({ ...u, order_count: countMap.get(u.id) || 0 })));
  };

  const loadPendingOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, total_amount, created_at, nudge_sent_at')
      .eq('payment_method', 'transfer')
      .eq('manual_payment_verified', false)
      .not('status', 'in', '("rejected","refunded","cancelled")')
      .order('created_at', { ascending: false });

    if (data) setPendingOrders(data);
  };

  // ── Nudge logic ───────────────────────────────────────────

  const canNudge = (order: PendingOrder) => {
    if (!order.nudge_sent_at) return true;
    return Date.now() - new Date(order.nudge_sent_at).getTime() > 24 * 60 * 60 * 1000;
  };

  const sendNudge = async (order: PendingOrder) => {
    if (!canNudge(order)) return;
    setNudgingId(order.id);

    try {
      await sendEmail({
        type: 'payment_nudge',
        to_email: order.customer_email,
        to_name: order.customer_name,
        data: {
          customer_name: order.customer_name,
          order_id: order.id,
          total_amount: order.total_amount,
        },
        bypass_limit: true,
      });

      await supabase
        .from('orders')
        .update({ nudge_sent_at: new Date().toISOString() })
        .eq('id', order.id);

      setPendingOrders(prev =>
        prev.map(o => o.id === order.id
          ? { ...o, nudge_sent_at: new Date().toISOString() }
          : o
        )
      );
    } catch (err) {
      console.error('Nudge failed:', err);
      alert('Failed to send nudge. Try again.');
    }

    setNudgingId(null);
  };

  const nudgeAll = async () => {
    const eligible = pendingOrders.filter(canNudge);
    if (eligible.length === 0) { alert('No eligible orders to nudge right now.'); return; }
    if (!confirm(`Send nudge to ${eligible.length} customer${eligible.length > 1 ? 's' : ''}?`)) return;

    setNudgeLoading(true);
    for (const order of eligible) await sendNudge(order);
    setNudgeLoading(false);
  };

  // ── Filtering ─────────────────────────────────────────────

  const filteredUsers = users.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      if (!u.email?.toLowerCase().includes(q) && !u.full_name?.toLowerCase().includes(q)) return false;
    }
    const joined = new Date(u.created_at);
    const now = new Date();
    if (dateFilter === 'today') {
      if (joined.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === 'week') {
      if (joined < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false;
    } else if (dateFilter === 'month') {
      if (joined < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return false;
    } else if (dateFilter === 'custom' && customRange.start && customRange.end) {
      const end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
      if (joined < new Date(customRange.start) || joined > end) return false;
    }
    return true;
  });

  const todayCount    = users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length;
  const activeToday   = users.filter(u => u.last_seen_at && new Date(u.last_seen_at).toDateString() === new Date().toDateString()).length;
  const nudgeEligible = pendingOrders.filter(canNudge).length;

  const formatDate  = (d: string) => new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const timeAgo     = (d: string | null) => {
    if (!d) return '—';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={22} className="animate-spin text-gray-300" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-light">Users</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {users.length} total
            {todayCount > 0 && <span className="ml-2 text-green-600 font-medium">· {todayCount} joined today 🎉</span>}
          </p>
        </div>
        <button onClick={loadAll} className="p-2 text-gray-400 hover:text-[#0d2818] transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',    value: users.length,    color: 'text-[#0d2818]' },
          { label: 'Joined Today',   value: todayCount,      color: 'text-green-600' },
          { label: 'Active Today',   value: activeToday,     color: 'text-blue-600' },
          { label: 'Awaiting Nudge', value: nudgeEligible,   color: nudgeEligible > 0 ? 'text-orange-500' : 'text-gray-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-light ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {([
          { key: 'users', label: `All Users (${users.length})` },
          { key: 'nudge', label: `Pending Payment (${pendingOrders.length})${nudgeEligible > 0 ? ` · ${nudgeEligible} to nudge` : ''}` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`px-5 py-3 text-xs uppercase tracking-wider transition-colors ${
              mainTab === t.key ? 'border-b-2 border-[#0d2818] text-[#0d2818] font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {mainTab === 'users' && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search name or email..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-gray-200 pl-8 pr-3 py-2 text-xs outline-none focus:border-[#0d2818] rounded w-52" />
            </div>
            <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
              {(['all','today','week','month','custom'] as const).map(f => (
                <button key={f} onClick={() => setDateFilter(f)}
                  className={`px-3 py-2 text-[10px] tracking-wider transition-colors capitalize ${
                    dateFilter === f ? 'bg-[#0d2818] text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'week' ? 'Week' : f === 'month' ? 'Month' : 'Custom'}
                </button>
              ))}
            </div>
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customRange.start}
                  onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))}
                  className="border border-gray-200 px-2 py-1.5 text-xs rounded outline-none focus:border-[#0d2818]" />
                <span className="text-xs text-gray-400">to</span>
                <input type="date" value={customRange.end}
                  onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))}
                  className="border border-gray-200 px-2 py-1.5 text-xs rounded outline-none focus:border-[#0d2818]" />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
              <div className="col-span-4">User</div>
              <div className="col-span-3">Joined</div>
              <div className="col-span-2">Last Seen</div>
              <div className="col-span-1 text-center">Orders</div>
              <div className="col-span-2">Role</div>
            </div>
            {filteredUsers.length === 0
              ? <div className="text-center py-12 text-xs text-gray-400">No users found</div>
              : (
                <div className="divide-y divide-gray-50">
                  {filteredUsers.map(user => {
                    const isNew    = new Date(user.created_at).toDateString() === new Date().toDateString();
                    const isActive = user.last_seen_at && new Date(user.last_seen_at).toDateString() === new Date().toDateString();
                    return (
                      <div key={user.id}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors ${isNew ? 'border-l-2 border-green-400' : ''}`}
                      >
                        <div className="col-span-4 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0d2818]/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-medium text-[#0d2818]">
                              {(user.full_name || user.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {user.full_name || '—'}
                              {isNew    && <span className="ml-1 text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">NEW</span>}
                              {isActive && <span className="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-[10px] text-gray-600">{formatDate(user.created_at)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400">{timeAgo(user.last_seen_at)}</p>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className={`text-xs font-medium ${user.order_count > 0 ? 'text-[#0d2818]' : 'text-gray-300'}`}>
                            {user.order_count}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            user.role === 'admin' ? 'bg-[#0d2818] text-white' :
                            user.role === 'retailer' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {user.role || 'customer'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </>
      )}

      {/* ── Nudge Tab ── */}
      {mainTab === 'nudge' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400">
              {pendingOrders.length} unverified transfer orders · {nudgeEligible} eligible to nudge
            </p>
            {nudgeEligible > 0 && (
              <button onClick={nudgeAll} disabled={nudgeLoading}
                className="flex items-center gap-2 bg-[#0d2818] text-white px-4 py-2 text-[10px] tracking-widest rounded hover:opacity-90 disabled:opacity-50"
              >
                {nudgeLoading ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                NUDGE ALL ({nudgeEligible})
              </button>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
              <div className="col-span-3">Customer</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-3">Order Date</div>
              <div className="col-span-2">Last Nudge</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            {pendingOrders.length === 0
              ? <div className="text-center py-12 text-xs text-gray-400">No pending payment orders</div>
              : (
                <div className="divide-y divide-gray-50">
                  {pendingOrders.map(order => {
                    const eligible  = canNudge(order);
                    const isSending = nudgingId === order.id;
                    const wasSent   = !!order.nudge_sent_at;
                    return (
                      <div key={order.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50">
                        <div className="col-span-3">
                          <p className="text-xs font-medium text-gray-800 truncate">{order.customer_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{order.customer_email}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-700">₦{Number(order.total_amount).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="col-span-3">
                          <p className="text-[10px] text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400">{timeAgo(order.nudge_sent_at)}</p>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button
                            onClick={() => sendNudge(order)}
                            disabled={!eligible || isSending}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider rounded transition-colors ${
                              isSending       ? 'bg-gray-100 text-gray-400' :
                              eligible        ? 'bg-[#0d2818] text-white hover:opacity-90' :
                                               'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isSending ? <Loader2 size={10} className="animate-spin" /> : <MessageCircle size={10} />}
                            {isSending ? 'Sending...' : !eligible ? 'Sent' : wasSent ? 'Re-nudge' : 'Nudge'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </>
      )}
    </div>
  );
}
