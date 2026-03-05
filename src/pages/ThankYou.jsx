import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { Button } from '@/components/ui/button';
import { Check, Package, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const TikTokIcon = () => (
  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function ThankYou() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('order');

  const { data: order } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      if (!orderNumber) return null;
      const orders = await base44.entities.Order.filter({ order_number: orderNumber });
      return orders[0] || null;
    },
    enabled: !!orderNumber
  });

  return (
    <div className="dark min-h-screen bg-zinc-950">
      <Header cartCount={0} onCartClick={() => {}} categories={[]} />

      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-8"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">Thank You! 🎉</h1>
            <p className="text-xl text-zinc-300 mb-2">Your order has been placed successfully</p>
            {orderNumber && (
              <p className="text-zinc-400 mb-8">
                Order number: <span className="text-pink-400 font-mono">{orderNumber}</span>
              </p>
            )}
          </motion.div>

          {/* Order Summary */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-8 text-left"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Order Details</h3>
              
              <div className="space-y-4 mb-6">
                {order.line_items?.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80'}
                      alt={item.product_title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.product_title}</p>
                      {item.variant_name && <p className="text-zinc-400 text-sm">{item.variant_name}</p>}
                      <p className="text-zinc-400 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-medium">${item.total?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span>{order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost?.toFixed(2)}`}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-${order.discount_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-zinc-800">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2)} AUD</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid md:grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-pink-400" />
              </div>
              <h4 className="text-white font-medium mb-2">Check Your Email</h4>
              <p className="text-zinc-400 text-sm">We've sent a confirmation email with your order details</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-pink-400" />
              </div>
              <h4 className="text-white font-medium mb-2">Shipping Updates</h4>
              <p className="text-zinc-400 text-sm">You'll receive tracking info once your order ships</p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to={createPageUrl('Shop')}>
              <Button size="lg" className="bg-pink-500 hover:bg-pink-600 w-full sm:w-auto">
                Continue Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a 
              href="https://www.tiktok.com/@char.cute.rie" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-zinc-700 w-full sm:w-auto">
                Follow us on TikTok
                <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </Button>
            </a>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}