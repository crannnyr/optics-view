import { useState, useEffect } from 'react';
import { Loader2, Clock, CheckCircle2, XCircle, PackageCheck } from 'lucide-react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';
import { VendorAccount } from '../hooks/useVendorAccess';

interface Application {
  id: string;
  name: string;
  photo_url_1: string;
  vendor_price: number;
  total_quantity: number;
  status: string;
  rejection_reason: string | null;
  application_reference: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { label: string; icon: JSX.Element; className: string }> = {
  draft:           { label: 'Awaiting Campaign', icon: <Clock size={12} />,        className: 'bg-amber-100 text-amber-700' },
  pending_payment: { label: 'Awaiting Payment',  icon: <Clock size={12} />,        className: 'bg-amber-100 text-amber-700' },
  pending_review:  { label: 'Under Review',      icon: <Clock size={12} />,        className: 'bg-blue-100 text-blue-700' },
  approved:        { label: 'Approved',          icon: <CheckCircle2 size={12} />, className: 'bg-green-100 text-green-700' },
  rejected:        { label: 'Rejected',          icon: <XCircle size={12} />,      className: 'bg-red-100 text-red-700' },
  live:             { label: 'Live',              icon: <PackageCheck size={12} />, className: 'bg-emerald-100 text-emerald-700' },
  delisted:        { label: 'Delisted',          icon: <XCircle size={12} />,      className: 'bg-gray-100 text-gray-600' },
};

interface MyProductsListProps {
  vendor: VendorAccount;
  refreshKey: number;
}

export default function MyProductsList({ vendor, refreshKey }: MyProductsListProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('vendor_product_applications')
      .select('id, name, photo_url_1, vendor_price, total_quantity, status, rejection_reason, application_reference, created_at')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setApplications((data as Application[]) || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [vendor.id, refreshKey]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  if (applications.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">You haven't posted any products yet.</p>;
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {applications.map(app => {
        const style = STATUS_STYLES[app.status] || STATUS_STYLES.draft;
        return (
          <div key={app.id} className="flex items-center gap-4 border border-gray-100 rounded-lg p-3">
            <img src={app.photo_url_1} alt={app.name} className="w-14 h-14 object-contain bg-gray-50 rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{app.name}</p>
              <p className="text-xs text-gray-400">₦{app.vendor_price.toLocaleString()} · {app.total_quantity} units · {app.application_reference}</p>
              {app.status === 'rejected' && app.rejection_reason && (
                <p className="text-[11px] text-red-500 mt-0.5">{app.rejection_reason}</p>
              )}
            </div>
            <span className={`shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${style.className}`}>
              {style.icon} {style.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
