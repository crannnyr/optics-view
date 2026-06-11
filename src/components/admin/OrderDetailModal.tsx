import { useState, useEffect } from 'react';
import {
  X, Package, Truck, CheckCircle, Loader2,
  AlertTriangle, RotateCcw, Ban, Copy, Check, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../lib/email';

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

const SUPPLIER_LABELS: Record<string, string> = {
  jumia: '🟠 Jumia',
  shein: '🟣 Shein',
  own:   '🟢 Own Stock',
};

function getTrackingUrl(supplier: string, trackingId: string): string | null {
  if (supplier === 'jumia') return `https://www.jumia.com.ng/order/tracking/?orderNo=${trackingId}`;
  if (supplier === 'shein') return `https://www.shein.com/track/index?page=track&logistics_no=${trackingId}`;
  return null;
}

function CopyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded px-3 py-2 group">
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-gray-400">{label}</p>
        <p className={`text-xs text-[#0d2818] truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="shrink-0 p-1.5 rounded hover:bg-gray-200 transition-colors"
      >
        {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-gray-400 group-hover:text-gray-600" />}
      </button>
    </div>
  );
}

// ── Shipping Modal ─────────────────────────────────────────────────────────────
// Shown when admin clicks "Mark Shipped".
// Groups order items by supplier, asks for tracking ID per supplier,
// then fires one email per supplier with the correct tracking link.
interface ShippingModalProps {
  order: any;
  onConfirm: (trackingCodes: { supplier: string; trackingId: string }[]) => Promise<void>;
  onCancel: () => void;
}

function ShippingModal({ order, onConfirm, onCancel }: ShippingModalProps) {
  // Derive unique suppliers from order items
  const supplierGroups: Record<string, { items: any[]; trackingId: string }> = {};

  for (const item of order.items || []) {
    const supplier = item.products?.supplier || 'jumia';
    if (!supplierGroups[supplier]) {
      supplierGroups[supplier] = { items: [], trackingId: '' };
    }
    supplierGroups[supplier].items.push(item);
  }

  const [tracking, setTracking] = useState<Record<string, string>>(
    Object.fromEntries(Object.keys(supplierGroups).map(s => [s, '']))
  );
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    const codes = Object.entries(tracking)
      .map(([supplier, trackingId]) => ({ supplier, trackingId: trackingId.trim() }));
    await onConfirm(codes);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-light text-[#0d2818] mb-1">Mark as Shipped</h3>
        <p className="text-xs text-gray-400 mb-5">
          Enter tracking IDs for each supplier. Own Stock doesn't need one.
        </p>

        <div className="space-y-4 mb-6">
          {Object.entries(supplierGroups).map(([supplier, group]) => (
            <div key={supplier}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-700">
                  {SUPPLIER_LABELS[supplier] || supplier}
                </label>
                <span className="text-[10px] text-gray-400">
                  {group.items.length} item{group.items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Item names for this supplier */}
              <div className="mb-2 space-y-1">
                {group.items.map((item: any, i: number) => (
                  <p key={i} className="text-[10px] text-gray-500 truncate">
                    · {item.products?.name} × {item.quantity}
                  </p>
                ))}
              </div>

              {supplier !== 'own' ? (
                <input
                  type="text"
                  placeholder={`${supplier === 'jumia' ? 'Jumia' : 'Shein'} tracking ID`}
                  value={tracking[supplier] || ''}
                  onChange={e => setTracking(p => ({ ...p, [supplier]: e.target.value }))}
                  className="w-full border border-gray-200 px-3 py-2 text-xs rounded outline-none focus:border-[#0d2818] font-mono"
                />
              ) : (
                <p className="text-[10px] text-gray-400 italic px-1">
                  No tracking needed — shipped from own stock.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-5 py-2 text-xs bg-[#0d2818] text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
            {submitting ? 'Shipping...' : 'Confirm & Send Emails'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function OrderDetailModal({
  order, onClose, onUpdateStatus,
  onMarkUnavailable, onMarkRefunded, statusLoading
}: Props) {
  const [liveOrder, setLiveOrder]         = useState(order);
  const [showShipping, setShowShipping]   = useState(false);
  const isLoading = statusLoading === order.id;

  useEffect(() => { setLiveOrder(order); }, [order]);

  const total       = liveOrder.total_amount || 0;
  const fullAddress = `${liveOrder.shipping_city}, ${liveOrder.shipping_state} · ${liveOrder.shipping_area}`;

  const handleShipConfirm = async (trackingCodes: { supplier: string; trackingId: string }[]) => {
    setShowShipping(false);

    // Save tracking codes to order
    await supabase
      .from('orders')
      .update({ tracking_codes: trackingCodes })
      .eq('id', liveOrder.id);

    // Fire onUpdateStatus which handles the DB update + notification
    onUpdateStatus(liveOrder.id, 'shipped');

    // Send one email per supplier that has a tracking ID
    for (const { supplier, trackingId } of trackingCodes) {
      if (!trackingId && supplier === 'own') continue;

      const trackingUrl = getTrackingUrl(supplier, trackingId);

      sendEmail({
        type: 'order_shipped_tracking',
        to_email: liveOrder.customer_email,
        to_name: liveOrder.customer_name,
        data: {
          customer_name: liveOrder.customer_name,
          order_id: liveOrder.id,
          shipping_address: fullAddress,
          supplier,
          supplier_label: SUPPLIER_LABELS[supplier] || supplier,
          tracking_id: trackingId || null,
          tracking_url: trackingUrl,
        },
      });
    }
  };

  return (
    <>
      {showShipping && (
        <ShippingModal
          order={liveOrder}
          onConfirm={handleShipConfirm}
          onCancel={() => setShowShipping(false)}
        />
      )}

      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg flex flex-col">

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-light text-[#0d2818]">Order Details</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
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

            {/* Tracking codes — shown if order is shipped */}
            {liveOrder.status === 'shipped' && liveOrder.tracking_codes?.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1.5">
                  <Truck size={13} /> Tracking Information
                </p>
                <div className="space-y-2">
                  {liveOrder.tracking_codes.map((tc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-600">
                        {SUPPLIER_LABELS[tc.supplier] || tc.supplier}
                      </span>
                      {tc.trackingId ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#0d2818]">{tc.trackingId}</span>
                          {getTrackingUrl(tc.supplier, tc.trackingId) && (
                            <a
                              href={getTrackingUrl(tc.supplier, tc.trackingId)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Own stock</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refund info */}
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
                <div className="space-y-2">
                  <CopyField label="Name" value={liveOrder.customer_name} />
                  <CopyField label="Email" value={liveOrder.customer_email} mono />
                  {liveOrder.customer_phone_1 && (
                    <CopyField label="Primary Phone" value={liveOrder.customer_phone_1} mono />
                  )}
                  {liveOrder.customer_phone_2 && (
                    <CopyField label="Alternate Phone" value={liveOrder.customer_phone_2} mono />
                  )}
                  {!liveOrder.customer_phone_1 && liveOrder.customer_phone && (
                    <CopyField label="Phone" value={liveOrder.customer_phone} mono />
                  )}
                  <CopyField label="Delivery Address" value={fullAddress} />
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-2 font-bold border-b pb-1">Payment</p>
                <div className="space-y-2">
                  <CopyField label="Order Reference" value={liveOrder.paystack_reference || liveOrder.id} mono />
                  <div className="space-y-1.5 text-xs px-1">
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
                    {liveOrder.retailer_profit > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Retailer Profit</span>
                        <span>₦{liveOrder.retailer_profit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold border-b pb-1">Items</p>
              <div className="space-y-2">
                {liveOrder.items?.map((item: any, idx: number) => {
                  const img = item.products?.images?.[0] || item.products?.image_url;
                  const supplier = item.products?.supplier || 'jumia';
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
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {SUPPLIER_LABELS[supplier] || supplier}
                          </span>
                          {item.selected_color && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                              {item.selected_color}
                            </span>
                          )}
                          {item.selected_type && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                              {item.selected_type}
                            </span>
                          )}
                        </div>
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

                {liveOrder.status === 'approved' && (
                  <>
                    <button
                      onClick={() => onMarkUnavailable(liveOrder.id)}
                      className="px-4 py-2 text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded hover:bg-orange-200 flex items-center gap-1.5"
                    >
                      <Ban size={13} /> Unavailable
                    </button>
                    <button
                      onClick={() => setShowShipping(true)}
                      className="px-5 py-2 text-xs bg-[#0d2818] text-white rounded hover:opacity-90 flex items-center gap-1.5"
                    >
                      <Truck size={13} /> Mark Shipped
                    </button>
                  </>
                )}

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
    </>
  );
}
