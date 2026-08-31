import { ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useVendorProgramRules } from './useVendorProgramRules';
import { useVendorManifest } from './hooks/useVendorManifest';
import VendorHero from './sections/VendorHero';
import VendorHowItWorks from './sections/VendorHowItWorks';
import VendorProgramDetails from './sections/VendorProgramDetails';

interface VendorLandingPageProps {
  onBack: () => void;
  onNavigateToRegister: () => void;
}

// Marketing-only page now — the actual sign-up/registration form used to be
// embedded here as a scroll-section (VendorSignupForm), which meant "signing
// up" was really just scrolling further down a landing page. That's been
// pulled out into its own standalone page (VendorRegisterPage); this page's
// job is purely to make the case and hand off via a clear CTA.
export default function VendorLandingPage({ onBack, onNavigateToRegister }: VendorLandingPageProps) {
  useVendorManifest();
  const { store } = useStore();
  const { rules } = useVendorProgramRules();

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

      <VendorHero themeColor={store.themeColor} onGetStarted={onNavigateToRegister} />
      <VendorHowItWorks themeColor={store.themeColor} rules={rules} />
      <VendorProgramDetails themeColor={store.themeColor} rules={rules} />

      <div className="max-w-xl mx-auto px-6 py-16 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl mb-3 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Ready to get started?
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          Sign up, tell us what you sell, and you're ready to list your first product.
        </p>
        <button
          onClick={onNavigateToRegister}
          className="inline-flex items-center gap-2 text-white px-8 py-3.5 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: store.themeColor }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
