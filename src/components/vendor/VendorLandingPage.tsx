import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useVendorProgramRules } from './useVendorProgramRules';
import { useVendorManifest } from './hooks/useVendorManifest';
import VendorHero from './sections/VendorHero';
import VendorHowItWorks from './sections/VendorHowItWorks';
import VendorProgramDetails from './sections/VendorProgramDetails';
import VendorSignupForm from './sections/VendorSignupForm';
import VendorAuth from './VendorAuth';
import { useVendorAuth } from './hooks/useVendorAuth';

interface VendorLandingPageProps {
  onBack: () => void;
  onNavigateToDashboard: () => void;
}

export default function VendorLandingPage({ onBack, onNavigateToDashboard }: VendorLandingPageProps) {
  useVendorManifest();
  const { store } = useStore();
  const { rules } = useVendorProgramRules();
  const { user } = useVendorAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const signupRef = useRef<HTMLDivElement>(null);

  const scrollToSignup = () => signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs tracking-widest hover:opacity-70 transition-opacity"
          style={{ color: store.themeColor }}
        >
          <ArrowLeft size={16} /> BACK
        </button>
      </div>

      <VendorHero themeColor={store.themeColor} onGetStarted={scrollToSignup} />
      <VendorHowItWorks themeColor={store.themeColor} rules={rules} />
      <VendorProgramDetails themeColor={store.themeColor} rules={rules} />
      <VendorSignupForm
        ref={signupRef}
        user={user}
        themeColor={store.themeColor}
        onRequestSignIn={() => setIsAuthOpen(true)}
        onGoToDashboard={onNavigateToDashboard}
      />

      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <button
            onClick={() => setIsAuthOpen(false)}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 text-xs tracking-widest text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={15} /> BACK
          </button>
          <VendorAuth themeColor={store.themeColor} onSignedIn={() => setIsAuthOpen(false)} />
        </div>
      )}
    </div>
  );
}
