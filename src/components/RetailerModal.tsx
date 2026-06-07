import { X, ArrowLeft, Loader2, Store, CreditCard, Clock, ShieldOff } from 'lucide-react';
import { useRetailerModal } from './retailer-apply/useRetailerModal';
import BenefitsStep from './retailer-apply/BenefitsStep';
import PlanStep from './retailer-apply/PlanStep';
import CategoriesStep from './retailer-apply/CategoriesStep';
import DomainSummaryStep from './retailer-apply/DomainSummaryStep';
import DetailsStep from './retailer-apply/DetailsStep';
import PaymentStep from './retailer-apply/PaymentStep';

interface RetailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  referringRetailerId?: string | null;
}

const STEP_LABELS = ['Benefits', 'Plan', 'Categories', 'Domain', 'Details'];

export default function RetailerModal({ isOpen, onClose, referringRetailerId }: RetailerModalProps) {
  const modal = useRetailerModal(referringRetailerId);

  if (!isOpen) return null;

  const showProgress = !!modal.user && modal.step >= 1 && modal.step <= 5;
  const canGoBack = modal.step > 1 && modal.step <= 5;
  const handleBack = () => modal.setStep((modal.step - 1) as any);

  // ── Loading — checking application status ────────────────────────
  if (modal.checkingApplication) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl p-8 text-center shadow-2xl">
          <Loader2 size={24} className="animate-spin text-gray-300 mx-auto" />
        </div>
      </div>
    );
  }

  // ── Blocked ──────────────────────────────────────────────────────
  if (modal.applicationStatus.state === 'blocked') {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Application Not Accepted</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your retailer application could not be processed. Please contact support for more information.
          </p>
          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-600 py-3 text-sm rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Verified — already active ────────────────────────────────────
  if (modal.applicationStatus.state === 'verified') {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl p-8 text-center shadow-2xl">
          <Store size={40} className="mx-auto text-[#0d2818] mb-4" />
          <h2 className="text-lg font-semibold text-[#0d2818] mb-2">Already a Retailer</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your account is active. Go to your dashboard to manage your store.
          </p>
          <div className="space-y-3">
            <a
              href="/retailer"
              className="block w-full bg-[#0d2818] text-white py-3 text-sm font-medium rounded-lg hover:opacity-90"
            >
              Go to Dashboard
            </a>
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending transfer — dashboard has the waiting screen ──────────
  if (modal.applicationStatus.state === 'pending_transfer') {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Under Review</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your transfer has been submitted and is awaiting confirmation. Our team usually verifies within 5 minutes during business hours.
          </p>
          <div className="space-y-3">
            <a
              href="/retailer"
              className="block w-full bg-[#0d2818] text-white py-3 text-sm font-medium rounded-lg hover:opacity-90"
            >
              Check Status on Dashboard
            </a>
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Incomplete Paystack payment — Option A resume screen ─────────
  if (modal.applicationStatus.state === 'pending_paystack') {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-[#0d2818] px-6 py-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
            <h2 className="text-lg font-semibold">Incomplete Payment</h2>
            <p className="text-sm text-white/70 mt-1">Your registration is saved — just complete payment to activate.</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Reference</span>
                <span className="font-mono text-xs text-gray-700">
                  {modal.applicationStatus.reg?.paystack_reference?.slice(-12)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Amount Due</span>
                <span className="font-bold text-[#0d2818]">
                  ₦{(modal.applicationStatus.reg?.registration_fee || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Your store details and plan are saved. Clicking below will open the secure Paystack payment window to complete your registration.
            </p>

            <PaymentStep
              paystackConfig={modal.paystackConfig}
              loading={modal.loading}
              totalDue={modal.applicationStatus.reg?.registration_fee || 0}
              formData={modal.formData}
              paymentMode="paystack"
              setPaymentMode={modal.setPaymentMode}
              paymentSettings={{ enable_paystack: true, enable_transfer: false }}
              transferDetails={modal.transferDetails}
              onPaystackSuccess={(ref) => modal.handlePaystackSuccess(ref)}
              onPaystackClose={modal.handlePaystackClose}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Normal flow — fresh application ─────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-stretch md:items-center justify-center">
      <div className="bg-white w-full md:max-w-lg md:rounded-xl md:max-h-[92vh] flex flex-col md:my-4 md:shadow-2xl">

        {/* Sticky header — progress + close always visible */}
        <div className="flex items-center gap-2 px-3 py-3 border-b shrink-0 bg-white md:rounded-t-xl">
          {canGoBack ? (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </button>
          ) : (
            <div className="w-9 shrink-0" />
          )}

          {showProgress ? (
            <div className="flex-1 flex flex-col gap-1 px-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      modal.step >= n ? 'bg-[#0d2818]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                Step {Math.min(modal.step, 5)} of 5 · {STEP_LABELS[Math.min(modal.step, 5) - 1]}
              </p>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Scrollable step content */}
        <div className="flex-1 overflow-y-auto">
          {modal.step === 1 && (
            <BenefitsStep user={modal.user} onClose={onClose} onNext={() => modal.setStep(2)} />
          )}
          {modal.step === 2 && (
            <PlanStep plan={modal.plan} setPlan={modal.setPlan} onBack={handleBack} onNext={() => modal.setStep(3)} />
          )}
          {modal.step === 3 && (
            <CategoriesStep
              categories={modal.categories}
              selectedCategories={modal.selectedCategories}
              toggleCategory={modal.toggleCategory}
              plan={modal.plan}
              onBack={handleBack}
              onNext={() => modal.setStep(4)}
            />
          )}
          {modal.step === 4 && (
            <DomainSummaryStep
              formData={modal.formData}
              setFormData={modal.setFormData}
              plan={modal.plan}
              setPlan={modal.setPlan}
              catCount={modal.catCount}
              monthlyRate={modal.monthlyRate}
              hasFreeMonth={modal.hasFreeMonth}
              yearlyRate={modal.yearlyRate}
              subscriptionCost={modal.subscriptionCost}
              domainCost={modal.domainCost}
              totalDue={modal.totalDue}
              domainPreview={modal.domainPreview}
              onBack={handleBack}
              onNext={() => modal.setStep(5)}
            />
          )}
          {modal.step === 5 && (
            <DetailsStep
              formData={modal.formData}
              setFormData={modal.setFormData}
              loading={modal.loading}
              domainPreview={modal.domainPreview}
              totalDue={modal.totalDue}
              generateSlug={modal.generateSlug}
              onBack={handleBack}
              onSubmit={modal.handleSubmitDetails}
            />
          )}
          {modal.step === 6 && (
            <PaymentStep
              paystackConfig={modal.paystackConfig}
              loading={modal.loading}
              totalDue={modal.totalDue}
              formData={modal.formData}
              paymentMode={modal.paymentMode}
              setPaymentMode={modal.setPaymentMode}
              paymentSettings={modal.paymentSettings}
              transferDetails={modal.transferDetails}
              onPaystackSuccess={(ref) => modal.handlePaystackSuccess(ref)}
              onPaystackClose={modal.handlePaystackClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
