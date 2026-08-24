import { VendorApplication } from '../hooks/useVendorApplications';

interface VendorApplicationCardProps {
  app: VendorApplication;
  onReview: () => void;
}

export default function VendorApplicationCard({ app, onReview }: VendorApplicationCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-4 flex items-center gap-4">
      <img src={app.photo_url_1} alt={app.name} className="w-16 h-16 object-contain bg-gray-50 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{app.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {app.vendor_registrations?.business_name || 'Unknown vendor'} · {app.categories?.name} · {app.category_item_types?.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          ₦{app.vendor_price.toLocaleString()} · {app.total_quantity} units · {app.application_reference}
        </p>
      </div>
      <button
        onClick={onReview}
        className="shrink-0 bg-[#0d2818] text-white text-xs tracking-widest px-4 py-2 hover:opacity-90 transition-opacity"
      >
        REVIEW
      </button>
    </div>
  );
}
