import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'ov_china_promo_modal_shown';
const PRODUCT_IMAGE_URL =
  'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/0.15789357749478472.webp';

// Shows once ever per browser, on a visitor's first visit (not daily, unlike
// the vendor-recruitment modal). Same click-through destination as the
// mobile home-page banner (qafrica.store/recommendations), just presented
// as a modal so it reaches desktop visitors too.
export default function ChinaPromoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    if (!alreadyShown) {
      // Small delay so it doesn't compete with the initial page render.
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-500 z-10"
        >
          <X size={16} />
        </button>

        <img
          src={PRODUCT_IMAGE_URL}
          alt="Order directly from China"
          className="w-full aspect-square object-cover"
        />

        <a
          href="https://qafrica.store/recommendations"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 bg-red-600 text-white py-3.5 px-4"
        >
          <span className="text-lg leading-none">🇨🇳</span>
          <span
            className="text-xs font-bold tracking-wide uppercase"
            style={{ animation: 'blink 1.4s ease-in-out infinite' }}
          >
            Click to Order Directly from China
          </span>
        </a>
      </div>
    </div>
  );
}
