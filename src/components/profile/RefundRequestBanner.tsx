import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../lib/email';

interface RefundRequest {
  id: string;
  order_id: string;
  amount: number;
  status: 'awaiting_customer_details' | 'submitted' | 'processed';
}

export default function RefundRequestBanner({ themeColor }: { themeColor: string }) {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('refund_requests')
      .select('id, order_id, amount, status')
      .in('status', ['awaiting_customer_details', 'submitted'])
      .order('created_at', { ascending: false });
    setRequests((data as RefundRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (req: RefundRequest) => {
    if (!form.bank_name || !form.account_number || !form.account_name) return;
    setSubmittingId(req.id);

    await supabase
      .from('refund_requests')
      .update({
        status: 'submitted',
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_name: form.account_name,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', req.id);

    // Admin gets notified only now — once there's actually something for
    // them to act on (before this, the refund is just sitting waiting).
    const { data: { user } } = await supabase.auth.getUser();
    sendEmail({
      type: 'refund_details_submitted',
      to_email: 'opticsview1@gmail.com',
      data: {
        order_id: req.order_id,
        amount: req.amount,
        customer_email: user?.email,
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_name: form.account_name,
      },
    });

    setSubmittingId(null);
    setOpenId(null);
    setForm({ bank_name: '', account_number: '', account_name: '' });
    fetchRequests();
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              {req.status === 'submitted' ? (
                <>
                  <p className="text-sm font-medium text-amber-900">Refund of ₦{req.amount.toLocaleString()} — details submitted</p>
                  <p className="text-xs text-amber-700 mt-0.5">We're processing it. This usually takes a few business days.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-amber-900">
                    Part of your order (#{req.order_id.slice(0, 8).toUpperCase()}) was cancelled — a refund of ₦{req.amount.toLocaleString()} is ready to process.
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5 mb-3">Please submit your bank account details so we can send it to you.</p>

                  {openId === req.id ? (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        placeholder="Bank name"
                        value={form.bank_name}
                        onChange={e => setForm({ ...form, bank_name: e.target.value })}
                        className="w-full border border-amber-200 rounded p-2 text-sm outline-none focus:border-amber-400 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Account number"
                        value={form.account_number}
                        onChange={e => setForm({ ...form, account_number: e.target.value })}
                        className="w-full border border-amber-200 rounded p-2 text-sm outline-none focus:border-amber-400 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Account name"
                        value={form.account_name}
                        onChange={e => setForm({ ...form, account_name: e.target.value })}
                        className="w-full border border-amber-200 rounded p-2 text-sm outline-none focus:border-amber-400 bg-white"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleSubmit(req)}
                          disabled={submittingId === req.id || !form.bank_name || !form.account_number || !form.account_name}
                          className="flex items-center gap-1.5 text-white text-xs font-medium px-4 py-2 rounded-full disabled:opacity-50"
                          style={{ backgroundColor: themeColor }}
                        >
                          {submittingId === req.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Submit
                        </button>
                        <button
                          onClick={() => setOpenId(null)}
                          className="text-xs font-medium px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOpenId(req.id)}
                      className="text-xs font-medium px-4 py-2 rounded-full text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      Submit Bank Details
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
