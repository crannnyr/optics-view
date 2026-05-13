import { useState } from 'react';
import {
  Users, Mail, Phone, Globe, Calendar, CheckCircle,
  Clock, XCircle, Ban, Unlock, ExternalLink, CreditCard,
  Building2, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface RetailerRegistration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  domain_type: string;
  custom_domain?: string;
  store_slug: string;
  registration_fee: number;
  payment_status: string;
  subscription_status: string;
  payment_method?: string;
  sender_name?: string;
  is_blocked?: boolean;
  domain_confirmed?: boolean;
  selected_categories?: string[];
  subscription_plan?: string;
  created_at: string;
  verified_at?: string;
  trial_ends_at?: string;
  next_billing_date?: string;
}

interface Props {
  retailers: RetailerRegistration[];
  loadingRetailers: boolean;
  formatDate: (d?: string) => string;
  fetchRetailers: () => void;
}

type FilterTab = 'all' | 'pending' | 'active' | 'expired' | 'blocked';

export default function RetailerApplicationsView({
  retailers, loadingRetailers, formatDate, fetchRetailers
}: Props) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = retailers.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.payment_status === 'pending';
    if (filter === 'active') return r.payment_status === 'verified' && !r.is_blocked && r.subscription_status !== 'suspended';
    if (filter === 'expired') return r.subscription_status === 'suspended';
    if (filter === 'blocked') return r.is_blocked;
    return true;
  });

  const counts = {
    all: retailers.length,
    pending: retailers.filter(r => r.payment_status === 'pending').length,
    active: retailers.filter(r => r.payment_status === 'verified' && !r.is_blocked && r.subscription_status !== 'suspended').length,
    expired: retailers.filter(r => r.subscription_status === 'suspended').length,
    blocked: retailers.filter(r => r.is_blocked).length,
  };

  const handleVerify = async (id: string) => {
    setActionLoading(id + '-verify');
    await supabase.from('retailer_registrations').update({
      payment_status: 'verified',
      subscription_status: 'trial',
      verified_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', id);
    setActionLoading(null);
    fetchRetailers();
  };

  const handleBlock = async (id: string, block: boolean) => {
    setActionLoading(id + '-block');
    await supabase.from('retailer_registrations').update({ is_blocked: block }).eq('id', id);
    setActionLoading(null);
    fetchRetailers();
  };

  const handleConfirmDomain = async (id: string) => {
    setActionLoading(id + '-domain');
    await supabase.from('retailer_registrations').update({ domain_confirmed: true }).eq('id', id);
    setActionLoading(null);
    fetchRetailers();
  };

  const getPaymentBadge = (r: RetailerRegistration) => {
    if (r.is_blocked) return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded border border-red-200"><Ban size={10} /> Blocked</span>;
    if (r.payment_status === 'pending' && r.payment_method === 'transfer') return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded border border-amber-200"><Building2 size={10} /> Manual Pending</span>;
    if (r.payment_status === 'pending') return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-200"><Clock size={10} /> Pending</span>;
    if (r.payment_status === 'verified' && r.subscription_status === 'trial') return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200"><Clock size={10} /> Trial</span>;
    if (r.payment_status === 'verified') return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200"><CheckCircle size={10} /> Active</span>;
    if (r.subscription_status === 'suspended') return <span className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded border border-orange-200"><AlertCircle size={10} /> Expired</span>;
    return null;
  };

  const getStoreUrl = (r: RetailerRegistration) =>
    r.domain_type === 'subdomain'
      ? `opticsview.store/${r.store_slug}`
      : r.custom_domain || `${r.store_slug}.store`;

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex items-center gap-3">
        <Users size={22} className="text-[#0d2818]" />
        <h2 className="text-xl font-light text-[#0d2818]">Retailer Management</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'active', 'expired', 'blocked'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs uppercase tracking-wide rounded-full border transition-all flex items-center gap-1.5 ${
              filter === tab
                ? 'bg-[#0d2818] text-white border-[#0d2818]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {tab}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === tab ? 'bg-white/20' : 'bg-gray-100'}`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {loadingRetailers ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No retailers in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`bg-white border rounded-lg overflow-hidden transition-shadow hover:shadow-sm ${r.is_blocked ? 'border-red-200 opacity-75' : ''}`}>
              {/* Card Header */}
              <div className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-[#0d2818]/10 flex items-center justify-center text-[#0d2818] font-bold text-sm shrink-0">
                    {r.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#0d2818] truncate">{r.full_name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{getStoreUrl(r)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getPaymentBadge(r)}
                  <span className="text-sm font-bold text-[#0d2818]">₦{r.registration_fee.toLocaleString()}</span>
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    {expanded === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === r.id && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={13} className="text-gray-400" />
                      <a href={`mailto:${r.email}`} className="hover:text-[#0d2818] truncate">{r.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={13} className="text-gray-400" />
                      <span>{r.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={13} className="text-gray-400" />
                      <span>Applied: {formatDate(r.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard size={13} className="text-gray-400" />
                      <span>{r.payment_method === 'transfer' ? 'Bank Transfer' : 'Paystack'}</span>
                      {r.sender_name && <span className="text-xs text-gray-400">· {r.sender_name}</span>}
                    </div>
                    {r.verified_at && (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={13} />
                        <span>Verified: {formatDate(r.verified_at)}</span>
                      </div>
                    )}
                    {r.trial_ends_at && (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Clock size={13} />
                        <span>Trial ends: {formatDate(r.trial_ends_at)}</span>
                      </div>
                    )}
                    {r.next_billing_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={13} className="text-gray-400" />
                        <span>Next billing: {formatDate(r.next_billing_date)}</span>
                      </div>
                    )}
                    {r.selected_categories && r.selected_categories.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Globe size={13} className="text-gray-400" />
                        <span>Categories: {r.selected_categories.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Custom domain pending notice */}
                  {r.domain_type === 'custom' && !r.domain_confirmed && r.payment_status === 'verified' && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-amber-800">Custom domain not yet confirmed</p>
                        <p className="text-xs text-amber-700 font-mono">{r.custom_domain}</p>
                      </div>
                      <button
                        onClick={() => handleConfirmDomain(r.id)}
                        disabled={actionLoading === r.id + '-domain'}
                        className="px-3 py-1.5 bg-amber-600 text-white text-xs rounded hover:opacity-90 disabled:opacity-50"
                      >
                        {actionLoading === r.id + '-domain' ? 'Saving...' : 'Mark as Live'}
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* Verify manual payment */}
                    {r.payment_status === 'pending' && r.payment_method === 'transfer' && (
                      <button
                        onClick={() => handleVerify(r.id)}
                        disabled={actionLoading === r.id + '-verify'}
                        className="px-4 py-2 bg-[#0d2818] text-white text-xs rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle size={13} />
                        {actionLoading === r.id + '-verify' ? 'Verifying...' : 'Verify Payment'}
                      </button>
                    )}

                    {/* View store */}
                    {r.payment_status === 'verified' && (
                      <a
                        href={`/${r.store_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-gray-200 text-gray-600 text-xs rounded hover:border-gray-400 flex items-center gap-1.5"
                      >
                        <ExternalLink size={13} /> View Store
                      </a>
                    )}

                    {/* Block / Unblock */}
                    {r.payment_status === 'verified' && (
                      <button
                        onClick={() => handleBlock(r.id, !r.is_blocked)}
                        disabled={actionLoading === r.id + '-block'}
                        className={`px-4 py-2 text-xs rounded flex items-center gap-1.5 disabled:opacity-50 ${
                          r.is_blocked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {r.is_blocked ? <><Unlock size={13} /> Unblock</> : <><Ban size={13} /> Block Store</>}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}