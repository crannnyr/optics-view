import { ArrowLeft } from 'lucide-react';

interface LegalPagesProps {
  page: 'privacy' | 'terms';
  onBack: () => void;
}

export default function LegalPages({ page, onBack }: LegalPagesProps) {
  return (
    <div className="min-h-screen bg-white text-[#0d2818] font-light">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-50">
        <button 
          onClick={onBack}
          className="hover:bg-gray-100 p-2 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm tracking-[0.2em] font-medium uppercase">
          {page === 'privacy' ? 'Privacy Policy' : 'Return & Warranty Policy'}
        </h1>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12 text-sm leading-relaxed text-gray-600">
        
        {page === 'terms' && (
          <>
            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">1. No Returns for "Changing Your Mind"</h2>
              <p className="mb-2">
                If the product is working perfectly, <strong>no returns, no refunds</strong>.
              </p>
              <p className="mb-2">
                We don't accept returns because of "I don't like it", "I expected something else", or "I changed my mind".
              </p>
              <p>
                This protects us from unserious buyers.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">2. Only Defective Products Can Be Returned (Within 48 Hours)</h2>
              <p className="mb-4">
                If the product has a factory defect, the buyer must report it <strong>within 48 hours</strong> of receiving it.
              </p>
              <div className="mb-4">
                <p className="font-medium text-[#0d2818] mb-2">Acceptable defects include:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device not powering on</li>
                  <li>Bluetooth not connecting at all</li>
                  <li>Completely dead speaker</li>
                  <li>Faulty charging port</li>
                  <li>Camera not working (if applicable)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-[#0d2818] mb-2">Not valid defects:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Low volume complaints</li>
                  <li>Battery "not lasting as expected"</li>
                  <li>Scratches caused by customer</li>
                  <li>Physical damage from dropping or misuse</li>
                  <li>"It doesn't look like the one in the picture" (unless clearly wrong item was sent)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">3. Proof Required (No proof = No return)</h2>
              <p className="mb-2">Customer must provide:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Video showing the defect clearly</li>
                <li>Full view of the product</li>
                <li>Uncut video proving the issue</li>
              </ul>
              <p className="bg-gray-50 p-4 border-l-2 border-[#0d2818]">
                <strong>If the video doesn't clearly prove the defect, no return.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">4. Replacement, Not Refund</h2>
              <p className="mb-2">
                If the defect is confirmed, we only offer <strong>replacement, not refund</strong>.
              </p>
              <p>
                Refunds are NOT allowed except in extremely rare situations where replacement is not available.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">5. Customer Must Return the Complete Package</h2>
              <p className="mb-2">Returns must include:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Glasses</li>
                <li>Charging cable</li>
                <li>Case/box</li>
                <li>Manual</li>
              </ul>
              <p className="font-medium">
                Anything missing = no replacement.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">6. Physical Damage = Automatically Not Covered</h2>
              <p className="mb-2">If we inspect the item and find:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Cracks</li>
                <li>Water damage</li>
                <li>Broken arms</li>
                <li>Burn marks</li>
                <li>Forceful damage</li>
              </ul>
              <p className="mb-2">...then the warranty is void.</p>
              <p className="font-medium">Customer will NOT get a replacement.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">7. Return Shipping</h2>
              <p className="mb-2">
                Customer handles the cost of shipping the product back.
              </p>
              <p>
                We cover the cost of sending the replacement.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">8. After 48 Hours = Warranty Ends</h2>
              <p className="mb-2">
                Once the customer has had the glasses for over 2 days, we assume they tested it and it's working.
              </p>
              <p className="font-medium">
                No returns after 48 hours.
              </p>
            </section>
          </>
        )}
        {page === 'privacy' && (
          <>
            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">1. Information We Collect</h2>
              <p className="mb-4">
                We only collect information that is necessary to process your order and deliver your product. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Full name</li>
                <li>Phone number</li>
                <li>Delivery address</li>
                <li>Payment confirmation</li>
                <li>Messages you send to us (DM, WhatsApp, SMS)</li>
                <li>Order details (product, quantity, date)</li>
              </ul>
              <div className="bg-gray-50 p-4 border-l-2 border-[#0d2818]">
                <p className="font-medium text-[#0d2818] mb-2">We DO NOT collect:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Bank card details</li>
                  <li>BVN</li>
                  <li>Passwords</li>
                  <li>Any sensitive financial data</li>
                </ul>
                <p className="mt-3">Payment is always done through secure channels you control.</p>
              </div>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">2. How We Use Your Information</h2>
              <p className="mb-2">Your information is used strictly for:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Processing your order</li>
                <li>Confirming payment</li>
                <li>Delivering your items</li>
                <li>Customer support</li>
                <li>Wholesale registration</li>
                <li>Resolving order issues</li>
              </ul>
              <p>
                We do not sell, trade, or share your information with any third party for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">3. How We Protect Your Information</h2>
              <p className="mb-2">We protect your data by:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Storing chats and order details privately</li>
                <li>Using secure payment methods</li>
                <li>Limiting access to your information</li>
                <li>Not saving unnecessary data</li>
              </ul>
              <p className="font-medium">
                Your information is NEVER posted, shared publicly, or exposed.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">4. Who Has Access to Your Information</h2>
              <p className="mb-2">Only authorized OpticsView Tech staff handling:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Orders</li>
                <li>Deliveries</li>
                <li>Payments</li>
                <li>Customer support</li>
              </ul>
              <p className="font-medium">Nobody else has access.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">5. Data Retention</h2>
              <p className="mb-2">We keep basic order information only for:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Proof of purchase</li>
                <li>Logistics</li>
                <li>Warranty checks</li>
                <li>Business records</li>
              </ul>
              <p>
                If you request for your information to be deleted, we can wipe your details after order completion.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">6. Sharing Information With Third Parties</h2>
              <p className="mb-2">We only share minimal information with:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Delivery couriers (Name, phone number, area)</li>
                <li>Payment processors (transaction reference only)</li>
              </ul>
              <p className="mb-2">They get NOTHING more than what is needed to deliver your product.</p>
              <p>
                We never give your data to advertisers, promoters, or outside companies.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">7. Customer Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Ask what information we have about you</li>
                <li>Request corrections</li>
                <li>Request deletion after your order is completed</li>
                <li>Ask how your data is used</li>
              </ul>
              <p>
                We respect all data privacy laws applicable to our operations.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">8. Fraud Prevention</h2>
              <p className="mb-2">
                If a transaction appears fraudulent or suspicious, we may verify identity or payment before proceeding with delivery.
              </p>
              <p>
                This protects both the business and the buyer.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">9. Updates to This Policy</h2>
              <p className="mb-2">
                We may update this policy from time to time.
              </p>
              <p>
                Any changes will be posted here.
              </p>
            </section>
          </>
        )}
        <div className="pt-12 border-t border-gray-100 text-xs text-gray-400">
          Last updated: {new Date().getFullYear()} — OpticsView Tech
        </div>
      </div>
    </div>
  );
}