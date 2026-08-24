import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useVendorProgramRules } from './useVendorProgramRules';
import VendorHero from './sections/VendorHero';
import VendorHowItWorks from './sections/VendorHowItWorks';
import VendorProgramDetails from './sections/VendorProgramDetails';
import VendorSignupForm from './sections/VendorSignupForm';
import AuthModal from '../AuthModal';

interface VendorLandingPageProps {
  user: any;
  onBack: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
  onNavigateToDashboard: () => void;
}

export default function VendorLandingPage({ user, onBack, onNavigateToPrivacy, onNavigateToTerms, onNavigateToDashboard }: VendorLandingPageProps) {
  const { store } = useStore();
  const { rules } = useVendorProgramRules();
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onViewTerms={onNavigateToTerms}
        onViewPrivacy={onNavigateToPrivacy}
      />
    </div>
  );
}
