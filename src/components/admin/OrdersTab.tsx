import OrdersList from './OrdersList';
import OrderDetailModal from './OrderDetailModal';
import OrderTabsHeader from './orders/OrderTabsHeader';
import OrderFilters from './orders/OrderFilters';
import OrderVerificationList from './orders/OrderVerificationList';
import { useOrders } from './hooks/useOrders';
export default function OrdersTab() {
  const {
    orders,
    filteredOrders,
    viewMode,
    selectedOrder,
    statusLoading,
    searchQuery,
    dateFilter,
    customDateRange,
    statusFilter,
    setViewMode,
    setSelectedOrder,
    setSearchQuery,
    setDateFilter,
    setCustomDateRange,
    setStatusFilter,
    updateStatus,
    verifyPayment
  } = useOrders();

  // Calculate unverified transfers for the badge
  const unverifiedCount = orders.filter(
    o => o.payment_method === 'transfer' && !o.manual_payment_verified && o.status !== 'rejected'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-[#0d2818]">Order Management</h2>
      </div>

      <OrderTabsHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        unverifiedCount={unverifiedCount} 
      />

      <OrderFilters 
        viewMode={viewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        resultsCount={filteredOrders.length}
      />

      {viewMode === 'verify' ? (
        <OrderVerificationList 
          orders={filteredOrders}
          verifyPayment={verifyPayment}
          setSelectedOrder={setSelectedOrder}
          statusLoading={statusLoading}
        />
      ) : (
        <OrdersList
          orders={filteredOrders}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          statusLoading={statusLoading}
        />
      )}
    </div>
  );
}
