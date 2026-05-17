import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface HeroSettings {
  image_url: string;
  title: string;
  subtitle: string;
  font_family: string;
  title_color: string;
  subtitle_color: string;
  title_size: number;
  subtitle_size: number;
  position: string;
  letter_spacing: number;
  overlay_opacity: number;
  overlay_color: string;
}

const DEFAULT_HERO: HeroSettings = {
  image_url: 'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202025-12-20%20at%2010.00.51%20AM.jpeg',
  title: 'SEE BEYOND',
  subtitle: 'AI-powered clarity.',
  font_family: 'inherit',
  title_color: '#ffffff',
  subtitle_color: '#ffffff',
  title_size: 36,
  subtitle_size: 14,
  position: 'center',
  letter_spacing: 3,
  overlay_opacity: 20,
  overlay_color: '#000000',
};

function positionToFlex(pos: string): React.CSSProperties {
  const [v, h] = pos === 'center' ? ['center', 'center'] : pos.split('-');
  return {
    justifyContent: v === 'top' ? 'flex-start' : v === 'bottom' ? 'flex-end' : 'center',
    alignItems:     h === 'left' ? 'flex-start' : h === 'right'  ? 'flex-end'  : 'center',
  };
}

function positionToTextAlign(pos: string): 'left' | 'center' | 'right' {
  if (pos.endsWith('left'))  return 'left';
  if (pos.endsWith('right')) return 'right';
  return 'center';
}

// ── Jumia Express speeding bike badge ─────────────────────────────────────────
function JumiaExpressBadge() {
  return (
    <div className="flex items-center gap-2.5 group">
      {/* Bike SVG */}
      <div
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
        style={{ filter: 'drop-shadow(1px 1px 0px rgba(0,0,0,0.08))' }}
      >
        <svg
          viewBox="0 0 72 32"
          width="72"
          height="32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* ── Speed / motion lines ── */}
          <line x1="0"  y1="13" x2="8"  y2="13" stroke="#111" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="2"  y1="17" x2="8"  y2="17" stroke="#111" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="4"  y1="21" x2="8"  y2="21" stroke="#111" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>

          {/* ── Rear wheel ── */}
          <circle cx="18" cy="23" r="7"   stroke="#111" strokeWidth="2.2" />
          <circle cx="18" cy="23" r="2.2" fill="#111" />

          {/* ── Delivery box (sits above rear wheel) ── */}
          <rect x="10" y="10" width="15" height="11" rx="1.5" fill="#111" />
          {/* subtle lid line */}
          <line x1="10" y1="14.5" x2="25" y2="14.5" stroke="white" strokeWidth="0.8" opacity="0.35"/>

          {/* ── Main frame ── */}
          <path
            d="M18 16 L28 10 L42 13.5 L57 16"
            stroke="#111" strokeWidth="2.4" strokeLinecap="round" fill="none"
          />

          {/* ── Rider body — leaning aggressively forward ── */}
          <path d="M34 15 C36 9 44 7 45 13 L39 16 Z" fill="#111" />

          {/* ── Helmet / head ── */}
          <circle cx="46" cy="8" r="5" fill="#111" />

          {/* ── Arm to handlebar ── */}
          <line x1="44" y1="13" x2="54" y2="11" stroke="#111" strokeWidth="2" strokeLinecap="round"/>

          {/* ── Fork ── */}
          <line x1="53" y1="12" x2="58" y2="18" stroke="#111" strokeWidth="2.4" strokeLinecap="round"/>

          {/* ── Front wheel ── */}
          <circle cx="58" cy="23" r="7"   stroke="#111" strokeWidth="2.2" />
          <circle cx="58" cy="23" r="2.2" fill="#111" />
        </svg>
      </div>

      {/* Text */}
      <div className="leading-none">
        <p className="text-[11px] font-black tracking-[0.08em] text-black italic">
          JUMIA<span className="text-[#f68b1e] not-italic ml-0.5">★</span>
        </p>
        <p className="text-[8.5px] tracking-[0.18em] text-gray-400 uppercase mt-0.5 font-medium">
          Express Delivery
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface HomeHeroProps {
  themeColor: string;
  onRetailerClick: () => void;
  hasApplied?: boolean;
  user?: any;
}

export default function HomeHero({ themeColor, onRetailerClick, hasApplied, user }: HomeHeroProps) {
  const { store } = useStore();
  const [hero, setHero] = useState<HeroSettings | null>(null);

  // Load Google Fonts
  useEffect(() => {
    if (document.getElementById('hero-gfonts')) return;
    const link = document.createElement('link');
    link.id   = 'hero-gfonts';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    (async () => {
      if (store.isRetailer && store.id) {
        const { data } = await supabase
          .from('profiles')
          .select('hero_settings')
          .eq('id', store.id)
          .single();
        setHero(data?.hero_settings
          ? { ...DEFAULT_HERO, ...data.hero_settings }
          : DEFAULT_HERO
        );
      } else {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'hero_settings')
          .single();
        setHero(data?.value
          ? { ...DEFAULT_HERO, ...data.value }
          : DEFAULT_HERO
        );
      }
    })();
  }, [store.id, store.isRetailer]);

  return (
    <>
      {/* Hero */}
      <section className="relative w-full h-[260px] md:h-[600px] overflow-hidden bg-white">
        {hero && (
          <>
            <img
              src={hero.image_url}
              alt="Hero Banner"
              className="w-full h-full object-contain"
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: hero.overlay_color, opacity: hero.overlay_opacity / 100 }}
            />
            <div
              className="absolute inset-0 flex flex-col px-8 py-6"
              style={positionToFlex(hero.position)}
            >
              {hero.title && (
                <h2 style={{
                  fontFamily:    hero.font_family,
                  fontSize:      `${hero.title_size}px`,
                  color:         hero.title_color,
                  letterSpacing: `${(hero.letter_spacing * 0.1).toFixed(2)}em`,
                  textAlign:     positionToTextAlign(hero.position),
                  fontWeight: 300,
                  margin: 0,
                  opacity: 0,
                  animation: 'fadeInUp 1.2s ease-out forwards',
                }}>
                  {hero.title}
                </h2>
              )}
              {hero.subtitle && (
                <p style={{
                  fontFamily: hero.font_family,
                  fontSize:   `${hero.subtitle_size}px`,
                  color:      hero.subtitle_color,
                  textAlign:  positionToTextAlign(hero.position),
                  margin:     '0.5rem 0 0 0',
                  opacity: 0,
                  animation: 'fadeInUp 1.2s ease-out 0.4s forwards',
                }}>
                  {hero.subtitle}
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* Retailer CTA + Jumia Express badge */}
      {!hasApplied && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5 flex-wrap">
            <button
              onClick={onRetailerClick}
              className="text-white px-6 py-2.5 text-xs tracking-[0.15em] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: themeColor, animation: 'blink 2s ease-in-out infinite' }}
            >
              <TrendingUp size={14} />
              BECOME A RETAILER
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />

            <JumiaExpressBadge />
          </div>
        </section>
      )}

      {hasApplied && user && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5 flex-wrap">
            <a
              href="/retailer"
              className="text-xs tracking-widest border px-5 py-2 flex items-center gap-2 w-fit hover:opacity-80 transition-opacity"
              style={{ borderColor: themeColor, color: themeColor }}
            >
              <TrendingUp size={13} />
              MY RETAILER DASHBOARD
            </a>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />

            <JumiaExpressBadge />
          </div>
        </section>
      )}
    </>
  );
}