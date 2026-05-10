import { CreditCard, Smartphone, Save, Loader2 } from 'lucide-react';

interface PaymentSettingsViewProps {
  paymentLoading: boolean;
  paymentMethods: {
    enable_paystack: boolean;
    enable_transfer: boolean;
  };
  setPaymentMethods: (methods: any) => void;
  transferDetails: {
    bank: string;
    number: string;
    name: string;
  };
  setTransferDetails: (details: any) => void;
  handleSavePaymentSettings: () => void;
}

export default function PaymentSettingsView({
  paymentLoading,
  paymentMethods,
  setPaymentMethods,
  transferDetails,
  setTransferDetails,
  handleSavePaymentSettings
}: PaymentSettingsViewProps) {
  return (
    <div className="animate-in fade-in duration-300">
       <div className="flex justify-between items-center mb-8">
         <div className="flex items-center gap-3">
            <CreditCard size={24} className="text-[#0d2818]" />
            <h2 className="text-xl font-light text-[#0d2818]">Payment Gateways</h2>
         </div>
         <button
           onClick={handleSavePaymentSettings}
           disabled={paymentLoading}
           className="bg-[#0d2818] text-white px-6 py-2.5 text-xs tracking-widest hover:bg-opacity-90 flex items-center gap-2 rounded disabled:opacity-70 disabled:cursor-not-allowed"
         >
           {paymentLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
           SAVE CHANGES
         </button>
       </div>

       <div className="grid gap-6 max-w-2xl">

          {/* Payment Methods Toggle */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
             <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Enabled Methods</h3>
             <div className="space-y-4">
                {/* Paystack */}
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethods.enable_paystack ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                         <CreditCard size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-sm text-gray-800">Paystack (Card)</p>
                         <p className="text-xs text-gray-500">Automated card payments</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                         type="checkbox" 
                         className="sr-only peer"
                         checked={paymentMethods.enable_paystack}
                         onChange={e => setPaymentMethods({...paymentMethods, enable_paystack: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d2818]"></div>
                   </label>
                </div>

                {/* Transfer */}
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethods.enable_transfer ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                         <Smartphone size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-sm text-gray-800">Bank Transfer</p>
                         <p className="text-xs text-gray-500">Manual verification required</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                         type="checkbox" 
                         className="sr-only peer"
                         checked={paymentMethods.enable_transfer}
                         onChange={e => setPaymentMethods({...paymentMethods, enable_transfer: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0d2818]"></div>
                   </label>
                </div>
             </div>
          </div>

          {/* Transfer Details Form */}
          {paymentMethods.enable_transfer && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-sm font-bold uppercase text-gray-500 mb-4">Transfer Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-2">Bank Name</label>
                  <input 
                    type="text"
                    value={transferDetails.bank}
                    onChange={e => setTransferDetails({...transferDetails, bank: e.target.value})}
                    className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 mb-2">Account Number</label>
                  <input 
                    type="text"
                    value={transferDetails.number}
                    onChange={e => setTransferDetails({...transferDetails, number: e.target.value})}
                    className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase text-gray-500 mb-2">Account Name</label>
                  <input 
                    type="text"
                    value={transferDetails.name}
                    onChange={e => setTransferDetails({...transferDetails, name: e.target.value})}
                    className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                  />
                </div>
              </div>
            </div>
          )}

       </div>
    </div>
  );
}
