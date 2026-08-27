import { useState, useEffect } from 'react';
import { Store, X } from 'lucide-react';

const STORAGE_KEY = 'ov_vendor_modal_last_shown';

interface DailyVendorModalProps {
  themeColor: string;
  onNavigateToVendor: () => void;
}

// Shows once per calendar day per browser, to any visitor — logged in or
// not — promoting the "sell your product / become a vendor" feature.
// Tracked in localStorage rather than a DB column since it's a marketing
// nudge, not data that needs to survive a device change.
export default function DailyVendorModal({ themeColor, onNavigateToVendor }: DailyVendorModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown !== today) {
      // Small delay so it doesn't compete with the initial page render.
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, today);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
        >
          <X size={16} />
        </button>

        <div className="p-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: `${themeColor}1a` }}
          >
            <Store size={26} style={{ color: themeColor }} />
          </div>

          <h3 className="text-lg font-medium text-[#0d2818] mb-3 leading-snug">
            Do you have what it takes to sell your products on OpticsView?
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            We've crossed over <strong>1,000 sales</strong> in just a couple of days.
            Click the link in the sidebar to get started.
          </p>

          <button
            onClick={() => { setOpen(false); onNavigateToVendor(); }}
            className="w-full text-white py-3 text-sm font-medium tracking-wide rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: themeColor }}
          >
            Get Started
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full text-xs text-gray-400 mt-3 hover:text-gray-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
