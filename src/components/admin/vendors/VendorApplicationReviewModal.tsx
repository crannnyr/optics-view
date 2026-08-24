import { useState } from 'react';
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { VendorApplication } from '../hooks/useVendorApplications';

interface VendorApplicationReviewModalProps {
  app: VendorApplication;
  processing: boolean;
  onClose: () => void;
  onApprove: (app: VendorApplication, retailPrice: number) => Promise<void>;
  onReject: (app: VendorApplication, reason: string) => Promise<void>;
}

export default function VendorApplicationReviewModal({
  app, processing, onClose, onApprove, onReject,
}: VendorApplicationReviewModalProps) {
  const [retailPrice, setRetailPrice] = useState(String(app.vendor_price));
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg font-light text-[#0d2818]">{app.name}</h2>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">{app.application_reference}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <img src={app.photo_url_1} alt="Photo 1" className="w-full aspect-square object-contain bg-gray-50 rounded border" />
            <img src={app.photo_url_2} alt="Photo 2" className="w-full aspect-square object-contain bg-gray-50 rounded border" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-[10px] uppercase text-gray-400">Vendor</p><p>{app.vendor_registrations?.business_name}</p></div>
            <div><p className="text-[10px] uppercase text-gray-400">Contact</p><p>{app.vendor_registrations?.phone}</p></div>
            <div><p className="text-[10px] uppercase text-gray-400">Category</p><p>{app.categories?.name} / {app.category_item_types?.name}</p></div>
            <div><p className="text-[10px] uppercase text-gray-400">Quantity</p><p>{app.total_quantity} units{app.weight_kg ? ` · ${app.weight_kg}kg/item` : ''}</p></div>
            <div><p className="text-[10px] uppercase text-gray-400">Vendor's Price</p><p>₦{app.vendor_price.toLocaleString()}</p></div>
            <div><p className="text-[10px] uppercase text-gray-400">Commission</p><p>{app.commission_rate}%</p></div>
          </div>

          {app.description && (
            <div>
              <p className="text-[10px] uppercase text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-600">{app.description}</p>
            </div>
          )}

          {!rejectMode ? (
            <>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1.5">Retail Price to List At (₦)</label>
                <input
                  type="number" min="1" value={retailPrice} onChange={e => setRetailPrice(e.target.value)}
                  className="w-full border p-2.5 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRejectMode(true)}
                  disabled={processing}
                  className="flex-1 border border-red-300 text-red-600 py-3 text-xs tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={14} /> REJECT
                </button>
                <button
                  onClick={() => onApprove(app, Number(retailPrice))}
                  disabled={processing || !Number(retailPrice)}
                  className="flex-1 bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  APPROVE & GO LIVE
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1.5">Reason for Rejection</label>
                <textarea
                  rows={3} value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full border p-2.5 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black resize-none"
                  placeholder="Explain what needs to change so the vendor can fix and resubmit..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectMode(false)}
                  disabled={processing}
                  className="flex-1 border py-3 text-xs tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => onReject(app, reason)}
                  disabled={processing || !reason.trim()}
                  className="flex-1 bg-red-600 text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  CONFIRM REJECT
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
