'use client';
import { useRef } from 'react';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };

  const stopDrag = () => { isDragging.current = false; };

  return (
    <section className="py-4 px-4">
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {all.map(cat => {
          const active = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                  active ? 'scale-110 shadow-md' : 'border-transparent grayscale hover:grayscale-0 hover:scale-105'
                }`}
                style={{ borderColor: active ? themeColor : 'transparent' }}
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-[9px] font-bold tracking-widest"
                    style={{ backgroundColor: themeColor }}
                  >
                    ALL
                  </div>
                )}
              </div>
              <span
                className="text-[9px] tracking-wide uppercase font-medium transition-colors"
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