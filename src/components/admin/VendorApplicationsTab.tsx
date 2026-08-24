import { useState } from 'react';
import { Loader2, PackageSearch } from 'lucide-react';
import { useVendorApplications, VendorApplication } from './hooks/useVendorApplications';
import VendorApplicationCard from './vendors/VendorApplicationCard';
import VendorApplicationReviewModal from './vendors/VendorApplicationReviewModal';

export default function VendorApplicationsTab() {
  const { applications, loading, processingId, approve, reject } = useVendorApplications();
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
      <div className="mb-8">
        <h2 className="text-xl font-light">Vendor Product Applications</h2>
        <p className="text-sm text-gray-500 mt-1">
          {applications.length} pending review
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <PackageSearch size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nothing waiting for review right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <VendorApplicationCard key={app.id} app={app} onReview={() => setSelected(app)} />
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
