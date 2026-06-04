import { ArrowLeft } from 'lucide-react';

interface LegalPagesProps {
  page: 'privacy' | 'terms';
  onBack: () => void;
}

export default function LegalPages({ page, onBack }: LegalPagesProps) {
  return (
    <div className="min-h-screen bg-white text-[#0d2818] font-light">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-50">
        <button onClick={onBack} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm tracking-[0.2em] font-medium uppercase">
          {page === 'privacy' ? 'Privacy Policy' : 'Return & Warranty Policy'}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12 text-sm leading-relaxed text-gray-600">

        {/* ── TERMS / RETURN & WARRANTY ──────────────────── */}
        {page === 'terms' && (
          <>
            <div className="bg-gray-50 border-l-2 border-[#0d2818] p-5">
              <p className="text-[#0d2818] font-medium mb-1">Read This First</p>
              <p>
                OpticsView Nigeria operates as a product platform connecting customers to quality-tested items sourced directly from verified manufacturers. All purchases are final unless a confirmed factory defect is reported within 48 hours of delivery.
              </p>
            </div>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">1. All Sales Are Final</h2>
              <p className="mb-2">
                We do not accept returns based on change of mind, personal preference, or unmet expectations that are not product defects.
              </p>
              <p>
                Once an order is placed and delivered in working condition, the sale is complete. No exceptions.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">2. Defective Products — 48-Hour Window</h2>
              <p className="mb-4">
                If your product has a confirmed factory defect, you must report it to us <strong>within 48 hours</strong> of receiving it. After 48 hours, we assume the product was received in working condition.
              </p>
              <div className="mb-4">
                <p className="font-medium text-[#0d2818] mb-2">Defects we cover:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Product not powering on out of the box</li>
                  <li>Core feature completely non-functional on arrival</li>
                  <li>Wrong item delivered</li>
                  <li>Confirmed manufacturing fault</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-[#0d2818] mb-2">What is NOT covered:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Performance not meeting personal expectations</li>
                  <li>Minor cosmetic differences from product photos</li>
                  <li>Damage caused by misuse, dropping, or water</li>
                  <li>Issues reported after 48 hours</li>
                  <li>"It's not what I thought it would be"</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">3. How to Report a Defect</h2>
              <p className="mb-2">Contact us directly at <strong>support@opticsview.store</strong> within 48 hours. You must provide:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Your order ID</li>
                <li>A clear, uncut video showing the defect</li>
                <li>A full view of the product and packaging</li>
              </ul>
              <div className="bg-gray-50 p-4 border-l-2 border-[#0d2818]">
                <strong>No proof = no claim.</strong> We cannot process any defect report without video evidence.
              </div>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">4. Replacement, Not Refund</h2>
              <p className="mb-2">
                If a defect is confirmed, we offer a <strong>replacement only</strong>. Monetary refunds are not provided except in rare cases where a replacement is genuinely unavailable.
              </p>
              <p>
                Replacement decisions are made solely by OpticsView Nigeria after reviewing submitted evidence.
              </p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">5. Return Requirements</h2>
              <p className="mb-2">If a replacement is approved, you must return the complete package including:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>The product itself</li>
                <li>All accessories included in the box</li>
                <li>Original packaging where possible</li>
              </ul>
              <p className="font-medium">Incomplete returns will not be processed.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">6. Physical Damage Voids All Claims</h2>
              <p className="mb-2">Any of the following voids your claim entirely:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Cracks, dents, or broken parts</li>
                <li>Water or liquid damage</li>
                <li>Burn marks or heat damage</li>
                <li>Evidence of forceful opening or tampering</li>
              </ul>
              <p className="font-medium">If physical damage is found upon inspection, no replacement will be issued.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">7. Return Shipping</h2>
              <p className="mb-2">The customer is responsible for the cost of returning the defective item to us.</p>
              <p>OpticsView Nigeria covers the cost of sending the replacement to you.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">8. Retailer Purchases</h2>
              <p className="mb-2">
                Some products on our platform are sold through independent retailers using our platform. Regardless of which store you purchased from, all return and warranty claims are handled directly by <strong>OpticsView Nigeria</strong>.
              </p>
              <p>Contact us at <strong>support@opticsview.store</strong> for all after-sale issues.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">9. Fraud & Abuse</h2>
              <p>
                Any attempt to submit false defect claims, fabricated evidence, or fraudulent return requests will result in permanent account suspension and potential legal action. We take this seriously.
              </p>
            </section>
          </>
        )}

        {/* ── PRIVACY POLICY ─────────────────────────────── */}
        {page === 'privacy' && (
          <>
            <div className="bg-gray-50 border-l-2 border-[#0d2818] p-5">
              <p className="text-[#0d2818] font-medium mb-1">Your Privacy Matters</p>
              <p>
                OpticsView Nigeria is committed to protecting your personal information. We only collect what is necessary to operate the platform and deliver your orders. We do not sell your data. Ever.
              </p>
            </div>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">1. Information We Collect</h2>
              <p className="mb-4">Depending on how you use our platform, we may collect:</p>
              <div className="mb-4">
                <p className="font-medium text-[#0d2818] mb-2">Customers:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Full name and email address</li>
                  <li>Phone number(s)</li>
                  <li>Delivery address</li>
                  <li>Order history and payment references</li>
                </ul>
              </div>
              <div className="mb-4">
                <p className="font-medium text-[#0d2818] mb-2">Retailers:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Store name, slug, and domain</li>
                  <li>Contact information</li>
                  <li>Earnings, commissions, and withdrawal records</li>
                  <li>Referral relationships</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 border-l-2 border-[#0d2818]">
                <p className="font-medium text-[#0d2818] mb-2">We never collect:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Bank card numbers or PINs</li>
                  <li>BVN or NIN</li>
                  <li>Passwords (these are encrypted by Supabase Auth)</li>
                  <li>Any data not necessary to run the platform</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Processing and delivering your orders</li>
                <li>Verifying payments and managing transactions</li>
                <li>Operating retailer stores and tracking commissions</li>
                <li>Sending transactional emails (order updates, account activity)</li>
                <li>Resolving disputes and support requests</li>
                <li>Improving platform performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">3. Emails & Communications</h2>
              <p className="mb-2">
                We send emails through <strong>Resend</strong> using our domain <strong>support@opticsview.store</strong>. These emails include:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Order confirmations and status updates</li>
                <li>Password reset links</li>
                <li>Retailer earnings and withdrawal notifications</li>
                <li>New product announcements (retailers only)</li>
                <li>Welcome and account emails</li>
              </ul>
              <p>We do not send unsolicited marketing emails. All emails are transactional and directly related to your activity on the platform.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">4. Payment Processing</h2>
              <p className="mb-2">
                Payments are processed through <strong>Paystack</strong>. OpticsView Nigeria does not store or have access to your card details. All payment data is handled securely by Paystack under their own privacy and security standards.
              </p>
              <p>We only store the transaction reference and payment status.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">5. Third Parties We Share Data With</h2>
              <p className="mb-2">We share minimal data only where necessary:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li><strong>Delivery couriers</strong> — name, phone number, delivery area only</li>
                <li><strong>Paystack</strong> — email and transaction reference for payment processing</li>
                <li><strong>Resend</strong> — email address for sending transactional emails</li>
                <li><strong>Supabase</strong> — our database and auth infrastructure provider</li>
              </ul>
              <p className="font-medium">We never sell, trade, or share your data with advertisers or unrelated third parties.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">6. Retailer Data</h2>
              <p className="mb-2">
                Retailer store data, earnings, referral commissions, and withdrawal records are stored securely and are only accessible to the retailer and OpticsView Nigeria administrators.
              </p>
              <p>Retailer data is never shared with other retailers or third parties.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">7. Data Security</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>All data is stored on Supabase with row-level security enabled</li>
                <li>Passwords are hashed and never stored in plain text</li>
                <li>Platform access is restricted by role (customer, retailer, admin)</li>
                <li>All connections use HTTPS encryption</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">8. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Request a copy of the data we hold about you</li>
                <li>Request corrections to inaccurate information</li>
                <li>Request deletion of your data after order completion</li>
                <li>Opt out of non-essential communications</li>
              </ul>
              <p>To exercise any of these rights, contact us at <strong>support@opticsview.store</strong>.</p>
            </section>

            <section>
              <h2 className="text-[#0d2818] text-lg mb-4 tracking-wide">9. Policy Updates</h2>
              <p>
                We may update this policy as the platform evolves. Significant changes will be communicated via email or a notice on the platform. Continued use of the platform after changes constitutes acceptance.
              </p>
            </section>
          </>
        )}

        <div className="pt-12 border-t border-gray-100 text-xs text-gray-400">
          Last updated: {new Date().getFullYear()} — OpticsView Nigeria
        </div>
      </div>
    </div>
  );
}
