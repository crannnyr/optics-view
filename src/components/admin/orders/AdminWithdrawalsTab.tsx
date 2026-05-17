import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Wallet, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  withdrawals: any[];
  statusLoading: string | null;
  processWithdrawal: (id: string, action: 'approve' | 'reject', note?: string) => void;
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function AdminWithdrawalsTab({ withdrawals, statusLoading, processWithdrawal }: Props) {
  const [filter, setFilter]         = useState<Filter>('pending');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [adminNote, setAdminNote]   = useState<Record<string, string>>({});

  const filtered = withdrawals.filter(w => filter === 'all' || w.status === filter);

  const counts = {
    all:      withdrawals.length,
    pending:  withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Wallet size={22} className="text-[#0d2818]" />
        <h2 className="text-xl font-light text-[#0d2818]">Withdrawal Requests</h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending','all','approved','rejected'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs uppercase tracking-wide rounded-full border transition-all flex items-center gap-1.5 ${
              filter === f ? 'bg-[#0d2818] text-white border-[#0d2818]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {f} <span className="text-[10px] opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-lg text-gray-400">
          <Wallet size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No {filter === 'all' ? '' : filter} withdrawals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(wd => {
            const isExpanded = expanded === wd.id;
            const loading    = statusLoading === wd.id;

            return (
              <div key={wd.id} className="bg-white border rounded-lg overflow-hidden">
                {/* Row */}
                <div className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-[#0d2818]/10 flex items-center justify-center text-[#0d2818] font-bold text-sm shrink-0">
                      {(wd.retailer?.store_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-[#0d2818] truncate">{wd.retailer?.store_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 truncate">{wd.retailer?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0d2818]">₦{Number(wd.amount_requested).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">Net: ₦{Number(wd.net_amount).toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wide flex items-center gap-1 ${STATUS_STYLE[wd.status] ?? ''}`}>
                      {wd.status === 'pending' && <Clock size={10} />}
                      {wd.status === 'approved' && <CheckCircle size={10} />}
                      {wd.status === 'rejected' && <XCircle size={10} />}
                      {wd.status}
                    </span>
                    <button onClick={() => setExpanded(isExpanded ? null : wd.id)} className="p-1.5 hover:bg-gray-100 rounded-full">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4">
                    {/* Bank + fee breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        ['Bank', wd.bank_name],
                        ['Account No.', wd.account_number],
                        ['Account Name', wd.account_name],
                        ['Date', new Date(wd.created_at).toLocaleDateString('en-NG')],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="text-gray-400 mb-0.5">{label}</p>
                          <p className="font-medium text-gray-800 font-mono">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 border rounded p-3 text-xs space-y-1">
                      <div className="flex justify-between text-gray-500">
                        <span>Requested</span><span>₦{Number(wd.amount_requested).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Fee (12%)</span><span>−₦{Number(wd.fee_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#0d2818] border-t pt-1">
                        <span>To Send</span><span>₦{Number(wd.net_amount).toLocaleString()}</span>
                      </div>
                    </div>

                    {wd.admin_note && (
                      <p className="text-xs text-gray-500 italic">Admin note: "{wd.admin_note}"</p>
                    )}

                    {/* Actions — only for pending */}
                    {wd.status === 'pending' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Admin note (optional)"
                          value={adminNote[wd.id] || ''}
                          onChange={e => setAdminNote(prev => ({ ...prev, [wd.id]: e.target.value }))}
                          className="w-full border p-2 text-xs rounded focus:border-[#0d2818] outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => processWithdrawal(wd.id, 'reject', adminNote[wd.id])}
                            disabled={loading}
                            className="flex-1 py-2.5 text-xs bg-red-100 text-red-700 border border-red-200 rounded hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {loading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Reject & Refund
                          </button>
                          <button
                            onClick={() => processWithdrawal(wd.id, 'approve', adminNote[wd.id])}
                            disabled={loading}
                            className="flex-1 py-2.5 text-xs bg-[#0d2818] text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Approve Payout
                          </button>
                        </div>
                      </div>
                    )}

                    {wd.processed_at && (
                      <p className="text-[10px] text-gray-400">
                        Processed: {new Date(wd.processed_at).toLocaleString('en-NG')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}