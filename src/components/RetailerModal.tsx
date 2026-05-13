import { X, ArrowLeft, Loader2, Store } from 'lucide-react';
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

  // Already applied
  if (modal.hasApplied && !modal.checkingApplication) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl p-8 text-center shadow-2xl">
          <Store size={40} className="mx-auto text-[#0d2818] mb-4" />
          <h2 className="text-lg font-semibold text-[#0d2818] mb-2">Already Applied</h2>
          <p className="text-sm text-gray-500 mb-6">
            You already have a retailer application. Check your dashboard for status updates.
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
          {modal.checkingApplication ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={24} className="animate-spin text-gray-300" />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}