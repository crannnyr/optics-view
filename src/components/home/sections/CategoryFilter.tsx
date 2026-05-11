import { Grid3x3, Video, Headphones, Gift } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categoryDescriptions: Record<string, string>;
  themeColor: string;
}

export default function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
  categoryDescriptions,
  themeColor
}: CategoryFilterProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex gap-6 justify-center flex-wrap items-center">
        {/* ALL */}
        <button
          onClick={() => setSelectedCategory('all')}
          className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
            selectedCategory === 'all'
              ? 'text-white shadow-lg scale-110'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={selectedCategory === 'all' ? { backgroundColor: themeColor } : {}}
        >
          <Grid3x3 size={16} className="md:w-6 md:h-6" />
        </button>

        {/* VIDEO */}
        <button
          onClick={() => setSelectedCategory('video')}
          className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
            selectedCategory === 'video'
              ? 'text-white shadow-lg scale-110'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={selectedCategory === 'video' ? { backgroundColor: themeColor } : {}}
        >
          <Video size={16} className="md:w-6 md:h-6" />
        </button>

        {/* AUDIO ONLY */}
        <button
          onClick={() => setSelectedCategory('audio_only')}
          className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
            selectedCategory === 'audio_only'
              ? 'text-white shadow-lg scale-110'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={selectedCategory === 'audio_only' ? { backgroundColor: themeColor } : {}}
        >
          <Headphones size={16} className="md:w-6 md:h-6" />
        </button>

        {/* COMBO */}
        <button
          onClick={() => setSelectedCategory('combo')}
          className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
            selectedCategory === 'combo'
              ? 'bg-green-600 text-white shadow-lg scale-110'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          style={{
            animation: selectedCategory !== 'combo' ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }}
        >
          <Gift size={16} className="md:w-6 md:h-6" />
        </button>
      </div>

      {/* Category Description */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto">
          {categoryDescriptions[selectedCategory] || categoryDescriptions['all']}
        </p>
      </div>
    </section>
  );
}
