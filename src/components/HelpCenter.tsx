import { useState } from 'react';
import { ArrowLeft, ChevronDown, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface HelpCenterProps {
  onBack: () => void;
}

const COMMUNITY_LINK = 'https://chat.whatsapp.com/LLXC1AIfGetEMnSgDas1T2';

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'How long does shipping take?',
    answer: 'It depends on the item and method you pick at checkout. Air Express takes 2-3 days from ship time, Air Normal takes 20-30 days, and Sea takes 60-90 days. Vendor marketplace items ship separately, usually within a few days of the seller confirming your order.',
  },
  {
    question: 'How is my shipping fee calculated?',
    answer: 'Air fees are based on the item\'s weight — a per-kg rate plus a clearance fee. Sea fees are based on the item\'s volume (its size in a box). You always see the exact fee for each shipping method right on the product page before you choose.',
  },
  {
    question: 'Can I pay by bank transfer?',
    answer: 'Yes, for orders above a minimum amount. Smaller orders are card-only via Paystack for faster, verifiable payment. If your order qualifies, you\'ll see both options at checkout.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Go to My Profile → Track, or check the Importation/Vendor sections of your profile, which show live status for every order.',
  },
  {
    question: 'What if a vendor doesn\'t respond to my order?',
    answer: 'Vendors have 48 hours to prepare your order once it\'s approved. If they don\'t respond in time, your order is automatically cancelled and a refund is started — you\'ll get an email asking you to submit your bank details so we can send it to you.',
  },
  {
    question: 'How do refunds work?',
    answer: 'Once a refund is initiated, you\'ll see a banner in your profile asking for your bank account details. Submit them there and our team processes it — this usually takes a few business days.',
  },
  {
    question: 'Are imported items genuine and quality-checked?',
    answer: 'Yes — we source directly from verified manufacturers, and items are checked before they\'re listed. If something arrives faulty or not as described, contact us and we\'ll sort it out.',
  },
  {
    question: 'Can I become a vendor or retailer?',
    answer: 'Yes — both programs are open. Vendors list and sell their own products through our marketplace; retailers get a branded storefront to resell OpticsView products without holding inventory. Look for the sign-up options from the homepage.',
  },
  {
    question: 'What if my item never arrives or arrives damaged?',
    answer: 'Reach out to us with your order number as soon as possible. Late imports come with store credit as compensation once past the expected delivery window, and damaged items are handled case by case.',
  },
];

export default function HelpCenter({ onBack }: HelpCenterProps) {
  const { store } = useStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="sticky top-0 bg-white/95 backdrop-blur z-20 border-b px-4 md:px-6 py-3 md:py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-xs md:text-sm hover:opacity-70" style={{ color: store.themeColor }}>
          <ArrowLeft size={18} />
          <span className="tracking-widest">BACK</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-light mb-2" style={{ color: store.themeColor }}>
          Help Center
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Answers to the questions we hear most. Still stuck? The community link below gets you real people, fast.
        </p>

        <div className="space-y-2 mb-10">
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-gray-800">{faq.question}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <a
          href={COMMUNITY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full text-white py-3.5 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle size={16} />
          Join the OpticsView Community on WhatsApp
        </a>
      </div>
    </div>
  );
}
