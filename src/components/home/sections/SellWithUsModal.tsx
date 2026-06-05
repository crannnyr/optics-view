import { X, ShieldCheck, Package, CreditCard, AlertTriangle, MessageCircle } from 'lucide-react';

interface SellWithUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor?: string;
}

const WHATSAPP_NUMBER = '447404707531';
const ACCOUNT_NUMBER = '9069149803';
const BANK_NAME = 'OPay';

export default function SellWithUsModal({ isOpen, onClose, themeColor = '#0d2818' }: SellWithUsModalProps) {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'd like to sell my product on OPTICSVIEW`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg font-light tracking-wide" style={{ color: themeColor }}>
              Sell on OPTICSVIEW
            </h2>
            <p className="text-[11px] text-gray-400 tracking-wider uppercase mt-0.5">Partner with us</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Intro */}
          <p className="text-sm text-gray-600 leading-relaxed">
            We welcome authentic, quality product sellers to list on OPTICSVIEW. Before you get started, please read the following carefully.
          </p>

          {/* Requirements */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: themeColor }}>
              Our Standards
            </p>

            {[
              {
                icon: <ShieldCheck size={16} />,
                title: 'Authenticity is Non-Negotiable',
                body: 'Only original and authentic products are approved on this platform. Every product must pass our quality verification process. Depending on the item, you may be required to send a physical sample before listing is approved.',
              },
              {
                icon: <Package size={16} />,
                title: 'You Only Get Paid When We Sell',
                body: 'Payment is made to you after your product has been received by the customer without complaint. We operate on a performance-first model — your success is tied to customer satisfaction.',
              },
              {
                icon: <AlertTriangle size={16} />,
                title: 'Refunds Are Your Responsibility',
                body: 'You must be fully willing and able to issue a complete refund if your product later proves defective. Refund policy is a core part of how we operate, and sellers are held to the same standard.',
              },
              {
                icon: <X size={16} />,
                title: 'We Can Remove You at Any Time',
                body: 'OpticsView Nigeria reserves the right to suspend or permanently ban any seller account at our discretion — without refund — if standards are not maintained or terms are violated.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="shrink-0 mt-0.5" style={{ color: themeColor }}>{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="px-5 py-3 text-xs uppercase tracking-widest font-bold text-white" style={{ backgroundColor: themeColor }}>
              Pricing Structure
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex justify-between items-center px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">One-Time Registration</p>
                  <p className="text-xs text-gray-400 mt-0.5">Get your product listed and verified</p>
                </div>
                <p className="text-lg font-medium" style={{ color: themeColor }}>₦20,000</p>
              </div>
              <div className="flex justify-between items-center px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">Monthly Activity Fee</p>
                  <p className="text-xs text-gray-400 mt-0.5">Only charged when we sell 20+ of your items that month</p>
                </div>
                <p className="text-lg font-medium" style={{ color: themeColor }}>₦5,000</p>
              </div>
              <div className="px-5 py-3 bg-green-50">
                <p className="text-xs text-green-700 font-medium">
                  🎉 If fewer than 20 of your items are sold in a month, that month is <strong>completely free</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="px-5 py-3 text-xs uppercase tracking-widest font-bold text-white" style={{ backgroundColor: themeColor }}>
              How to Get Started
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">Make your registration payment to the account below:</p>

              <div className="bg-gray-900 text-white rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Bank</p>
                  <p className="text-base font-medium">{BANK_NAME}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Account Number</p>
                  <p className="text-2xl font-mono font-bold tracking-widest">{ACCOUNT_NUMBER}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Account Name</p>
                  <p className="text-base font-medium">Optics View Store</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs text-blue-800 leading-relaxed">
                  After payment, send a screenshot to our WhatsApp along with details about your product — what it is, quantity available, and your price expectation. An agent will guide you through the rest of the process.
                </p>
              </div>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity bg-green-600"
          >
            <MessageCircle size={18} />
            Send Payment Screenshot on WhatsApp
          </button>

          <p className="text-center text-[11px] text-gray-400">
            By proceeding you agree to our terms and seller standards outlined above.
          </p>
        </div>
      </div>
    </div>
  );
}
