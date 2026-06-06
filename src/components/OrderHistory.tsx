import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, MapPin, Edit2, Package, Truck,
  CheckCircle, XCircle, Clock, AlertCircle, Loader2,
  AlertTriangle, RotateCcw, Store, WifiOff, RefreshCw
} from 'lucide-react';

interface Props { onBack: () => void; }

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  pending:     { color: 'bg-yellow-100 text-yellow-800',  icon: Clock,          label: 'Pending'     },
  approved:    { color: 'bg-blue-100 text-blue-800',      icon: CheckCircle,    label: 'Approved'    },
  shipped:     { color: 'bg-purple-100 text-purple-800',  icon: Truck,          label: 'Shipped'     },
  delivered:   { color: 'bg-green-100 text-green-800',    icon: CheckCircle,    label: 'Delivered'   },
  rejected:    { color: 'bg-red-100 text-red-800',        icon: XCircle,        label: 'Rejected'    },
  unavailable: { color: 'bg-orange-100 text-orange-800',  icon: AlertTriangle,  label: 'Unavailable' },
  refunded:    { color: 'bg-gray-100 text-gray-600',      icon: RotateCcw,      label: 'Refunded'    },
};

const SUPPORT_EMAIL = 'support@opticsview.store';

export default function OrderHistory({ onBack }: Props) {
  const [orders,    setOrders]    = useState<any[]>([]);
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm,  setEditForm]  = useState({ state: '', city: '', area: '' });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(false);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      // No session — nothing to show, stop cleanly
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*, items:order_items(*, products(name, images, image_url))')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data ?? []);

    } catch (err) {
      console.error('Orders fetch failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (orderId: string) => {
    await supabase.from('orders').update({
      shipping_state: editForm.state,
      shipping_city:  editForm.city,
      shipping_area:  editForm.area,
    }).eq('id', orderId);
    setEditingId(null);
    fetchOrders();
  };

  const getRefundEmailLink = (order: any) => {
    const subject = encodeURIComponent(`Refund Request — Code: ${order.refund_code}`);
    const body = encodeURIComponent(
      `Hello,\n\nI am requesting a refund for order #${order.id.slice(0, 8)}.\n\nRefund Code: ${order.refund_code}\nRefund Amount: ₦${(order.refund_amount || 0).toLocaleString()}\n\nPlease find my bank details below:\n\nBank Name: \nAccount Number: \nAccount Name: \n\nThank you.`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const tabs = ['all', 'pending', 'approved', 'shipped', 'delivered', 'rejected', 'unavailable'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  // ── Error — network or Supabase failure ───────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-light tracking-wide text-[#0d2818]">My Purchases</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-lg shadow-sm max-w-sm w-full border-t-4 border-amber-400">
            <div className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff size={24} className="text-amber-500" />
            </div>
            <h2 className="text-base font-medium text-gray-800 mb-2">Couldn't Load Orders</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              There was a problem reaching the server. Your orders are safe — check your
              connection and try again.
            </p>
            <button
              onClick={fetchOrders}
              className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity rounded flex items-center justify-center gap-2"
            >
              <RefreshCw size={13} />
              TRY AGAIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Orders list ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-light tracking-wide text-[#0d2818]">My Purchases</h1>
        </div>
        <div className="max-w-3xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-5 min-w-max">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`py-3 text-xs tracking-widest border-b-2 transition-colors ${
                  filter === t
                    ? 'border-[#0d2818] text-[#0d2818] font-medium'
                    : 'border-transparent text-gray-400'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        )}

        {filtered.map(order => {
          const cfg  = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
          const Icon = cfg.icon;

          return (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Header row */}
              <div className="p-5 pb-4 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold ${cfg.color}`}>
                    <Icon size={11} /> {cfg.label}
                  </span>
                  <p className="text-[10px] text-gray-400 font-mono mt-1.5">#{order.id.slice(0, 8)}</p>
                  {order.retailer_slug && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                      <Store size={10} /> via {order.retailer_slug}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#0d2818]">₦{(order.total_amount || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-NG')}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="p-5 space-y-3">
                {order.items?.map((item: any) => {
                  const img = item.products?.images?.[0] || item.products?.image_url;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded border shrink-0 overflow-hidden">
                        {img
                          ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                          : <Package size={14} className="m-auto mt-3 text-gray-300" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.products?.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity} · ₦{item.price?.toLocaleString()}</p>
                        {(item.selected_color || item.selected_type) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selected_color && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                {item.selected_color}
                              </span>
                            )}
                            {item.selected_type && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                {item.selected_type}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Unavailable — refund instructions */}
              {order.status === 'unavailable' && (
                <div className="mx-5 mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Product No Longer Available</p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        We're sorry — this item is out of stock. You're eligible for a full refund of{' '}
                        <strong>₦{(order.refund_amount || 0).toLocaleString()}</strong> (total minus ₦1,000 processing fee).
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-orange-200 rounded p-3 text-xs space-y-1">
                    <p className="text-gray-500">Your Refund Code</p>
                    <p className="font-mono font-bold text-[#0d2818] text-base">{order.refund_code}</p>
                  </div>
                  <a
                    href={getRefundEmailLink(order)}
                    className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white py-3 text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Send Refund Request via Email
                  </a>
                  <p className="text-[10px] text-orange-600 text-center">
                    Include your bank details in the email. Refunds are processed within 24 hours.
                  </p>
                </div>
              )}

              {/* Refunded */}
              {order.status === 'refunded' && (
                <div className="mx-5 mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <RotateCcw size={14} className="text-green-600" />
                  <p className="text-xs text-green-800">
                    <strong>Refund processed.</strong> ₦{(order.refund_amount || 0).toLocaleString()} has been sent to your account.
                  </p>
                </div>
              )}

              {/* Delivery info */}
              {['pending', 'approved'].includes(order.status) && (
                <div className="mx-5 mb-4 bg-blue-50 border border-blue-100 rounded p-3 flex items-start gap-2 text-[10px] text-blue-800">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  <p>Standard delivery takes <strong>7 business days</strong> after approval.</p>
                </div>
              )}

              {/* Location */}
              <div className="bg-gray-50 p-4 border-t">
                {editingId === order.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="State"
                        value={editForm.state}
                        onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                        className="border p-2 text-xs rounded outline-none focus:border-[#0d2818]"
                      />
                      <input
                        placeholder="City"
                        value={editForm.city}
                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                        className="border p-2 text-xs rounded outline-none focus:border-[#0d2818]"
                      />
                    </div>
                    <input
                      placeholder="Area"
                      value={editForm.area}
                      onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                      className="w-full border p-2 text-xs rounded outline-none focus:border-[#0d2818]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateLocation(order.id)}
                        className="flex-1 bg-[#0d2818] text-white py-2 text-xs rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 border text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-2 text-gray-500 text-xs">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span>{order.shipping_city}, {order.shipping_state} ({order.shipping_area})</span>
                    </div>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => {
                          setEditForm({
                            state: order.shipping_state || '',
                            city:  order.shipping_city  || '',
                            area:  order.shipping_area  || '',
                          });
                          setEditingId(order.id);
                        }}
                        className="flex items-center gap-1 text-[#0d2818] text-xs hover:underline ml-3 shrink-0"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
