import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminGuard from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, ShoppingCart, DollarSign, TrendingUp, 
  Plus, Settings, Tag, Image, Users, ArrowRight,
  Clock, CheckCircle, Truck, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;

  const recentOrders = orders.slice(0, 5);

  const stats = [
    { 
      title: 'Total Revenue', 
      value: `$${totalRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-green-500',
      change: '+12%'
    },
    { 
      title: 'Total Orders', 
      value: orders.length, 
      icon: ShoppingCart, 
      color: 'bg-blue-500',
      change: '+5%'
    },
    { 
      title: 'Products', 
      value: products.length, 
      icon: Package, 
      color: 'bg-purple-500',
      change: null
    },
    { 
      title: 'Pending Orders', 
      value: pendingOrders, 
      icon: Clock, 
      color: 'bg-orange-500',
      change: null
    },
  ];

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    paid: 'bg-green-500/20 text-green-400',
    shipped: 'bg-blue-500/20 text-blue-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const statusIcons = {
    pending: Clock,
    paid: CheckCircle,
    shipped: Truck,
    cancelled: XCircle,
  };

  return (
    <AdminLayout currentPage="Admin">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400">Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('AdminProducts')}>
              <Button className="bg-pink-500 hover:bg-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" className="border-zinc-700">
                View Store
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                      {stat.change && (
                        <p className="text-green-400 text-sm flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3 h-3" />
                          {stat.change} this month
                        </p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.color} bg-opacity-20 flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Recent Orders</CardTitle>
                <Link to={createPageUrl('AdminOrders')}>
                  <Button variant="ghost" size="sm" className="text-pink-400">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No orders yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => {
                      const StatusIcon = statusIcons[order.status] || Clock;
                      return (
                        <Link 
                          key={order.id} 
                          to={`${createPageUrl('AdminOrders')}?id=${order.id}`}
                          className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg ${statusColors[order.status]} flex items-center justify-center`}>
                              <StatusIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{order.order_number}</p>
                              <p className="text-zinc-400 text-sm">{order.customer_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">${order.total?.toFixed(2)}</p>
                            <p className={`text-sm capitalize ${statusColors[order.status]?.split(' ')[1]}`}>
                              {order.status}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('AdminProducts')} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Products</p>
                    <p className="text-zinc-400 text-sm">{products.length} items</p>
                  </div>
                </Link>
                <Link to={createPageUrl('AdminOrders')} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Orders</p>
                    <p className="text-zinc-400 text-sm">{orders.length} total</p>
                  </div>
                </Link>
                <Link to={createPageUrl('AdminCategories')} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Categories</p>
                    <p className="text-zinc-400 text-sm">{categories.length} categories</p>
                  </div>
                </Link>
                <Link to={createPageUrl('AdminDiscounts')} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Discount Codes</p>
                    <p className="text-zinc-400 text-sm">Manage promotions</p>
                  </div>
                </Link>
                <Link to={createPageUrl('AdminSettings')} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-zinc-500/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Settings</p>
                    <p className="text-zinc-400 text-sm">Store configuration</p>
                  </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                  </div>
                  </div>
                  </AdminLayout>
  );
}