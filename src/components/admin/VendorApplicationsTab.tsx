import { useState } from 'react';
import { Loader2, PackageSearch } from 'lucide-react';
import { useVendorApplications, VendorApplication } from './hooks/useVendorApplications';
import VendorApplicationCard from './vendors/VendorApplicationCard';
import VendorApplicationReviewModal from './vendors/VendorApplicationReviewModal';

const STATUS_TABS = [
  { key: 'pending_review', label: 'Awaiting Review' },
  { key: 'live',           label: 'Live' },
  { key: 'rejected',       label: 'Rejected' },
  { key: 'draft',          label: 'Unpaid' },
  { key: 'all',            label: 'All' },
];

export default function VendorApplicationsTab() {
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const { applications, loading, processingId, counts, approve, reject } = useVendorApplications(statusFilter);
  const [selected, setSelected] = useState<VendorApplication | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#0d2818]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-light">Listing Verification</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review vendor products before they go live on the site.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-6 -mx-1 px-1">
        {STATUS_TABS.map(t => {
          const n = t.key === 'all'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : (counts[t.key] || 0);
          const active = statusFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap shrink-0 transition-colors ${
                active ? 'border-[#0d2818] text-[#0d2818]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label} {n > 0 && <span className="text-gray-400">({n})</span>}
            </button>
          );
        })}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <PackageSearch size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nothing here right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <VendorApplicationCard
              key={app.id}
              app={app}
              onReview={app.status === 'pending_review' ? () => setSelected(app) : undefined}
            />
          ))}
        </div>
      )}

      {selected && (
        <VendorApplicationReviewModal
          app={selected}
          processing={processingId === selected.id}
          onClose={() => setSelected(null)}
          onApprove={async (app, price) => { await approve(app, price); setSelected(null); }}
          onReject={async (app, reason) => { await reject(app, reason); setSelected(null); }}
        />
      )}
    </div>
  );
}
