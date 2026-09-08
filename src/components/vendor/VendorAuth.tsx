import { useState } from 'react';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { vendorSupabase } from '../../lib/vendorSupabase';
import { sendEmail } from '../../lib/email';

// 'reset' (request the code) -> 'enter_code' -> 'new_password'. This
// mirrors the customer/retailer flow in AuthModal.tsx exactly: same
// send-emails 'password_reset' template, same real Supabase recovery
// OTP under the hood, same verifyOtp()+updateUser() finish. Vendors
// used to fall back to Supabase's raw default reset email (unbranded,
// link-based, low default deliverability) — this brings them to parity.
type Mode = 'signin' | 'signup' | 'reset' | 'enter_code' | 'new_password';

interface VendorAuthProps {
  themeColor: string;
  onSignedIn: () => void;
}

export default function VendorAuth({ themeColor, onSignedIn }: VendorAuthProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = (next: Mode) => {
    setMode(next); setError(null); setNotice(null);
    setResetCode(''); setNewPassword(''); setConfirmPassword('');
  };

  const requestCode = async () => {
    const result = await sendEmail({ type: 'password_reset', to_email: email.trim(), data: { email: email.trim() } });
    if (result.success) {
      setMode('enter_code');
      setNotice(null);
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError(null);
    try {
      const result = await sendEmail({ type: 'password_reset', to_email: email.trim(), data: { email: email.trim() } });
      if (result.success) setNotice('A new code has been sent.');
      else setError(result.error || 'Could not resend the code. Please try again.');
    } catch (err: any) {
      setError(err?.message || 'Could not resend the code. Please try again.');
    }
    setResending(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (resetCode.trim().length < 6) { setError('Enter the 6-digit code from your email.'); return; }
    setBusy(true);
    try {
      const { error } = await vendorSupabase.auth.verifyOtp({ email: email.trim(), token: resetCode.trim(), type: 'recovery' });
      if (error) throw error;
      setMode('new_password');
    } catch (err: any) {
      setError(err?.message || 'That code is invalid or has expired. Please request a new one.');
    }
    setBusy(false);
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const { error } = await vendorSupabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      onSignedIn();
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please request a new code and try again.');
    }
    setBusy(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === 'signin') {
        const { error } = await vendorSupabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onSignedIn();

      } else if (mode === 'signup') {
        const { data, error } = await vendorSupabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), account_type: 'vendor' },
            emailRedirectTo: `${window.location.origin}/vendor-dashboard`,
          },
        });
        if (error) throw error;

        // Welcome email on top of Supabase's own confirmation mail.
        sendEmail({
          type: 'notification',
          to_email: email.trim(),
          to_name: fullName.trim() || 'there',
          data: {
            subject: 'Welcome — finish setting up your vendor account',
            title: 'Welcome to the vendor program',
            message: `Hi ${fullName.trim() || 'there'}, your vendor account has been created. Sign in to register your business and list your first product — every vendor starts with the Sold Out Campaign.`,
          },
        }).catch(() => {});

        if (data.session) onSignedIn();
        else setNotice('Check your inbox to confirm your email address, then sign in.');

      } else if (mode === 'reset') {
        await requestCode();
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    }
    setBusy(false);
  };

  const heading = mode === 'signin' ? 'Vendor sign in'
    : mode === 'signup' ? 'Create your vendor account'
    : mode === 'enter_code' ? 'Enter your code'
    : mode === 'new_password' ? 'Set a new password'
    : 'Reset your password';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Vendor Portal</p>
        <h1 className="text-xl font-medium text-gray-900 mb-1">{heading}</h1>
        <p className="text-xs text-gray-500 mb-6">
          This is separate from your shopper account on the main store.
        </p>

        {notice ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-2.5 mb-5">
            <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800">{notice}</p>
          </div>
        ) : null}

        {mode === 'enter_code' ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-xs text-gray-500 -mt-2">
              We sent a 6-digit code to <span className="font-medium text-gray-800">{email}</span>. Enter it below.
            </p>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1.5">Reset Code</label>
              <input
                required inputMode="numeric" maxLength={6} value={resetCode}
                onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black tracking-[0.4em] text-center"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

            <button
              type="submit" disabled={busy}
              className="w-full text-white py-3 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Verify Code
            </button>

            <button
              type="button" disabled={resending} onClick={handleResendCode}
              className="w-full text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {resending ? 'Resending…' : "Didn't get a code? Resend"}
            </button>
          </form>
        ) : mode === 'new_password' ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1.5">New Password</label>
              <input
                required type="password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1.5">Confirm Password</label>
              <input
                required type="password" minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black"
                placeholder="Re-enter password"
              />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

            <button
              type="submit" disabled={busy}
              className="w-full text-white py-3 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Set New Password
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1.5">Your Name</label>
                <input
                  required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black"
                  placeholder="Full name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1.5">Email</label>
              <input
                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black"
                placeholder="you@business.com"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1.5">Password</label>
                <input
                  required type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black"
                  placeholder="At least 8 characters"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

            <button
              type="submit" disabled={busy}
              className="w-full text-white py-3 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Code'}
            </button>
          </form>
        )}

        <div className="mt-5 space-y-2 text-center">
          {mode === 'signin' && (
            <>
              <button onClick={() => reset('reset')} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mx-auto">
                <Mail size={12} /> Forgot your password?
              </button>
              <p className="text-xs text-gray-500">
                New here?{' '}
                <button onClick={() => reset('signup')} className="font-semibold hover:underline" style={{ color: themeColor }}>
                  Create a vendor account
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <button onClick={() => reset('signin')} className="font-semibold hover:underline" style={{ color: themeColor }}>
                Sign in
              </button>
            </p>
          )}
          {(mode === 'reset' || mode === 'enter_code' || mode === 'new_password') && (
            <button onClick={() => reset('signin')} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mx-auto">
              <ArrowLeft size={12} /> Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
