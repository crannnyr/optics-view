import { useSettings } from './hooks/useSettings';
import SettingsTabsHeader from './settings/SettingsTabsHeader';
import DeliverySettingsView from './settings/DeliverySettingsView';
import RetailerApplicationsView from './settings/RetailerApplicationsView';
import PaymentSettingsView from './settings/PaymentSettingsView';

export default function SettingsTab() {
  const {
    activeTab,
    setActiveTab,
    editingDelivery,
    setEditingDelivery,
    newDeliveryFee,
    setNewDeliveryFee,
    retailers,
    loadingRetailers,
    paymentLoading,
    paymentMethods,
    setPaymentMethods,
    transferDetails,
    setTransferDetails,
    handleSavePaymentSettings,
    handleUpdateDeliveryFee,
    getDeliveryFee,
    getStatusBadge,
    formatDate
  } = useSettings();

  return (
    <div className="max-w-6xl">
      {/* Tab Navigation */}
      <SettingsTabsHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        retailersCount={retailers.length} 
      />

      {/* Delivery Settings Tab */}
      {activeTab === 'delivery' && (
        <DeliverySettingsView
          getDeliveryFee={getDeliveryFee}
          editingDelivery={editingDelivery}
          setEditingDelivery={setEditingDelivery}
          newDeliveryFee={newDeliveryFee}
          setNewDeliveryFee={setNewDeliveryFee}
          handleUpdateDeliveryFee={handleUpdateDeliveryFee}
        />
      )}

      {/* Retailer Applications Tab */}
      {activeTab === 'retailers' && (
        <RetailerApplicationsView
          retailers={retailers}
          loadingRetailers={loadingRetailers}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
        />
      )}

      {/* Payment Settings Tab */}
      {activeTab === 'payments' && (
        <PaymentSettingsView
          paymentLoading={paymentLoading}
          paymentMethods={paymentMethods}
          setPaymentMethods={setPaymentMethods}
          transferDetails={transferDetails}
          setTransferDetails={setTransferDetails}
          handleSavePaymentSettings={handleSavePaymentSettings}
        />
      )}
    </div>
  );
}
