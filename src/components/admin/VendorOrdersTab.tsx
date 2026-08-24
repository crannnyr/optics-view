import { Loader2, Truck } from 'lucide-react';
import { useVendorOrders } from './hooks/useVendorOrders';
import VendorFulfillmentRow from './vendors/VendorFulfillmentRow';

export default function VendorOrdersTab() {
  const { fulfillments, loading, processingId, approve, markFailedDelivery } = useVendorOrders();

  const pending = fulfillments.filter(f => f.status === 'pending_approval');
  const inProgress = fulfillments.filter(f => f.status === 'approved');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#0d2818]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-light text-[#0d2818]">Vendor Orders</h2>
        <p className="text-sm text-gray-500 mt-1">
          The portion of each order that belongs to a vendor — approving here starts their 48-hour shipping window.
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Awaiting Approval ({pending.length})</p>
        {pending.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded bg-gray-50">
            <p className="text-gray-400 text-xs italic">Nothing waiting.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(f => (
              <VendorFulfillmentRow
                key={f.id} fulfillment={f} processing={processingId === f.id}
                onApprove={() => approve(f)} onMarkFailed={() => markFailedDelivery(f)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">In Progress ({inProgress.length})</p>
        {inProgress.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded bg-gray-50">
            <Truck size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-xs italic">No vendor shipments in progress.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgress.map(f => (
              <VendorFulfillmentRow
                key={f.id} fulfillment={f} processing={processingId === f.id}
                onApprove={() => approve(f)} onMarkFailed={() => markFailedDelivery(f)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
