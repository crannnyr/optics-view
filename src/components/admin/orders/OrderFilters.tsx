import { Search } from 'lucide-react';

interface OrderFiltersProps {
  viewMode: 'active' | 'verify' | 'history';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateFilter: 'all' | 'today' | 'custom';
  setDateFilter: (filter: 'all' | 'today' | 'custom') => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (range: { start: string; end: string }) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  resultsCount: number;
}

export default function OrderFilters({
  viewMode,
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  customDateRange,
  setCustomDateRange,
  statusFilter,
  setStatusFilter,
  resultsCount
}: OrderFiltersProps) {
  return (
    <div className="bg-white border rounded-sm p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
         <Search className="absolute left-3 top-3 text-gray-400" size={16} />
         <input
           type="text"
           placeholder="Search by name, email, Order ID, or Paystack Ref..."
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="w-full border pl-10 p-3 text-sm focus:border-[#0d2818] outline-none rounded"
         />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">Date</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'custom')}
            className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none bg-white rounded"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {viewMode !== 'verify' && (
           <div>
             <label className="block text-xs uppercase text-gray-500 mb-2">Status</label>
             <select
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none bg-white rounded"
             >
               <option value="all">All Statuses</option>
               <option value="pending">Pending</option>
               <option value="approved">Approved</option>
               <option value="shipped">Shipped</option>
               <option value="delivered">Delivered</option>
               <option value="rejected">Rejected</option>
             </select>
           </div>
        )}

        {/* Results Count */}
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            <span className="font-bold text-[#0d2818]">{resultsCount}</span> orders found
          </div>
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-xs uppercase text-gray-500 mb-2">Start Date</label>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
              className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none rounded"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 mb-2">End Date</label>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
              className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
