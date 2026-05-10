import { X, Loader2, ArrowRight } from 'lucide-react';
import { Retailer } from '../hooks/useRetailers';

interface RetailerPayoutModalProps {
  selectedRetailer: Retailer;
  setSelectedRetailer: (retailer: Retailer | null) => void;
  payoutAmount: string;
  setPayoutAmount: (amount: string) => void;
  adminNote: string;
  setAdminNote: (note: string) => void;
  processingPayout: boolean;
  handlePayout: (e: React.FormEvent) => void;
}

export default function RetailerPayoutModal({
  selectedRetailer,
  setSelectedRetailer,
  payoutAmount,
  setPayoutAmount,
  adminNote,
  setAdminNote,
  processingPayout,
  handlePayout
}: RetailerPayoutModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative">
        <button 
          onClick={() => setSelectedRetailer(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-light text-[#0d2818] mb-1">Pay Retailer</h3>
        <p className="text-sm text-gray-500 mb-6">Send funds to <strong>{selectedRetailer.store_name}</strong></p>

        <form onSubmit={handlePayout} className="space-y-4">
          <div className="bg-gray-50 p-4 border border-gray-200 rounded mb-4">
             <p className="text-xs text-gray-500 mb-1">Current Unpaid Balance</p>
             <p className="text-xl font-bold text-[#0d2818]">₦{(selectedRetailer.balance || 0).toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Amount to Pay (₦)</label>
            <input
              type="number"
              required
              min="1"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)}
              className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Admin Note (Optional)</label>
            <input
              type="text"
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
              placeholder="e.g. Weekly Payout"
            />
          </div>

          <button 
            type="submit"
            disabled={processingPayout}
            className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {processingPayout ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                CONFIRM PAYOUT <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
