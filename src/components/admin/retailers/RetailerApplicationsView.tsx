import { Users, Mail, Phone, Globe, Calendar, CheckCircle } from 'lucide-react';
import { RetailerRegistration } from '../hooks/useSettings';

interface RetailerApplicationsViewProps {
  retailers: RetailerRegistration[];
  loadingRetailers: boolean;
  getStatusBadge: (status: string) => string;
  formatDate: (dateString?: string) => string;
}

export default function RetailerApplicationsView({
  retailers,
  loadingRetailers,
  getStatusBadge,
  formatDate
}: RetailerApplicationsViewProps) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-8">
        <Users size={24} className="text-[#0d2818]" />
        <h2 className="text-xl font-light text-[#0d2818]">Retailer Applications</h2>
      </div>

      {loadingRetailers ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : retailers.length === 0 ? (
        <div className="bg-white border rounded-sm p-12 text-center text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">No retailer applications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {retailers.map((retailer) => (
            <div key={retailer.id} className="bg-white border rounded-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-[#0d2818] mb-1">{retailer.full_name}</h3>
                  <div className="flex gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wide ${getStatusBadge(retailer.payment_status)}`}>
                      {retailer.payment_status}
                    </span>
                    <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wide ${getStatusBadge(retailer.subscription_status)}`}>
                      {retailer.subscription_status}
                    </span>
                  </div>
                </div>
                <span className="text-xl font-bold text-[#0d2818]">
                  ₦{retailer.registration_fee.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} />
                  <a href={`mailto:${retailer.email}`} className="hover:text-[#0d2818]">{retailer.email}</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} />
                  <a href={`tel:${retailer.phone}`} className="hover:text-[#0d2818]">{retailer.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe size={14} />
                  <span>
                    {retailer.domain_type === 'subdomain' 
                      ? `${retailer.store_slug}.opticsview.store`
                      : `${retailer.custom_domain || retailer.store_slug}.store` // Using your corrected .store TLD mental note if you want to update it to qafrica.store!
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>Applied: {formatDate(retailer.created_at)}</span>
                </div>
              </div>

              {retailer.verified_at && (
                <div className="bg-green-50 border border-green-200 p-3 rounded text-xs">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle size={14} />
                    <span className="font-medium">Verified on {formatDate(retailer.verified_at)}</span>
                  </div>
                  {retailer.trial_ends_at && (
                    <p className="text-green-700 mt-1 ml-6">
                      Trial ends: {formatDate(retailer.trial_ends_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
