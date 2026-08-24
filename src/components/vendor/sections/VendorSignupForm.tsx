import { useState, useEffect, forwardRef } from 'react';
import { CheckCircle2, Loader2, LogIn } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface VendorSignupFormProps {
  user: any;
  themeColor: string;
  onRequestSignIn: () => void;
  onGoToDashboard: () => void;
}

const VendorSignupForm = forwardRef<HTMLDivElement, VendorSignupFormProps>(
  function VendorSignupForm({ user, themeColor, onRequestSignIn, onGoToDashboard }, ref) {
    const [checking, setChecking] = useState(true);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
      business_name: '', contact_name: '', phone: '',
      bank_name: '', account_number: '', account_name: '',
    });

    useEffect(() => {
      if (!user) { setChecking(false); return; }
      let cancelled = false;
      supabase
        .from('vendor_registrations')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return;
          setAlreadyRegistered(!!data);
          setChecking(false);
        });
      return () => { cancelled = true; };
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSubmitting(true);
      setError(null);

      const { error: insertError } = await supabase.from('vendor_registrations').insert({
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim(),
        email: user.email,
        phone: form.phone.trim(),
        bank_name: form.bank_name.trim() || null,
        account_number: form.account_number.trim() || null,
        account_name: form.account_name.trim() || null,
        profile_id: user.id,
      });

      if (insertError) {
        setError(insertError.message.includes('duplicate')
          ? "It looks like you're already registered with this email."
          : 'Something went wrong submitting your details. Please try again.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    };

    return (
      <section ref={ref} className="max-w-xl mx-auto px-6 py-16 md:py-20 scroll-mt-6">
        <h2 className="text-2xl md:text-3xl text-center mb-3 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Ready to get started?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          Tell us about your business, then head to your dashboard to list your first product.
        </p>

        {!user ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-600 mb-5">Sign in or create an account first, then come back here to register.</p>
            <button
              onClick={onRequestSignIn}
              className="inline-flex items-center gap-2 text-white px-6 py-3 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeColor }}
            >
              <LogIn size={15} /> Sign In
            </button>
          </div>
        ) : checking ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
        ) : alreadyRegistered || submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle2 size={36} className="mx-auto text-green-600 mb-3" />
            <p className="text-sm font-semibold text-green-800 mb-1">
              {submitted ? "You're registered!" : "You're already a registered vendor."}
            </p>
            <p className="text-xs text-green-700 mb-5">
              You can list your first product right away from your vendor dashboard.
            </p>
            <button
              onClick={onGoToDashboard}
              className="text-white px-6 py-2.5 text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeColor }}
            >
              Go to Vendor Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1.5">Business Name</label>
                <input required value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })}
                  className="w-full border p-2.5 text-sm rounded-lg bg-white outline-none focus:border-black" placeholder="e.g. Ada's Fashion Hub" />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1.5">Contact Name</label>
                <input required value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}
                  className="w-full border p-2.5 text-sm rounded-lg bg-white outline-none focus:border-black" placeholder="Your full name" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1.5">Phone Number</label>
              <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-white outline-none focus:border-black" placeholder="e.g. 08012345678" />
            </div>

            <p className="text-[11px] uppercase tracking-wide text-gray-400 pt-2">Payout details (optional for now)</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-white outline-none focus:border-black" placeholder="Bank name" />
              <input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-white outline-none focus:border-black" placeholder="Account number" />
              <input value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-white outline-none focus:border-black" placeholder="Account name" />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-white py-3.5 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Submitting...' : 'Register as a Vendor'}
            </button>
          </form>
        )}
      </section>
    );
  }
);

export default VendorSignupForm;
