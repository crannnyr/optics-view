import { useSettings } from './hooks/useSettings';
import SettingsTabsHeader from './settings/SettingsTabsHeader';
import DeliverySettingsView from './settings/DeliverySettingsView';
import RetailerApplicationsView from './settings/RetailerApplicationsView';
import PaymentSettingsView from './settings/PaymentSettingsView';
import CategoriesSettingsView from './settings/CategoriesSettingsView';

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
    fetchRetailers,
    paymentLoading,
    paymentMethods,
    setPaymentMethods,
    transferDetails,
    setTransferDetails,
    handleSavePaymentSettings,
    handleUpdateDeliveryFee,
    getDeliveryFee,
    getStatusBadge,
    formatDate,
    categories,
    categoriesLoading,
    newCategoryName,
    setNewCategoryName,
    newItemTypeInputs,
    setNewItemTypeInputs,
    categoryError,
    setCategoryError,
    handleAddCategory,
    handleDeleteCategory,
    handleAddItemType,
    handleDeleteItemType,
    handleMoveProduct,
    fetchCategories,
  } = useSettings();

  return (
    <div className="max-w-6xl">
      <SettingsTabsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        retailersCount={retailers.length}
      />

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

      {activeTab === 'retailers' && (
        <RetailerApplicationsView
          retailers={retailers}
          loadingRetailers={loadingRetailers}
          formatDate={formatDate}
          fetchRetailers={fetchRetailers}
        />
      )}

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

      {activeTab === 'categories' && (
        <CategoriesSettingsView
          categories={categories}
          categoriesLoading={categoriesLoading}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          newItemTypeInputs={newItemTypeInputs}
          setNewItemTypeInputs={setNewItemTypeInputs}
          categoryError={categoryError}
          setCategoryError={setCategoryError}
          handleAddCategory={handleAddCategory}
          handleDeleteCategory={handleDeleteCategory}
          handleAddItemType={handleAddItemType}
          handleDeleteItemType={handleDeleteItemType}
          handleMoveProduct={handleMoveProduct}
          fetchCategories={fetchCategories}
        />
      )}
    </div>
  );
}