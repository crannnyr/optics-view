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

// ── Jumia Express badge (text only, no bike) ──────────────────────────────────
function JumiaExpressBadge() {
  return (
    <div className="flex flex-col leading-none flex-shrink-0">
      <p className="text-[11px] font-black tracking-[0.08em] text-black italic whitespace-nowrap">
        JUMIA<span className="text-[#f68b1e] not-italic ml-0.5">★</span>
      </p>
      <p className="text-[8.5px] tracking-[0.16em] text-gray-400 uppercase mt-0.5 font-medium whitespace-nowrap">
        Express Delivery
      </p>
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

      {/* CTA row — flex-nowrap keeps button + badge on one line on all screens */}
      {!hasApplied && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onRetailerClick}
              className="text-white px-4 md:px-6 py-2.5 text-xs tracking-[0.15em] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg flex-shrink-0"
              style={{ backgroundColor: themeColor, animation: 'blink 2s ease-in-out infinite' }}
            >
              <TrendingUp size={14} />
              <span className="hidden xs:inline">BECOME A RETAILER</span>
              <span className="xs:hidden">RETAILER</span>
            </button>

            {/* Divider */}
            <div className="h-7 w-px bg-gray-200 flex-shrink-0" />

            <JumiaExpressBadge />
          </div>
        </section>
      )}

      {hasApplied && user && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <a
              href="/retailer"
              className="text-xs tracking-widest border px-4 md:px-5 py-2 flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{ borderColor: themeColor, color: themeColor }}
            >
              <TrendingUp size={13} />
              MY DASHBOARD
            </a>

            {/* Divider */}
            <div className="h-7 w-px bg-gray-200 flex-shrink-0" />

            <JumiaExpressBadge />
          </div>
        </section>
      )}
    </>
  );
}