import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendEmail } from '../lib/email';
import { X, ArrowLeft, Mail } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
}

// 'reset_sent' and the old hash-based 'new_password' detection are gone —
// replaced by 'enter_code'. The whole reset flow now lives inside this
// modal: no clickable link, no redirect URL, no dependency on this
// component happening to be mounted+open when a link is clicked.
type AuthView = 'signin' | 'signup' | 'forgot' | 'enter_code' | 'limit_reached' | 'new_password';

const ADMIN_EMAIL = 'opticsview1@gmail.com';

export default function AuthModal({ isOpen, onClose, onViewTerms, onViewPrivacy }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setError('');
    setEmail('');
    setPassword('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setFullName('');
    setAcceptedTerms(false);
    setResendMessage('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (view === 'signup' && !acceptedTerms) {
      setError('You must accept the Terms & Conditions to create an account.');
      return;
    }

    setLoading(true);
    try {
      if (view === 'signup') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        // There is no database trigger that creates a `profiles` row on
        // signup — this insert is the ONLY thing that creates it. Without
        // this, the auth account exists but every feature that reads from
        // `profiles` (orders, retailer checks, dashboards) silently breaks
        // for that user. Upsert on id so a retry never errors on duplicate.
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              { id: signUpData.user.id, email, full_name: fullName },
              { onConflict: 'id' }
            );
          if (profileError) {
            // Don't block the person's signup over this — the auth account
            // is already created and they can still sign in. Log loudly so
            // it surfaces instead of silently producing another orphaned
            // account like the ones we just backfilled.
            console.error('Failed to create profile row on signup:', profileError);
          }
        }

        // Send welcome email via Resend
        sendEmail({
          type: 'welcome',
          to_email: email,
          to_name: fullName,
          data: { name: fullName },
        });

      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: request a code. Uses our edge function → Resend, which calls
  // supabase.auth.admin.generateLink under the hood to mint a real
  // recovery OTP (NOT a random code we invent ourselves — it has to be
  // the actual Supabase-issued token or verifyOtp() below won't accept it).
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await sendEmail({
        type: 'password_reset',
        to_email: email,
        data: { email },
      });

      if (result.limit_reached) {
        setView('limit_reached');
      } else if (result.success) {
        setView('enter_code');
      } else {
        // Show the real reason now instead of a generic message —
        // the edge function always returns a specific `error` string.
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend the code from the "enter code" screen without losing place.
  const handleResendCode = async () => {
    setResending(true);
    setResendMessage('');
    setError('');
    try {
      const result = await sendEmail({
        type: 'password_reset',
        to_email: email,
        data: { email },
      });
      if (result.limit_reached) {
        setView('limit_reached');
      } else if (result.success) {
        setResendMessage('A new code has been sent.');
      } else {
        setError(result.error || 'Could not resend the code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: verify the 6-digit code. This exchanges it for a real
  // recovery session — required before updateUser({ password }) below
  // is allowed to succeed.
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (resetCode.trim().length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: resetCode.trim(),
        type: 'recovery',
      });
      if (verifyError) throw verifyError;
      setView('new_password');
    } catch (err: any) {
      setError(err.message || 'That code is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: set the new password. By this point verifyOtp() has already
  // established a valid session, so this just updates it directly.
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please request a new code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 relative rounded-lg shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
          <X size={20} />
        </button>

        {/* ── Sign In / Sign Up ─────────────────────── */}
        {(view === 'signin' || view === 'signup') && (
          <>
            <h2 className="text-2xl font-light text-[#0d2818] mb-6 tracking-wide text-center">
              {view === 'signup' ? 'create account' : 'welcome back'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {view === 'signup' && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                  required
                  minLength={6}
                />
              </div>

              {view === 'signup' && (
                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 accent-[#0d2818]"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-500 leading-tight">
                    I agree to the{' '}
                    <button type="button" onClick={onViewTerms} className="underline text-[#0d2818]">Terms & Conditions</button>
                    {' '}and{' '}
                    <button type="button" onClick={onViewPrivacy} className="underline text-[#0d2818]">Privacy Policy</button>.
                  </label>
                </div>
              )}

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                disabled={loading}
                className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'PROCESSING...' : view === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </button>
            </form>

            {view === 'signin' && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => { reset(); setView('forgot'); }}
                  className="text-xs text-gray-400 hover:text-[#0d2818] underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => { reset(); setView(view === 'signup' ? 'signin' : 'signup'); }}
                className="text-xs text-gray-500 underline hover:text-[#0d2818]"
              >
                {view === 'signup' ? 'already have an account? sign in' : "don't have an account? sign up"}
              </button>
            </div>
          </>
        )}

        {/* ── Forgot Password: request code ─────────── */}
        {view === 'forgot' && (
          <>
            <button
              onClick={() => { reset(); setView('signin'); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0d2818] mb-6"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>

            <h2 className="text-2xl font-light text-[#0d2818] mb-2 tracking-wide">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a 6-digit code.</p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                disabled={loading}
                className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'SENDING...' : 'SEND CODE'}
              </button>
            </form>
          </>
        )}

        {/* ── Enter Code ─────────────────────────────── */}
        {view === 'enter_code' && (
          <>
            <button
              onClick={() => { reset(); setView('forgot'); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0d2818] mb-6"
            >
              <ArrowLeft size={14} /> Use a different email
            </button>

            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-light text-[#0d2818] mb-2 tracking-wide text-center">Enter Your Code</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              We sent a 6-digit code to <span className="font-medium text-[#0d2818]">{email}</span>
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">6-Digit Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full border p-3 text-center text-lg tracking-[0.5em] focus:border-[#0d2818] outline-none"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              {resendMessage && <p className="text-green-600 text-xs">{resendMessage}</p>}
              <button
                disabled={loading}
                className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'VERIFYING...' : 'VERIFY CODE'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleResendCode}
                disabled={resending}
                className="text-xs text-gray-400 hover:text-[#0d2818] underline disabled:opacity-50"
              >
                {resending ? 'Resending...' : "Didn't get it? Resend code"}
              </button>
            </div>
          </>
        )}

        {/* ── Limit Reached ─────────────────────────── */}
        {view === 'limit_reached' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-light text-[#0d2818] mb-2">Unable to send right now</h2>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              We couldn't send your reset email at the moment. Please contact us directly and we'll assist you right away.
            </p>
            <a
              href={`mailto:${ADMIN_EMAIL}?subject=Password Reset Request&body=Hi, I need help resetting my password for the account: ${email}`}
              className="inline-block bg-[#0d2818] text-white px-6 py-3 text-xs tracking-widest hover:opacity-90 rounded mb-4"
            >
              EMAIL US FOR HELP
            </a>
            <br />
            <button
              onClick={() => { reset(); setView('signin'); }}
              className="text-xs text-gray-400 underline hover:text-[#0d2818]"
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* ── New Password (after code verified) ─────── */}
        {view === 'new_password' && (
          <>
            <h2 className="text-2xl font-light text-[#0d2818] mb-2 tracking-wide">Set New Password</h2>
            <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>

            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border p-3 text-sm focus:border-[#0d2818] outline-none"
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                disabled={loading}
                className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
