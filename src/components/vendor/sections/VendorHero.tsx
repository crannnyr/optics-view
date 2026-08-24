import { ArrowRight } from 'lucide-react';

interface VendorHeroProps {
  themeColor: string;
  onGetStarted: () => void;
}

// The signature visual: a single product node radiating out to a network of
// storefronts. This is the actual mechanic being sold here — one shipment,
// many retailer sites reselling it — so the diagram carries real meaning
// rather than being decorative.
function RetailerNetworkDiagram({ themeColor }: { themeColor: string }) {
  const nodes = [
    { x: 340, y: 40 }, { x: 470, y: 90 }, { x: 520, y: 200 },
    { x: 470, y: 310 }, { x: 340, y: 360 }, { x: 210, y: 310 },
    { x: 160, y: 200 }, { x: 210, y: 90 },
  ];
  const center = { x: 340, y: 200 };

  return (
    <svg viewBox="0 0 680 400" className="w-full h-auto" role="img" aria-label="One product, distributed across a network of retailer storefronts">
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1={center.x} y1={center.y} x2={n.x} y2={n.y} stroke={themeColor} strokeOpacity="0.18" strokeWidth="1.5" />
          <circle r="3" fill={themeColor}>
            <animateMotion
              dur={`${3 + (i % 3)}s`}
              repeatCount="indefinite"
              path={`M${center.x},${center.y} L${n.x},${n.y}`}
            />
          </circle>
          <circle cx={n.x} cy={n.y} r="22" fill="white" stroke={themeColor} strokeOpacity="0.35" strokeWidth="1.5" />
          <circle cx={n.x} cy={n.y} r="6" fill={themeColor} fillOpacity="0.55" />
        </g>
      ))}
      <circle cx={center.x} cy={center.y} r="46" fill={themeColor} />
      <circle cx={center.x} cy={center.y} r="46" fill="none" stroke={themeColor} strokeOpacity="0.25" strokeWidth="10" />
      <text x={center.x} y={center.y - 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" letterSpacing="0.5">
        YOUR
      </text>
      <text x={center.x} y={center.y + 11} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" letterSpacing="0.5">
        PRODUCT
      </text>
    </svg>
  );
}

export default function VendorHero({ themeColor, onGetStarted }: VendorHeroProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-14 pb-10 md:pt-20 md:pb-16 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] font-semibold mb-4" style={{ color: themeColor }}>
          Vendor Program
        </p>
        <h1
          className="text-4xl md:text-5xl leading-[1.1] mb-5 text-gray-900"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Why your products get sold out in a month
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-md">
          Ship us your stock once. We list it, and a whole network of retailers running their
          own stores on this platform can import it straight into their catalogs and sell it at
          whatever price they choose. You get paid on every sale — without running a single ad
          yourself.
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 text-white px-7 py-3.5 text-sm font-semibold tracking-wide rounded-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor }}
        >
          Become a Vendor <ArrowRight size={16} />
        </button>
      </div>
      <div className="max-w-md mx-auto w-full">
        <RetailerNetworkDiagram themeColor={themeColor} />
      </div>
    </section>
  );
}
