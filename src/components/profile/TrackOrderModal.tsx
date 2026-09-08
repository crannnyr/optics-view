import { useState } from 'react';
import { X, Search, ExternalLink } from 'lucide-react';

interface TrackOrderModalProps {
  orders: any[];
  themeColor: string;
  onClose: () => void;
}

function getTrackingUrl(supplier: string, trackingId: string): string | null {
  if (supplier === 'jumia') return `https://packagetracker-services.jumia.com/?orderNo=${trackingId}`;
  if (supplier === 'shein') return `https://www.17track.net/en/track#nums=${trackingId}`;
  return null;
}

// Looks up an order by its short reference (the same 8-character prefix
// shown on every order card) against orders already loaded for this
// shopper — no extra query needed, this is just a fast filter.
export default function TrackOrderModal({ orders, themeColor, onClose }: TrackOrderModalProps) {
  const [query, setQuery] = useState('');

  const match = query.trim().length >= 3
    ? orders.find(o => o.id.toLowerCase().startsWith(query.trim().toLowerCase()))
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-medium text-gray-900">Track Order</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter order reference (e.g. R6ZMJ6)"
              className="w-full border border-gray-200 pl-9 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-gray-400"
            />
          </div>

          {query.trim().length >= 3 && !match && (
            <p className="text-xs text-gray-400 text-center py-6">No order found with that reference.</p>
          )}

          {match && (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-gray-400">#{match.id.slice(0, 8)}</p>
                <span className="text-xs font-medium capitalize px-2 py-0.5 rounded" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
                  {match.import_status
                    ? match.import_status.replace('_', ' ')
                    : match.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(match.created_at).toLocaleDateString('en-NG')} · ₦{(match.total_amount || 0).toLocaleString()}
              </p>

              {match.tracking_codes?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  {match.tracking_codes.map((tc: any, i: number) => {
                    const url = getTrackingUrl(tc.supplier, tc.trackingId);
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{tc.supplier}: {tc.trackingId}</span>
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: themeColor }}>
                            Track <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
