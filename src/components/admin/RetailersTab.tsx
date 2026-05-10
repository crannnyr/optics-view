import { Loader2, Store } from 'lucide-react';
import { useRetailers } from './hooks/useRetailers';
import RetailerCard from './retailers/RetailerCard';
import RetailerPayoutModal from './retailers/RetailerPayoutModal';

export default function RetailersTab() {
  const {
    retailers,
    loading,
    copiedId,
    selectedRetailer,
    setSelectedRetailer,
    payoutAmount,
    setPayoutAmount,
    adminNote,
    setAdminNote,
    processingPayout,
    activatingRetailerId,
    handleActivateRetailer,
    handlePayout,
    copyToClipboard,
    getStoreUrl,
    getDaysRemaining
  } = useRetailers();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#0d2818]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-light">Retailer Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            {retailers.length} active retailer{retailers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {retailers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No retailers registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {retailers.map((retailer) => (
            <RetailerCard
              key={retailer.id}
              retailer={retailer}
              activatingRetailerId={activatingRetailerId}
              copiedId={copiedId}
              handleActivateRetailer={handleActivateRetailer}
              setSelectedRetailer={setSelectedRetailer}
              copyToClipboard={copyToClipboard}
              getStoreUrl={getStoreUrl}
              getDaysRemaining={getDaysRemaining}
            />
          ))}
        </div>
      )}

      {selectedRetailer && (
        <RetailerPayoutModal
          selectedRetailer={selectedRetailer}
          setSelectedRetailer={setSelectedRetailer}
          payoutAmount={payoutAmount}
          setPayoutAmount={setPayoutAmount}
          adminNote={adminNote}
          setAdminNote={setAdminNote}
          processingPayout={processingPayout}
          handlePayout={handlePayout}
        />
      )}
    </div>
  );
}
