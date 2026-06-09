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

function HeroSkeleton() {
  return <div className="w-full h-full bg-gray-100 animate-pulse" />;
}

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

interface HomeHeroProps {
  themeColor: string;
  onRetailerClick: () => void;
  hasApplied?: boolean;
  user?: any;
}

export default function HomeHero({ themeColor, onRetailerClick, hasApplied, user }: HomeHeroProps) {
  const { store } = useStore();
  const [hero, setHero] = useState<HeroSettings | null>(null);

  // Load Google Fonts once
  useEffect(() => {
    if (document.getElementById('hero-gfonts')) return;
    const link  = document.createElement('link');
    link.id     = 'hero-gfonts';
    link.rel    = 'stylesheet';
    link.href   =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700' +
      '&family=Cormorant+Garamond:wght@300;400;600' +
      '&family=Montserrat:wght@300;400;700' +
      '&family=Raleway:wght@300;400;700' +
      '&family=Dancing+Script:wght@400;700' +
      '&family=Pacifico' +
      '&family=Great+Vibes' +
      '&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Cache key is store-specific so retailer stores don't share the main store's hero
    const cacheKey = `ov_hero_${store.id || 'main'}`;

    const loadHero = async () => {
      // ── 1. Try sessionStorage first ──────────────────────────────────────
      // sessionStorage lives for the browser tab's lifetime.
      // Same-session revisits (e.g. back button) get instant hero with zero DB queries.
      // New tab or new session always fetches fresh from DB.
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as HeroSettings;
          if (!cancelled) setHero(parsed);
          return; // Skip DB query entirely
        }
      } catch {
        // sessionStorage unavailable (private browsing edge case) — fall through to DB
      }

      // ── 2. Fetch from DB and cache result ────────────────────────────────
      try {
        let settings: HeroSettings | null = null;

        if (store.isRetailer && store.id) {
          const { data } = await supabase
            .from('profiles')
            .select('hero_settings')
            .eq('id', store.id)
            .single();
          settings = data?.hero_settings ?? null;
        } else {
          const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'hero_settings')
            .single();
          settings = data?.value ?? null;
        }

        if (!cancelled) {
          setHero(settings);
          // Cache for this session so back-navigation is instant
          if (settings) {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(settings));
            } catch {
              // sessionStorage full or unavailable — not critical
            }
          }
        }
      } catch {
        // Query failed — skeleton stays visible, no crash
      }
    };

    loadHero();
    return () => { cancelled = true; };
  }, [store.id, store.isRetailer]);

  return (
    <>
      {/* ── Hero section ── */}
      <section className="relative w-full h-[260px] md:h-[600px] overflow-hidden bg-gray-100">
        {hero === null ? (
          <HeroSkeleton />
        ) : (
          <>
            <img
              src={hero.image_url}
              alt="Hero Banner"
              className="w-full h-full object-contain"
              fetchPriority="high"
              decoding="async"
            />

            <div
              className="absolute inset-0"
              style={{
                backgroundColor: hero.overlay_color,
                opacity: hero.overlay_opacity / 100,
              }}
            />

            <div
              className="absolute inset-0 flex flex-col px-8 py-6"
              style={positionToFlex(hero.position)}
            >
              {hero.title && (
                <h2
                  style={{
                    fontFamily:    hero.font_family,
                    fontSize:      `${hero.title_size}px`,
                    color:         hero.title_color,
                    letterSpacing: `${(hero.letter_spacing * 0.1).toFixed(2)}em`,
                    textAlign:     positionToTextAlign(hero.position),
                    fontWeight:    300,
                    margin:        0,
                    opacity:       0,
                    animation:     'fadeInUp 1.2s ease-out forwards',
                  }}
                >
                  {hero.title}
                </h2>
              )}
              {hero.subtitle && (
                <p
                  style={{
                    fontFamily: hero.font_family,
                    fontSize:   `${hero.subtitle_size}px`,
                    color:      hero.subtitle_color,
                    textAlign:  positionToTextAlign(hero.position),
                    margin:     '0.5rem 0 0 0',
                    opacity:    0,
                    animation:  'fadeInUp 1.2s ease-out 0.4s forwards',
                  }}
                >
                  {hero.subtitle}
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── CTA row ── */}
      {!hasApplied && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onRetailerClick}
              className="text-white px-4 md:px-6 py-2.5 text-xs tracking-[0.15em] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg flex-shrink-0"
              style={{ backgroundColor: themeColor, animation: 'blink 2s ease-in-out infinite' }}
            >
              <TrendingUp size={14} />
              BECOME A RETAILER
            </button>
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
            <div className="h-7 w-px bg-gray-200 flex-shrink-0" />
            <JumiaExpressBadge />
          </div>
        </section>
      )}
    </>
  );
}
