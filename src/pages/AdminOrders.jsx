import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, ArrowLeft, Clock, CheckCircle, Truck, XCircle,
  Mail, Phone, MapPin, Package, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
  paid: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', label: 'Paid' },
  shipped: { icon: Truck, color: 'bg-blue-500/20 text-blue-400', label: 'Shipped' },
  cancelled: { icon: XCircle, color: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
    }
  });

  React.useEffect(() => {
    if (orderId && orders.length) {
      const order = orders.find(o => o.id === orderId);
      if (order) setSelectedOrder(order);
    }
  }, [orderId, orders]);

  const filtered = orders.filter(o => {
    if (search && !o.order_number?.toLowerCase().includes(search.toLowerCase()) &&
        !o.customer_name?.toLowerCase().includes(search.toLowerCase()) &&
        !o.customer_email?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = async (order, newStatus) => {
    await updateOrder.mutateAsync({ id: order.id, data: { status: newStatus } });
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    // Send email notification to customer
    const statusMessages = {
      paid: { subject: `Order ${order.order_number} - Payment Confirmed! 🎉`, emoji: '✅', title: 'Payment Confirmed!', msg: `Great news! Your payment has been confirmed and we're now preparing your order with love. 💕` },
      shipped: { subject: `Order ${order.order_number} - Your order is on its way! 📦`, emoji: '📦', title: 'Your Order is Shipped!', msg: `Exciting news! Your Char'Cute'rie order has been shipped and is on its way to you. It should arrive within the estimated delivery window.` },
      cancelled: { subject: `Order ${order.order_number} - Order Cancelled`, emoji: '😢', title: 'Order Cancelled', msg: `Your order has been cancelled. If you have any questions or this was a mistake, please contact us and we'll do our best to help.` },
    };

    const notification = statusMessages[newStatus];
    if (notification && order.customer_email) {
      base44.integrations.Core.SendEmail({
        to: order.customer_email,
        from_name: "Char'Cute'rie",
        subject: notification.subject,
        body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://cuterie.me/skins/Cuterie2026/images/default/logo/default.png" alt="Char'Cute'rie" style="height:60px;" />
    </div>
    <div style="background:linear-gradient(135deg,#ec4899,#a855f7);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:12px;">${notification.emoji}</div>
      <h1 style="color:#ffffff;margin:0 0 8px;font-size:26px;font-weight:800;">${notification.title}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Hi ${order.customer_name}! ${notification.msg}</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#a1a1aa;padding:6px 0;">Order Number</td><td style="color:#ec4899;font-family:monospace;font-weight:700;text-align:right;padding:6px 0;">${order.order_number}</td></tr>
        <tr><td style="color:#a1a1aa;padding:6px 0;">Order Total</td><td style="color:#ffffff;font-weight:700;text-align:right;padding:6px 0;">$${order.total?.toFixed(2)} AUD</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://www.tiktok.com/@char.cute.rie" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">Follow @char.cute.rie on TikTok 💕</a>
    </div>
    <p style="color:#52525b;text-align:center;font-size:13px;margin:0;">© 2024 Char'Cute'rie · Made with love in Melbourne, Australia 🇦🇺</p>
  </div>
</body>
</html>`
      });
    }
  };

  return (
    <AdminLayout currentPage="AdminOrders">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Orders</h1>
            <p className="text-zinc-400">{orders.length} total orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-white focus:bg-zinc-700 focus:text-white">All Status</SelectItem>
              <SelectItem value="pending" className="text-white focus:bg-zinc-700 focus:text-white">Pending</SelectItem>
              <SelectItem value="paid" className="text-white focus:bg-zinc-700 focus:text-white">Paid</SelectItem>
              <SelectItem value="shipped" className="text-white focus:bg-zinc-700 focus:text-white">Shipped</SelectItem>
              <SelectItem value="cancelled" className="text-white focus:bg-zinc-700 focus:text-white">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-zinc-400 font-medium">Order</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Customer</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Date</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Total</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                    <th className="text-right p-4 text-zinc-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="p-4">
                          <span className="text-white font-mono">{order.order_number}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-white">{order.customer_name}</p>
                            <p className="text-zinc-400 text-sm">{order.customer_email}</p>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400">
                          {order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="p-4">
                          <span className="text-white font-semibold">${order.total?.toFixed(2)}</span>
                        </td>
                        <td className="p-4">
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Select 
                            value={order.status} 
                            onValueChange={(v) => handleStatusChange(order, v)}
                          >
                            <SelectTrigger className="w-[130px] bg-zinc-800 border-zinc-700 text-white" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              <SelectItem value="pending" className="text-white focus:bg-zinc-700 focus:text-white">Pending</SelectItem>
                              <SelectItem value="paid" className="text-white focus:bg-zinc-700 focus:text-white">Paid</SelectItem>
                              <SelectItem value="shipped" className="text-white focus:bg-zinc-700 focus:text-white">Shipped</SelectItem>
                              <SelectItem value="cancelled" className="text-white focus:bg-zinc-700 focus:text-white">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:bg-zinc-700 [&>button]:hover:bg-zinc-600 [&>button]:rounded-md [&>button]:border [&>button]:border-zinc-600">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3">
                Order {selectedOrder?.order_number}
                {selectedOrder && (
                  <Badge className={statusConfig[selectedOrder.status]?.color}>
                    {statusConfig[selectedOrder.status]?.label}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <h4 className="text-zinc-400 text-sm mb-3">Customer</h4>
                    <p className="text-white font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-zinc-300 flex items-center gap-2 mt-2">
                      <Mail className="w-4 h-4" />
                      {selectedOrder.customer_email}
                    </p>
                    {selectedOrder.customer_phone && (
                      <p className="text-zinc-300 flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4" />
                        {selectedOrder.customer_phone}
                      </p>
                    )}
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <h4 className="text-zinc-400 text-sm mb-3">Shipping Address</h4>
                    {selectedOrder.shipping_address && (
                      <div className="text-zinc-300">
                        <p>{selectedOrder.shipping_address.street}</p>
                        <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}</p>
                        <p>{selectedOrder.shipping_address.postcode}</p>
                        <p>{selectedOrder.shipping_address.country}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="text-white font-medium mb-3">Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.line_items?.length > 0 ? selectedOrder.line_items.map((item, i) => (
                      <div key={i} className="flex gap-4 bg-zinc-800 rounded-lg p-3">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.product_title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.product_title}</p>
                          {item.variant_name && <p className="text-zinc-400 text-sm">{item.variant_name}</p>}
                          <p className="text-zinc-400 text-sm">Qty: {item.quantity} × ${item.unit_price?.toFixed(2)}</p>
                        </div>
                        <p className="text-white font-semibold">${item.total?.toFixed(2)}</p>
                      </div>
                    )) : (
                      <p className="text-zinc-500 text-sm italic">No items found for this order.</p>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Shipping</span>
                    <span>${selectedOrder.shipping_cost?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({selectedOrder.discount_code})</span>
                      <span>-${selectedOrder.discount_amount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-zinc-700">
                    <span>Total</span>
                    <span>${selectedOrder.total?.toFixed(2)} AUD</span>
                  </div>
                </div>

                {/* Status Update */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Update Status:</span>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(v) => handleStatusChange(selectedOrder, v)}
                  >
                    <SelectTrigger className="w-[160px] bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="pending" className="text-white focus:bg-zinc-700 focus:text-white">Pending</SelectItem>
                      <SelectItem value="paid" className="text-white focus:bg-zinc-700 focus:text-white">Paid</SelectItem>
                      <SelectItem value="shipped" className="text-white focus:bg-zinc-700 focus:text-white">Shipped</SelectItem>
                      <SelectItem value="cancelled" className="text-white focus:bg-zinc-700 focus:text-white">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}