import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  X, MapPin, Package, Truck, CheckCircle, Loader2,
  CreditCard, AlertTriangle, RotateCcw, Ban
} from 'lucide-react';

interface Props {
  order: any;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onMarkUnavailable: (orderId: string) => void;
  onMarkRefunded: (orderId: string) => void;
  statusLoading: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  approved:    'bg-blue-100 text-blue-800',
  shipped:     'bg-purple-100 text-purple-800',
  delivered:   'bg-green-100 text-green-800',
  rejected:    'bg-red-100 text-red-800',
  unavailable: 'bg-orange-100 text-orange-800',
  refunded:    'bg-gray-100 text-gray-600',
};

export default function OrderDetailModal({
  order, onClose, onUpdateStatus,
  onMarkUnavailable, onMarkRefunded, statusLoading
}: Props) {
  const [liveOrder, setLiveOrder] = useState(order);
  const isLoading = statusLoading === order.id;

  useEffect(() => { setLiveOrder(order); }, [order]);

  const total = liveOrder.total_amount || 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-light text-[#0d2818]">Order Details</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] text-gray-400">#{liveOrder.id.slice(0, 8)}</span>
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${STATUS_COLORS[liveOrder.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {liveOrder.status}
              </span>
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${
                liveOrder.payment_method === 'paystack'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {liveOrder.payment_method === 'paystack' ? '💳 Paystack' : '🏦 Transfer'}
              </span>
              {liveOrder.retailer_slug && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  via {liveOrder.retailer_slug}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Refund info (unavailable orders) */}
          {liveOrder.status === 'unavailable' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-orange-800 font-semibold text-sm">
                <AlertTriangle size={16} /> Product Unavailable — Refund Pending
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">Refund Code</p>
                  <p className="font-mono font-bold text-[#0d2818]">{liveOrder.refund_code}</p>
                </div>
                <div>
                  <p className="text-gray-500">Refund Amount</p>
                  <p className="font-bold text-green-700">₦{(liveOrder.refund_amount || 0).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-orange-700">
                Customer has been notified and given this code. Mark refunded once you've sent the funds.
              </p>
            </div>
          )}

          {/* Customer + Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold border-b pb-1">Customer</p>
              <p className="font-medium text-sm">{liveOrder.customer_name}</p>
              <p className="text-xs text-gray-500 font-mono">{liveOrder.customer_email}</p>
              <p className="text-xs text-gray-500 mt-0.5">{liveOrder.customer_phone}</p>
              <div className="flex items-start gap-2 mt-3 bg-gray-50 p-3 rounded border text-xs text-gray-600">
                <MapPin size={14} className="shrink-0 mt-0.5 text-[#0d2818]" />
                <p>{liveOrder.shipping_city}, {liveOrder.shipping_state} · {liveOrder.shipping_area}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold border-b pb-1">Payment</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium">{liveOrder.payment_method === 'paystack' ? 'Paystack (Card)' : 'Bank Transfer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Verified via</span>
                  <span>{liveOrder.payment_verified_via || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Total</span>
                  <span className="font-bold text-[#0d2818] text-base">₦{total.toLocaleString()}</span>
                </div>
                {liveOrder.retailer_profit && (
                  <div className="flex justify-between text-green-700">
                    <span>Retailer Profit</span>
                    <span>₦{liveOrder.retailer_profit.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold border-b pb-1">Items</p>
            <div className="space-y-2">
              {liveOrder.items?.map((item: any, idx: number) => {
                const img = item.products?.images?.[0] || item.products?.image_url;
                return (
                  <div key={idx} className="flex gap-3 items-center bg-white border border-gray-100 p-2 rounded">
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden shrink-0">
                      {img
                        ? <img src={img} alt="" className="w-full h-full object-cover" />
                        : <Package size={14} className="m-auto mt-2 text-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.products?.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-mono text-gray-600">₦{(item.quantity * item.price).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-3 pt-3 border-t">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase">Total</p>
                <p className="text-xl font-bold text-[#0d2818]">₦{total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex flex-wrap justify-end gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 px-4">
              <Loader2 size={15} className="animate-spin" /> Updating...
            </div>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-xs border bg-white hover:bg-gray-50 rounded">
                Close
              </button>

              {/* Pending manual transfer — verify or reject */}
              {liveOrder.status === 'pending' && liveOrder.payment_method === 'transfer' && (
                <>
                  <button
                    onClick={() => onUpdateStatus(liveOrder.id, 'rejected')}
                    className="px-4 py-2 text-xs bg-red-100 text-red-700 border border-red-200 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onUpdateStatus(liveOrder.id, 'approved')}
                    className="px-5 py-2 text-xs bg-[#0d2818] text-white rounded hover:opacity-90"
                  >
                    Verify & Approve
                  </button>
                </>
              )}

              {/* Approved → ship or mark unavailable */}
              {liveOrder.status === 'approved' && (
                <>
                  <button
                    onClick={() => onMarkUnavailable(liveOrder.id)}
                    className="px-4 py-2 text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded hover:bg-orange-200 flex items-center gap-1.5"
                  >
                    <Ban size={13} /> Unavailable
                  </button>
                  <button
                    onClick={() => onUpdateStatus(liveOrder.id, 'shipped')}
                    className="px-5 py-2 text-xs bg-[#0d2818] text-white rounded hover:opacity-90 flex items-center gap-1.5"
                  >
                    <Truck size={13} /> Mark Shipped
                  </button>
                </>
              )}

              {/* Shipped → deliver or unavailable */}
              {liveOrder.status === 'shipped' && (
                <>
                  <button
                    onClick={() => onMarkUnavailable(liveOrder.id)}
                    className="px-4 py-2 text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded hover:bg-orange-200 flex items-center gap-1.5"
                  >
                    <Ban size={13} /> Unavailable
                  </button>
                  <button
                    onClick={() => onUpdateStatus(liveOrder.id, 'delivered')}
                    className="px-5 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1.5"
                  >
                    <CheckCircle size={13} /> Confirm Delivery
                  </button>
                </>
              )}

              {/* Unavailable → mark refunded */}
              {liveOrder.status === 'unavailable' && (
                <button
                  onClick={() => onMarkRefunded(liveOrder.id)}
                  className="px-5 py-2 text-xs bg-[#0d2818] text-white rounded hover:opacity-90 flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Mark Refunded
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}