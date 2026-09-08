import { MapPin, Headset, Rocket, ShoppingBag, FileText, ShieldCheck, Navigation } from 'lucide-react';

interface QuickActionsGridProps {
  themeColor: string;
  onShippingAddress: () => void;
  onHelpCenter: () => void;
  onDropShipping: () => void;
  onJumia: () => void;
  onPolicies: () => void;
  onWhyTrustUs: () => void;
  onTrack: () => void;
}

// Direct equivalents of the qafrica.store reference: Shipping Address,
// Help Center, Drop Shipping, and Jumia keep the same destinations/actions
// as before; Policies/Why Trust Us/Track are OpticsView-native content
// rather than qafrica's own pages.
export default function QuickActionsGrid({
  themeColor, onShippingAddress, onHelpCenter, onDropShipping, onJumia, onPolicies, onWhyTrustUs, onTrack,
}: QuickActionsGridProps) {
  const actions = [
    { label: 'Shipping\nAddress', icon: MapPin, onClick: onShippingAddress },
    { label: 'Help Center', icon: Headset, onClick: onHelpCenter },
    { label: 'Drop\nShipping', icon: Rocket, onClick: onDropShipping },
    { label: 'Jumia', icon: ShoppingBag, onClick: onJumia },
    { label: 'Policies', icon: FileText, onClick: onPolicies },
    { label: 'Why Trust\nUs', icon: ShieldCheck, onClick: onWhyTrustUs },
    { label: 'Track', icon: Navigation, onClick: onTrack },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="grid grid-cols-4 gap-y-5">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center">
                <Icon size={18} style={{ color: themeColor }} />
              </div>
              <span className="text-[10px] text-gray-500 text-center leading-tight whitespace-pre-line">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
