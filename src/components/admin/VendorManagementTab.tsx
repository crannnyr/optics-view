import { useState } from 'react';
import { Loader2, Users, Mail, Ban, CheckCircle2, ChevronDown, Sparkles, AlertTriangle } from 'lucide-react';
import { useVendorManagement, EMAIL_PRESETS, ManagedVendor } from './hooks/useVendorManagement';

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  blocked:   'bg-gray-200 text-gray-700',
};

function VendorRow({ vendor, busy, onSetStatus, onSendPreset }: {
  vendor: ManagedVendor; busy: boolean;
  onSetStatus: (v: ManagedVendor, s: string) => void;
  onSendPreset: (v: ManagedVendor, p: typeof EMAIL_PRESETS[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [presetKey, setPresetKey] = useState(EMAIL_PRESETS[0].key);
  const [sent, setSent] = useState(false);

  const days = (iso: string | null) =>
    iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="bg-white border border-gray-200">
      <button onClick={() => setOpen(o => !o)} className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition-colors">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-medium truncate">{vendor.business_name}</p>
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${STATUS_STYLE[vendor.status] || 'bg-gray-100 text-gray-600'}`}>
              {vendor.status}
            </span>
            {vendor.campaignEndsAt && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                <Sparkles size={9} /> Campaign {days(vendor.campaignEndsAt)}d
              </span>
            )}
            {vendor.sponsorshipEndsAt && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                Sponsored {days(vendor.sponsorshipEndsAt)}d
              </span>
            )}
            {vendor.failedDeliveries > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 flex items-center gap-1">
                <AlertTriangle size={9} /> {vendor.failedDeliveries}/5 failed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">
            {vendor.email}{vendor.phone ? ` · ${vendor.phone}` : ''} · {vendor.liveCount} live
            {vendor.pendingCount > 0 ? ` · ${vendor.pendingCount} awaiting review` : ''}
          </p>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div><span className="text-gray-400">Contact:</span> {vendor.contact_name || '—'}</div>
            <div><span className="text-gray-400">Joined:</span> {new Date(vendor.created_at).toLocaleDateString()}</div>
            <div><span className="text-gray-400">Bank:</span> {vendor.bank_name || '—'}</div>
            <div><span className="text-gray-400">Account:</span> {vendor.account_number || '—'} {vendor.account_name ? `(${vendor.account_name})` : ''}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={presetKey}
              onChange={e => { setPresetKey(e.target.value); setSent(false); }}
              className="flex-1 border p-2 text-xs rounded bg-white outline-none focus:border-black"
            >
              {EMAIL_PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <button
              onClick={async () => {
                const preset = EMAIL_PRESETS.find(p => p.key === presetKey)!;
                await onSendPreset(vendor, preset);
                setSent(true);
              }}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 bg-[#0d2818] text-white text-xs tracking-wide px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 rounded"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : sent ? <CheckCircle2 size={12} /> : <Mail size={12} />}
              {sent ? 'Sent' : 'Send Email'}
            </button>
          </div>

          <div className="flex gap-2">
            {vendor.status === 'active' ? (
              <button
                onClick={() => onSetStatus(vendor, 'suspended')}
                disabled={busy}
                className="flex items-center gap-1.5 border border-red-300 text-red-600 text-xs px-3 py-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Ban size={12} /> Suspend
              </button>
            ) : (
              <button
                onClick={() => onSetStatus(vendor, 'active')}
                disabled={busy}
                className="flex items-center gap-1.5 border border-green-300 text-green-700 text-xs px-3 py-1.5 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={12} /> Reactivate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorManagementTab() {
  const { vendors, loading, busyId, setStatus, sendPreset } = useVendorManagement();
  const [query, setQuery] = useState('');

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#0d2818]" size={32} /></div>;
  }

  const filtered = vendors.filter(v => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return v.business_name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-light">Vendor Management</h2>
        <p className="text-sm text-gray-500 mt-1">{vendors.length} registered vendors</p>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by business name or email"
        className="w-full border p-2.5 text-sm rounded mb-4 bg-gray-50 focus:bg-white outline-none focus:border-black"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No vendors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <VendorRow
              key={v.id} vendor={v} busy={busyId === v.id}
              onSetStatus={setStatus} onSendPreset={sendPreset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
