import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { RotateCcw, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function Returns() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Returns & Refunds</h1>

          {settings?.returns_policy ? (
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{settings.returns_policy}</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Our Promise</h3>
                    <p className="text-zinc-400">
                      We want you to love your Char'Cute'rie pieces! If you're not completely happy 
                      with your purchase, we're here to help.
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h2 className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  What We Accept
                </h2>
                <ul className="text-zinc-400">
                  <li>Items with manufacturing defects</li>
                  <li>Damaged items (reported within 48 hours of delivery)</li>
                  <li>Wrong items received</li>
                  <li>Unworn/unused items in original condition (within 14 days)</li>
                </ul>

                <h2 className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  What We Can't Accept
                </h2>
                <ul className="text-zinc-400">
                  <li>Items worn or used</li>
                  <li>Custom or personalised orders</li>
                  <li>Sale items marked as final sale</li>
                  <li>Items returned after 14 days without prior approval</li>
                </ul>

                <h2 className="text-white">Return Process</h2>
                <ol className="text-zinc-400">
                  <li>Contact us at {settings?.contact_email || 'hello@cuterie.me'} with your order number</li>
                  <li>Include photos of the item and reason for return</li>
                  <li>Wait for our approval and return instructions</li>
                  <li>Ship the item back securely (customer covers return shipping)</li>
                  <li>Refund processed within 5-7 business days of receiving the return</li>
                </ol>

                <h2 className="text-white">Exchanges</h2>
                <p className="text-zinc-400">
                  We're happy to exchange items for a different colour or style, subject to availability. 
                  Contact us within 14 days of receiving your order to arrange an exchange.
                </p>
              </div>

              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Questions?</h3>
                    <p className="text-zinc-400">
                      Contact us at{' '}
                      <a href={`mailto:${settings?.contact_email || 'hello@cuterie.me'}`} className="text-pink-400 hover:text-pink-300">
                        {settings?.contact_email || 'hello@cuterie.me'}
                      </a>
                      {' '}and we'll get back to you within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}