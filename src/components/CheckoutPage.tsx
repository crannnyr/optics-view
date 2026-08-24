import { ArrowLeft, Loader2, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCheckout, HOME_DELIVERY_FEE } from './checkout/hooks/useCheckout';
import { CartItem } from '../lib/supabase';

import CheckoutHeader from './checkout/CheckoutHeader';
import ShippingStep from './checkout/steps/ShippingStep';
import PaymentMethodStep from './checkout/steps/PaymentMethodStep';
import PaymentExecutionStep from './checkout/steps/PaymentExecutionStep';

interface CheckoutPageProps {
  items: CartItem[];
  onBack: () => void;
  onSuccess: () => void;
  retryOrderId?: string | null;
}

export default function CheckoutPage({ items, onBack, onSuccess, retryOrderId }: CheckoutPageProps) {
  const {
    store,
    step,
    loading,
    paymentMethod,
    setPaymentMethod,
    shippingData,
    setShippingData,
    shippingError,
    paystackConfig,
    settings,
    copied,
    transferDetails,
    senderName,
    setSenderName,
    totalItems,
    subtotal,
    totalOrderAmount,
    payableAmount,
    isRetryMode,
    retryError,
    calculateShipping,
    handleShippingSubmit,
    handleCopyAccount,
    createOrder,
    handleTransferComplete,
    handlePaystackSuccess,
    handlePaystackClose,
  } = useCheckout({ isOpen: true, items, onSuccess, retryOrderId });

  // ── Retry order failed to load (not found, not yours, already resolved) ──
  if (retryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-lg shadow-sm max-w-sm w-full border-t-4 border-red-400">
          <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-base font-medium text-gray-800 mb-2">Can't Retry This Order</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{retryError}</p>
          <button
            onClick={onBack}
            className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity rounded"
          >
            BACK TO MY PURCHASES
          </button>
        </div>
      </div>
    );
  }

  // ── Retry order still loading — nothing to render yet ─────────────────────
  if (retryOrderId && !isRetryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  // ── Reached /checkout directly with nothing to check out ──────────────────
  if (!retryOrderId && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-lg shadow-sm max-w-sm w-full">
          <ShoppingBag size={40} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-base font-medium text-gray-800 mb-2">Your bag is empty</h2>
          <p className="text-sm text-gray-500 mb-6">Add something to your bag before checking out.</p>
          <button
            onClick={onBack}
            className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity rounded"
          >
            BACK TO SHOP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg md:max-w-2xl mx-auto bg-white min-h-screen shadow-sm md:my-6 md:min-h-0 md:rounded-xl md:border md:border-gray-100">
        <div className="px-6 pt-4">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-2 text-xs tracking-widest hover:opacity-70 disabled:opacity-40 transition-opacity"
            style={{ color: store?.themeColor }}
          >
            <ArrowLeft size={16} />
            BACK
          </button>
        </div>

        <CheckoutHeader
          step={step}
          paymentMethod={paymentMethod}
          themeColor={store?.themeColor}
          loading={loading}
          onClose={onBack}
        />

        <div className="p-6 md:p-8">
          {step === 1 && (
            <ShippingStep
              shippingData={shippingData}
              setShippingData={setShippingData}
              totalItems={totalItems}
              subtotal={subtotal}
              calculateShipping={calculateShipping}
              totalOrderAmount={totalOrderAmount}
              handleShippingSubmit={handleShippingSubmit}
              themeColor={store?.themeColor}
              shippingError={shippingError}
              homeDeliveryFee={HOME_DELIVERY_FEE}
            />
          )}

          {step === 2 && (
            <PaymentMethodStep
              payableAmount={payableAmount}
              settings={settings}
              setPaymentMethod={setPaymentMethod}
              createOrder={createOrder}
              loading={loading}
              themeColor={store?.themeColor}
              isRetryMode={isRetryMode}
            />
          )}

          {step === 3 && (
            <PaymentExecutionStep
              paymentMethod={paymentMethod}
              paystackConfig={paystackConfig}
              payableAmount={payableAmount}
              transferDetails={transferDetails}
              senderName={senderName}
              setSenderName={setSenderName}
              copied={copied}
              loading={loading}
              themeColor={store?.themeColor}
              handlePaystackSuccess={handlePaystackSuccess}
              handlePaystackClose={handlePaystackClose}
              handleCopyAccount={handleCopyAccount}
              handleTransferComplete={handleTransferComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}