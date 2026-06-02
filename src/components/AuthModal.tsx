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

type AuthView = 'signin' | 'signup' | 'forgot' | 'reset_sent' | 'limit_reached';

const ADMIN_EMAIL = 'opticsview1@gmail.com';

export default function AuthModal({ isOpen, onClose, onViewTerms, onViewPrivacy }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
    setAcceptedTerms(false);
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
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        // Send welcome email — warm, cheerful, no await so it doesn't block
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
        setView('reset_sent');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err: any) {
      setError(err.message);
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

        {/* ── Forgot Password ───────────────────────── */}
        {view === 'forgot' && (
          <>
            <button
              onClick={() => { reset(); setView('signin'); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0d2818] mb-6"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>

            <h2 className="text-2xl font-light text-[#0d2818] mb-2 tracking-wide">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a reset link.</p>

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
                {loading ? 'SENDING...' : 'SEND RESET LINK'}
              </button>
            </form>
          </>
        )}

        {/* ── Reset Sent ────────────────────────────── */}
        {view === 'reset_sent' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-light text-[#0d2818] mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-2">We've sent a password reset link to</p>
            <p className="text-sm font-medium text-[#0d2818] mb-6">{email}</p>
            <p className="text-xs text-gray-400 mb-6">
              The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => { reset(); setView('signin'); }}
              className="text-xs text-gray-500 underline hover:text-[#0d2818]"
            >
              Back to sign in
            </button>
          </div>
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
              href={`mailto:${ADMIN_EMAIL}?subject=Password Reset Request&body=Hi, I need help resetting my password for ${email}`}
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

      </div>
    </div>
  );
}
