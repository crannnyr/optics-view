import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // New props to link to legal pages from the modal
  onViewTerms: () => void;
  onViewPrivacy: () => void;
}

export default function AuthModal({ isOpen, onClose, onViewTerms, onViewPrivacy }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New State for Terms Agreement
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && !acceptedTerms) {
      setError('You must accept the Terms & Conditions to create an account.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }, 
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      onClose(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-light text-[#0d2818] mb-6 tracking-wide text-center">
          {isSignUp ? 'create account' : 'welcome back'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
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

          {/* CHECKBOX FOR SIGN UP */}
          {isSignUp && (
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
            className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setAcceptedTerms(false);
            }}
            className="text-xs text-gray-500 underline hover:text-[#0d2818]"
          >
            {isSignUp ? 'already have an account? sign in' : "don't have an account? sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}