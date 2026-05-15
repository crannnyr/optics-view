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

interface HomeHeroProps {
  themeColor: string;
  onRetailerClick: () => void;
  hasApplied?: boolean;
  user?: any;
}

export default function HomeHero({ themeColor, onRetailerClick, hasApplied, user }: HomeHeroProps) {
  const { store } = useStore();
  const [hero, setHero] = useState<HeroSettings>(DEFAULT_HERO);

  // Load Google Fonts (same set as admin + retailer editors)
  useEffect(() => {
    if (document.getElementById('hero-gfonts')) return;
    const link = document.createElement('link');
    link.id   = 'hero-gfonts';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;700&family=Raleway:wght@300;400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&display=swap';
    document.head.appendChild(link);
  }, []);

  // Fetch hero settings:
  //   • Retailer store → profiles.hero_settings — falls back to DEFAULT_HERO if not set
  //   • Main store     → app_settings key='hero_settings'
  useEffect(() => {
    (async () => {
      if (store.isRetailer && store.id) {
        const { data } = await supabase
          .from('profiles')
          .select('hero_settings')
          .eq('id', store.id)
          .single();
        // Merge with DEFAULT_HERO so unset fields always have a safe value
        if (data?.hero_settings) {
          setHero({ ...DEFAULT_HERO, ...data.hero_settings });
        }
        // else: stays as DEFAULT_HERO — retailer hasn't customised yet
      } else {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'hero_settings')
          .single();
        if (data?.value) setHero({ ...DEFAULT_HERO, ...data.value });
      }
    })();
  }, [store.id, store.isRetailer]);

  const flexStyle = positionToFlex(hero.position);
  const textAlign = positionToTextAlign(hero.position);

  return (
    <>
      {/* Hero */}
      <section className="relative w-full h-[260px] md:h-[600px] overflow-hidden bg-white">
        <img
          src={hero.image_url}
          alt="Hero Banner"
          className="w-full h-full object-contain"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: hero.overlay_color,
            opacity: hero.overlay_opacity / 100,
          }}
        />

        {/* Text */}
        <div className="absolute inset-0 flex flex-col px-8 py-6" style={flexStyle}>
          {hero.title && (
            <h2
              style={{
                fontFamily:    hero.font_family,
                fontSize:      `${hero.title_size}px`,
                color:         hero.title_color,
                letterSpacing: `${(hero.letter_spacing * 0.1).toFixed(2)}em`,
                textAlign,
                fontWeight: 300,
                margin: 0,
                opacity: 0,
                animation: 'fadeInUp 1.2s ease-out forwards',
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
                textAlign,
                margin:     '0.5rem 0 0 0',
                opacity: 0,
                animation: 'fadeInUp 1.2s ease-out 0.4s forwards',
              }}
            >
              {hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Retailer CTA — original logic, shows on all stores */}
      {!hasApplied && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={onRetailerClick}
            className="text-white px-6 py-2.5 text-xs tracking-[0.15em] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: themeColor, animation: 'blink 2s ease-in-out infinite' }}
          >
            <TrendingUp size={14} />
            BECOME A RETAILER
          </button>
        </section>
      )}

      {hasApplied && user && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <a
            href="/retailer"
            className="text-xs tracking-widest border px-5 py-2 flex items-center gap-2 w-fit hover:opacity-80 transition-opacity"
            style={{ borderColor: themeColor, color: themeColor }}
          >
            <TrendingUp size={13} />
            MY RETAILER DASHBOARD
          </a>
        </section>
      )}
    </>
  );
}