import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Package, ShoppingCart, Tag, Percent, 
  Settings, Home, Upload, Image, Menu, X, ChevronRight, Users, Palette
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', page: 'Admin', icon: LayoutDashboard },
  { label: 'Products', page: 'AdminProducts', icon: Package },
  { label: 'Orders', page: 'AdminOrders', icon: ShoppingCart },
  { label: 'Categories', page: 'AdminCategories', icon: Tag },
  { label: 'Discounts', page: 'AdminDiscounts', icon: Percent },
  { label: 'Menu', page: 'AdminMenu', icon: Menu },
  { label: 'Themes', page: 'AdminThemes', icon: Palette },
  { label: 'Users', page: 'AdminUsers', icon: Users },
  { label: 'Bulk Upload', page: 'AdminBulkUpload', icon: Upload },
  { label: 'Images', page: 'AdminImages', icon: Image },
  { label: 'Image Manager', page: 'AdminImageManager', icon: Image },
  { label: 'Settings', page: 'AdminSettings', icon: Settings },
];

export default function AdminNav({ currentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: paidOrderCount = 0 } = useQuery({
    queryKey: ['admin-paid-orders-count'],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ status: 'paid' });
      return orders.length;
    },
    refetchInterval: 60000,
  });

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <Link to={createPageUrl('Admin')} className="block">
          <img
            src="https://cuterie.me/skins/Cuterie2026/images/default/logo/default.png"
            alt="Char'Cute'rie"
            className="h-8"
          />
        </Link>
        <p className="text-xs text-zinc-500 mt-1 pl-0.5">Admin Panel</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-pink-500 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.page === 'AdminOrders' && paidOrderCount > 0 && (
                <span className="ml-auto bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {paidOrderCount > 9 ? '9+' : paidOrderCount}
                </span>
              )}
              {isActive && item.page !== 'AdminOrders' && <ChevronRight className="w-4 h-4 ml-auto" />}
              {isActive && item.page === 'AdminOrders' && paidOrderCount === 0 && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <Link
          to={createPageUrl('Home')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <Home className="w-4 h-4" />
          View Store
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 fixed left-0 top-0 bottom-0 z-40">
        <NavContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-56 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col">
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
}