import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { Truck, Clock, Package, MapPin } from 'lucide-react';

export default function Shipping() {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.filter({ is_active: true }),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  return (
    <div className="dark min-h-screen bg-zinc-950">
      <Header cartCount={0} onCartClick={() => {}} categories={categories} />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Shipping Information</h1>

          {settings?.shipping_policy ? (
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{settings.shipping_policy}</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
                    <Truck className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Standard Shipping</h3>
                  <p className="text-zinc-400">
                    ${settings?.shipping_flat_rate?.toFixed(2) || '9.95'} flat rate within Australia
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Free Shipping</h3>
                  <p className="text-zinc-400">
                    On orders over ${settings?.free_shipping_threshold?.toFixed(2) || '75.00'} AUD
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Processing Time</h3>
                  <p className="text-zinc-400">
                    Orders are processed within 1-3 business days
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Delivery Time</h3>
                  <p className="text-zinc-400">
                    3-7 business days within Australia
                  </p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h2 className="text-white">Shipping Details</h2>
                <ul className="text-zinc-400">
                  <li>All orders are shipped from Brisbane, Queensland</li>
                  <li>Tracking information will be emailed once your order ships</li>
                  <li>We use Australia Post for all domestic deliveries</li>
                  <li>Signature on delivery may be required for valuable items</li>
                </ul>

                <h2 className="text-white">International Shipping</h2>
                <p className="text-zinc-400">
                  We currently ship within Australia only. International shipping may be available 
                  in the future - follow us on TikTok for updates!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}