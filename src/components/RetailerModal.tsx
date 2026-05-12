import { X } from 'lucide-react';
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

export default function RetailerModal({ isOpen, onClose, referringRetailerId }: RetailerModalProps) {
  const modal = useRetailerModal(referringRetailerId);

  if (!isOpen) return null;

  const stepIndicator = modal.user ? (
    <div className="flex gap-1.5 justify-center pt-5 px-6">
      {[1,2,3,4,5].map(n => (
        <div
          key={n}
          className={`h-1 flex-1 rounded-full transition-all ${modal.step >= n ? 'bg-[#0d2818]' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg min-h-screen md:min-h-0 md:my-8 relative md:shadow-2xl md:rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        {stepIndicator}

        {modal.step === 1 && (
          <BenefitsStep
            user={modal.user}
            onClose={onClose}
            onNext={() => modal.setStep(2)}
          />
        )}
        {modal.step === 2 && (
          <PlanStep
            plan={modal.plan}
            setPlan={modal.setPlan}
            onBack={() => modal.setStep(1)}
            onNext={() => modal.setStep(3)}
          />
        )}
        {modal.step === 3 && (
          <CategoriesStep
            categories={modal.categories}
            selectedCategories={modal.selectedCategories}
            toggleCategory={modal.toggleCategory}
            plan={modal.plan}
            onBack={() => modal.setStep(2)}
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
            onBack={() => modal.setStep(3)}
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
            onBack={() => modal.setStep(4)}
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
            onPaystackSuccess={modal.handlePaystackSuccess}
            onPaystackClose={modal.handlePaystackClose}
          />
        )}
      </div>
    </div>
  );
}
