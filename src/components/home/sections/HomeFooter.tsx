interface HomeFooterProps {
  store: {
    name: string;
    themeColor: string;
  };
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
}

export default function HomeFooter({
  store,
  onNavigateToPrivacy,
  onNavigateToTerms
}: HomeFooterProps) {
  return (
    <footer className="border-t border-gray-200 py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
        <h2 
          className="text-lg font-light tracking-[0.2em]"
          style={{ color: store.themeColor }}
        >
          {store.name.toUpperCase()}
        </h2>

        <div className="flex gap-8">
          <button 
            onClick={onNavigateToPrivacy}
            className="text-xs text-gray-500 hover:text-black tracking-widest uppercase transition-colors"
          >
            Privacy Policy
          </button>
          <button 
            onClick={onNavigateToTerms}
            className="text-xs text-gray-500 hover:text-black tracking-widest uppercase transition-colors"
          >
            Terms & Conditions
          </button>
        </div>

        <a 
          href="mailto:support@opticsview.store"
          className="text-xs text-gray-600 hover:text-black tracking-wide transition-colors"
        >
          support@opticsview.store
        </a>

        <p className="text-[10px] tracking-widest text-gray-400">
          © {new Date().getFullYear()} {store.name.toLowerCase()}. all rights reserved.
        </p>
      </div>
    </footer>
  );
}
