import { useState } from 'react';
import { Package, Settings, Upload, Store, Gift, Trophy, Truck } from 'lucide-react'; // Added Truck icon
import SettingsTab from './admin/SettingsTab';
import ProductsTab from './admin/ProductsTab';
import OrdersTab from './admin/OrdersTab';
import RetailersTab from './admin/RetailersTab';
import CombosTab from './admin/CombosTab';
import AdminTasksTab from './admin/AdminTasksTab';
import RewardClaimsTab from './admin/RewardClaimsTab'; //

// Added 'claims' to the type
type TabType = 'products' | 'orders' | 'combos' | 'retailers' | 'tasks' | 'claims' | 'settings';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  const navItems = [
    { id: 'products' as const, label: 'Products', icon: Upload },
    { id: 'combos' as const, label: 'Combo Deals', icon: Gift },
    { id: 'orders' as const, label: 'Orders', icon: Package },
    { id: 'retailers' as const, label: 'Retailers', icon: Store },
    { id: 'tasks' as const, label: 'Retailer Tasks', icon: Trophy },
    { id: 'claims' as const, label: 'Reward Claims', icon: Truck }, // <--- New Item
    { id: 'settings' as const, label: 'Delivery Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:block">
        <div className="p-8">
          <h1 className="text-2xl font-light tracking-wide text-[#0d2818]">admin.</h1>
          <p className="text-xs text-gray-500 mt-2">Simplified Panel</p>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-8 py-4 text-xs tracking-widest transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#0d2818] text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {item.label.toUpperCase()}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b z-10 flex justify-around p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`p-2 rounded ${
              activeTab === item.id
                ? 'bg-gray-100 text-[#0d2818]'
                : 'text-gray-400'
            }`}
          >
            <item.icon size={20} />
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 mt-12 md:mt-0">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'combos' && <CombosTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'retailers' && <RetailersTab />}
          {activeTab === 'tasks' && <AdminTasksTab />}
          {activeTab === 'claims' && <RewardClaimsTab />} {/* <--- Render New Tab */}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}