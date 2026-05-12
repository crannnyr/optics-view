import { useCheckout } from './checkout/hooks/useCheckout';
import { CartItem } from '../lib/supabase';

// Child Components
import CheckoutHeader from './checkout/CheckoutHeader';
import ShippingStep from './checkout/steps/ShippingStep';
import PaymentMethodStep from './checkout/steps/PaymentMethodStep';
import PaymentExecutionStep from './checkout/steps/PaymentExecutionStep';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: () => void;
}

export default function Checkout({ isOpen, onClose, items, onSuccess }: CheckoutProps) {
  const {
    store,
    step,
    loading,
    paymentMethod,
    setPaymentMethod,
    shippingData,
    setShippingData,
    paystackConfig,
    settings,
    copied,
    transferDetails,
    totalItems,
    subtotal,
    totalOrderAmount,
    payableAmount,
    calculateShipping,
    handleShippingSubmit,
    handleCopyAccount,
    createOrder,
    handleTransferComplete,
    handlePaystackSuccess
  } = useCheckout({ isOpen, items, onSuccess });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg relative max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        
        <CheckoutHeader 
          step={step} 
          paymentMethod={paymentMethod} 
          themeColor={store?.themeColor} 
          loading={loading} 
          onClose={onClose} 
        />

        <div className="p-8">
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
            />
          )}

          {step === 3 && (
            <PaymentExecutionStep
              paymentMethod={paymentMethod}
              paystackConfig={paystackConfig}
              payableAmount={payableAmount}
              transferDetails={transferDetails}
              copied={copied}
              loading={loading}
              themeColor={store?.themeColor}
              handlePaystackSuccess={handlePaystackSuccess}
              handleCopyAccount={handleCopyAccount}
              handleTransferComplete={handleTransferComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}