import { useState } from 'react';
import { Package, Settings, Upload, Store, Users, PackageSearch, Truck, Building2 } from 'lucide-react';
import SettingsTab from './admin/SettingsTab';
import ProductsTab from './admin/ProductsTab';
import OrdersTab from './admin/OrdersTab';
import RetailersTab from './admin/RetailersTab';
import UsersTab from './admin/UsersTab';
import VendorApplicationsTab from './admin/VendorApplicationsTab';
import VendorOrdersTab from './admin/VendorOrdersTab';
import VendorManagementTab from './admin/VendorManagementTab';

type TabType = 'products' | 'orders' | 'retailers' | 'vendors' | 'vendor-orders' | 'vendor-manage' | 'users' | 'settings';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  const navItems = [
    { id: 'products'      as const, label: 'Products',      icon: Upload },
    { id: 'orders'        as const, label: 'Orders',        icon: Package },
    { id: 'retailers'     as const, label: 'Retailers',     icon: Store },
    { id: 'vendors'       as const, label: 'Listings',      icon: PackageSearch },
    { id: 'vendor-manage' as const, label: 'Vendors',       icon: Building2 },
    { id: 'vendor-orders' as const, label: 'Vendor Orders', icon: Truck },
    { id: 'users'         as const, label: 'Users',         icon: Users },
    { id: 'settings'      as const, label: 'Settings',      icon: Settings },
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

      {/* Mobile Navigation — horizontally scrollable so 8 tabs never squeeze
          or overflow the layout on narrow screens; buttons are flex-shrink-0
          so they stay a consistent minimal size instead of deforming. */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b z-10 flex items-center gap-1 overflow-x-auto px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded text-[9px] tracking-wide transition-colors ${
              activeTab === item.id ? 'bg-gray-100 text-[#0d2818]' : 'text-gray-400'
            }`}
          >
            <item.icon size={17} />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 mt-16 md:mt-0">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'products'      && <ProductsTab />}
          {activeTab === 'orders'        && <OrdersTab />}
          {activeTab === 'retailers'     && <RetailersTab />}
          {activeTab === 'vendors'       && <VendorApplicationsTab />}
          {activeTab === 'vendor-orders' && <VendorOrdersTab />}
          {activeTab === 'vendor-manage' && <VendorManagementTab />}
          {activeTab === 'users'         && <UsersTab />}
          {activeTab === 'settings'      && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}
