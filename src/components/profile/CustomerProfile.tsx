import { useState } from 'react';
import { ArrowLeft, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useCustomerProfile } from './hooks/useCustomerProfile';
import AvatarPickerModal from './AvatarPickerModal';
import QuickActionsGrid from './QuickActionsGrid';
import ImportationSection from './ImportationSection';
import VendorSection from './VendorSection';
import ShippingAddressModal from './ShippingAddressModal';
import InfoModal from './InfoModal';
import TrackOrderModal from './TrackOrderModal';

interface CustomerProfileProps {
  onBack: () => void;
  onRetryPayment: (orderId: string) => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
}

const WHATSAPP_NUMBER = '447404707531';
const QAFRICA_STORE_URL = 'https://qafrica.store';
const JUMIA_STORE_URL = 'https://jforce.jumia.com.ng/s/C6tCHzq';

type ModalKind = 'avatar' | 'address' | 'policies' | 'trust' | 'track' | null;

export default function CustomerProfile({ onBack, onRetryPayment, onNavigateToTerms, onNavigateToPrivacy }: CustomerProfileProps) {
  const { store } = useStore();
  const { profile, orders, loading, error, userId, refetch, updateProfile } = useCustomerProfile();
  const [openModal, setOpenModal] = useState<ModalKind>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-light tracking-wide" style={{ color: store.themeColor }}>My Profile</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-lg shadow-sm max-w-sm w-full border-t-4 border-amber-400">
            <div className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff size={24} className="text-amber-500" />
            </div>
            <h2 className="text-base font-medium text-gray-800 mb-2">Couldn't Load Profile</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              There was a problem reaching the server. Check your connection and try again.
            </p>
            <button
              onClick={refetch}
              className="w-full text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity rounded flex items-center justify-center gap-2"
              style={{ backgroundColor: store.themeColor }}
            >
              <RefreshCw size={13} />
              TRY AGAIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || 'Shopper';

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-light tracking-wide" style={{ color: store.themeColor }}>My Profile</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl font-light">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">{displayName}</p>
            <button
              onClick={() => setOpenModal('avatar')}
              className="text-xs font-medium hover:underline"
              style={{ color: store.themeColor }}
            >
              Edit profile picture
            </button>
          </div>
        </div>

        <ImportationSection orders={orders} themeColor={store.themeColor} />
        <VendorSection orders={orders} themeColor={store.themeColor} onRetryPayment={onRetryPayment} />

        <QuickActionsGrid
          themeColor={store.themeColor}
          onShippingAddress={() => setOpenModal('address')}
          onHelpCenter={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
          onDropShipping={() => window.open(QAFRICA_STORE_URL, '_blank')}
          onJumia={() => window.open(JUMIA_STORE_URL, '_blank')}
          onPolicies={() => setOpenModal('policies')}
          onWhyTrustUs={() => setOpenModal('trust')}
          onTrack={() => setOpenModal('track')}
        />

        {orders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No orders yet</p>
          </div>
        )}
      </div>

      {openModal === 'avatar' && userId && (
        <AvatarPickerModal
          currentAvatarUrl={profile?.avatar_url ?? null}
          userId={userId}
          themeColor={store.themeColor}
          onClose={() => setOpenModal(null)}
          onSaved={async (url) => {
            await updateProfile({ avatar_url: url });
            setOpenModal(null);
          }}
        />
      )}

      {openModal === 'address' && profile && (
        <ShippingAddressModal
          profile={profile}
          themeColor={store.themeColor}
          onClose={() => setOpenModal(null)}
          onSave={updateProfile}
        />
      )}

      {openModal === 'policies' && (
        <InfoModal title="Policies" themeColor={store.themeColor} onClose={() => setOpenModal(null)}>
          <button
            onClick={() => { setOpenModal(null); onNavigateToTerms(); }}
            className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-800"
          >
            Terms of Service
          </button>
          <button
            onClick={() => { setOpenModal(null); onNavigateToPrivacy(); }}
            className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-800"
          >
            Privacy Policy
          </button>
        </InfoModal>
      )}

      {openModal === 'trust' && (
        <InfoModal title="Why Trust Us" themeColor={store.themeColor} onClose={() => setOpenModal(null)}>
          <p>
            Every order is tracked from purchase to delivery, with status updates you can check
            here at any time — nothing gets lost between "paid" and "delivered."
          </p>
          <p>
            Payments go through Paystack or a verified bank transfer, and vendor listings are
            reviewed before they go live on the store.
          </p>
          <p>
            If something goes wrong — an item's unavailable, a delivery is late, a product
            doesn't match — reach the Help Center from this page and a real person will follow up.
          </p>
        </InfoModal>
      )}

      {openModal === 'track' && (
        <TrackOrderModal orders={orders} themeColor={store.themeColor} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
}
