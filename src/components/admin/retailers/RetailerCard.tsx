import { Mail, Phone, Check, Copy, ExternalLink, Loader2, CheckCircle, Wallet } from 'lucide-react';
import { Retailer } from '../hooks/useRetailers';

interface RetailerCardProps {
  retailer: Retailer;
  activatingRetailerId: string | null;
  copiedId: string | null;
  handleActivateRetailer: (retailer: Retailer) => void;
  setSelectedRetailer: (retailer: Retailer) => void;
  copyToClipboard: (text: string, id: string) => void;
  getStoreUrl: (slug: string) => string;
  getDaysRemaining: (endDate: string) => number;
}

export default function RetailerCard({
  retailer,
  activatingRetailerId,
  copiedId,
  handleActivateRetailer,
  setSelectedRetailer,
  copyToClipboard,
  getStoreUrl,
  getDaysRemaining
}: RetailerCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row justify-between gap-6">

        {/* Left: Retailer Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0d2818] rounded-full flex items-center justify-center text-white font-bold">
                {retailer.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-medium text-[#0d2818]">{retailer.full_name}</h3>
                <p className="text-xs text-gray-500">
                  {retailer.store_name || 'Store name not set'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              retailer.subscription_status === 'active' 
                ? 'bg-green-100 text-green-800'
                : retailer.subscription_status === 'trial'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {retailer.subscription_status === 'trial' 
                ? `Trial (${getDaysRemaining(retailer.trial_ends_at)} days left)`
                : retailer.subscription_status
              }
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={14} />
              <span>{retailer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={14} />
              <span>{retailer.phone || 'No phone'}</span>
            </div>
          </div>

          {/* Store URL */}
          <div className="bg-gray-50 border border-gray-200 p-3 rounded flex items-center gap-2 mb-4">
            <input
              type="text"
              readOnly
              value={getStoreUrl(retailer.store_slug)}
              className="flex-1 bg-transparent text-xs font-mono outline-none text-gray-600"
            />
            <button onClick={() => copyToClipboard(getStoreUrl(retailer.store_slug), retailer.id)} title="Copy">
              {copiedId === retailer.id ? <Check size={14} className="text-green-600"/> : <Copy size={14} className="text-gray-400 hover:text-black"/>}
            </button>
            <a href={getStoreUrl(retailer.store_slug)} target="_blank" rel="noopener noreferrer" title="Visit">
              <ExternalLink size={14} className="text-gray-400 hover:text-black"/>
            </a>
          </div>

          {/* NEW: Activation Button (if not active) */}
          {retailer.subscription_status !== 'active' && (
            <div className="mb-4">
              <button
                onClick={() => handleActivateRetailer(retailer)}
                disabled={activatingRetailerId === retailer.id}
                className="w-full bg-green-600 text-white py-2.5 text-sm font-medium rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activatingRetailerId === retailer.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    ACTIVATE SUBSCRIPTION
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 This will process any referral commissions automatically
              </p>
            </div>
          )}

          {/* Login Instructions Box */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <p className="text-sm text-blue-900 mb-2 font-medium">
              🔐 Retailer Login Instructions:
            </p>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Send them their store URL above</li>
              <li>They login with their email: <span className="font-mono bg-white px-2 py-0.5 rounded">{retailer.email}</span></li>
              <li>They can set custom prices and view their dashboard</li>
            </ol>
          </div>
        </div>

        {/* Right: Wallet & Actions */}
        <div className="md:w-72 bg-gray-50 border border-gray-200 rounded p-4 flex flex-col justify-between min-h-[160px]">
           <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Unpaid Balance</p>
              <h3 className="text-2xl font-bold text-[#0d2818]">₦{(retailer.balance || 0).toLocaleString()}</h3>
              <p className="text-[10px] text-gray-400 mb-4">Total profits owed</p>
           </div>

           <button 
             onClick={() => setSelectedRetailer(retailer)}
             className="w-full bg-[#0d2818] text-white py-2 text-xs tracking-widest hover:opacity-90 flex items-center justify-center gap-2 mt-auto"
           >
             <Wallet size={14} /> MANAGE WALLET
           </button>
        </div>

      </div>
    </div>
  );
}
