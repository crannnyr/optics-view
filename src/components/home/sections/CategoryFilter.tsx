interface CategoryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: { slug: string; name: string; image: string | null }[];
  themeColor: string;
}

export default function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
  categories,
  themeColor
}: CategoryFilterProps) {
  const all = [{ slug: 'all', name: 'All', image: null }, ...categories];

  return (
    <section className="py-8 px-4">
      <div className="flex gap-5 justify-center flex-wrap">
        {all.map(cat => {
          const active = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                  active
                    ? 'scale-110 shadow-lg'
                    : 'border-transparent grayscale hover:grayscale-0 hover:scale-105'
                }`}
                style={{ borderColor: active ? themeColor : 'transparent' }}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-xs font-bold tracking-widest"
                    style={{ backgroundColor: themeColor }}
                  >
                    ALL
                  </div>
                )}
              </div>
              <span
                className="text-[11px] tracking-wide uppercase font-medium transition-colors"
                style={{ color: active ? themeColor : '#9ca3af' }}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}