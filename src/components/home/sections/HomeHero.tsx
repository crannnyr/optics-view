import { TrendingUp } from 'lucide-react';

interface HomeHeroProps {
  themeColor: string;
  onRetailerClick: () => void;
}

export default function HomeHero({ themeColor, onRetailerClick }: HomeHeroProps) {
  return (
    <>
      {/* Hero Image Section */}
      <section className="relative w-full h-[260px] md:h-[600px] overflow-hidden">
        <img 
          src="https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202025-12-20%20at%2010.00.51%20AM.jpeg"
          alt="Smart Glasses Hero"
          className="w-full h-full object-contain"
        />

        {/* Animated Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center max-w-3xl px-6">
            <h2 
              className="text-3xl md:text-4xl font-light tracking-[0.3em] text-white mb-3"
              style={{
                animation: 'fadeInUp 1.2s ease-out forwards',
                opacity: 0
              }}
            >
              SEE BEYOND
            </h2>
            <p 
              className="text-sm md:text-base text-white leading-relaxed"
              style={{
                animation: 'fadeInUp 1.2s ease-out 0.4s forwards',
                opacity: 0
              }}
            >
              AI-powered clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Become a Retailer Button Section */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={onRetailerClick}
          className="text-white px-6 py-2.5 text-xs tracking-[0.15em] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
          style={{
            backgroundColor: themeColor,
            animation: 'blink 2s ease-in-out infinite'
          }}
        >
          <TrendingUp size={14} />
          BECOME A RETAILER
        </button>
      </section>
    </>
  );
}
