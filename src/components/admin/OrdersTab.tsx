import { useOrders } from './hooks/useOrders';
import OrdersList from './OrdersList';
import OrderDetailModal from './OrderDetailModal';
import OrderTabsHeader from './orders/OrderTabsHeader';
import OrderFilters from './orders/OrderFilters';
import OrderVerificationList from './orders/OrderVerificationList';
import AdminWithdrawalsTab from './orders/AdminWithdrawalsTab';
import OrderAnalytics from './orders/OrderAnalytics';

export default function OrdersTab() {
  const {
    orders,
    filteredOrders,
    withdrawals,
    viewMode,
    selectedOrder,
    statusLoading,
    searchQuery,
    dateFilter,
    customDateRange,
    statusFilter,
    sourceFilter,
    setSourceFilter,
    sourceCounts,
    unverifiedCount,
    pendingWithdrawals,
    setViewMode,
    setSelectedOrder,
    setSearchQuery,
    setDateFilter,
    setCustomDateRange,
    setStatusFilter,
    updateStatus,
    verifyPayment,
    markUnavailable,
    markRefunded,
    processWithdrawal,
  } = useOrders();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-light text-[#0d2818]">Order Management</h2>

      <OrderTabsHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        unverifiedCount={unverifiedCount}
        pendingWithdrawals={pendingWithdrawals}
      />

      {/* Filters — hide for analytics + withdrawals */}
      {!['analytics', 'withdrawals'].includes(viewMode) && (
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
      )}

      {(viewMode === 'active' || viewMode === 'history' || viewMode === 'verify') && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {([
            { key: 'all',      label: 'All stores' },
            { key: 'main',     label: 'Main store' },
            { key: 'retailer', label: 'Retailer stores' },
          ] as const).map(o => (
            <button
              key={o.key}
              onClick={() => setSourceFilter(o.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                sourceFilter === o.key
                  ? 'bg-[#0d2818] text-white border-[#0d2818]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {o.label} ({sourceCounts[o.key]})
            </button>
          ))}
        </div>
      )}

      {viewMode === 'verify' && (
        <OrderVerificationList
          orders={filteredOrders}
          verifyPayment={verifyPayment}
          setSelectedOrder={setSelectedOrder}
          statusLoading={statusLoading}
        />
      )}

      {(viewMode === 'active' || viewMode === 'history') && (
        <OrdersList
          orders={filteredOrders}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {viewMode === 'withdrawals' && (
        <AdminWithdrawalsTab
          withdrawals={withdrawals}
          statusLoading={statusLoading}
          processWithdrawal={processWithdrawal}
        />
      )}

      {viewMode === 'analytics' && (
        <OrderAnalytics orders={orders} />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          onMarkUnavailable={markUnavailable}
          onMarkRefunded={markRefunded}
          statusLoading={statusLoading}
        />
      )}
    </div>
  );
}