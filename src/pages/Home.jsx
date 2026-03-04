import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import HeroCarousel from '@/components/store/HeroCarousel';
import ProductSection from '@/components/store/ProductSection';
import MiniCart from '@/components/store/MiniCart';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Sparkles, Truck, Heart, Shield } from 'lucide-react';

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.filter({ is_active: true }, 'display_order'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'published' }, '-created_date'),
  });

  const { data: allVariants = [] } = useQuery({
    queryKey: ['variants'],
    queryFn: () => base44.entities.ProductVariant.list(),
  });

  const variantsByProduct = allVariants.reduce((acc, v) => {
    if (!acc[v.product_id]) acc[v.product_id] = [];
    acc[v.product_id].push(v);
    return acc;
  }, {});

  const featuredProducts = products.filter(p => p.is_featured).slice(0, 5);
  const newArrivals = products.filter(p => p.badge === 'new').slice(0, 8);
  const tiktokProducts = products.filter(p => p.is_tiktok_featured).slice(0, 8);
  const bestSellers = products.filter(p => p.badge === 'bestseller' || p.badge === 'hot').slice(0, 8);

  const handleAddToCart = (product, variant) => {
    const price = product.base_price + (variant?.price_adjustment || 0);
    const existingIndex = cartItems.findIndex(
      item => item.product_id === product.id && item.variant_id === variant?.id
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        variant_id: variant?.id,
        product_title: product.title,
        variant_name: variant?.name,
        price,
        quantity: 1,
        image_url: variant?.image_url || product.main_image_url
      }]);
    }
    setCartOpen(true);
  };

  const handleUpdateQuantity = (item, newQty) => {
    if (newQty < 1) {
      handleRemoveItem(item);
      return;
    }
    setCartItems(cartItems.map(i => 
      i.product_id === item.product_id && i.variant_id === item.variant_id
        ? { ...i, quantity: newQty }
        : i
    ));
  };

  const handleRemoveItem = (item) => {
    setCartItems(cartItems.filter(i => 
      !(i.product_id === item.product_id && i.variant_id === item.variant_id)
    ));
  };

  const features = [
    { icon: Sparkles, title: 'Handcrafted', desc: 'Each piece uniquely made' },
    { icon: Truck, title: 'Fast Shipping', desc: 'Australia-wide delivery' },
    { icon: Heart, title: 'Made with Love', desc: 'In Melbourne, Australia' },
    { icon: Shield, title: 'Quality Promise', desc: 'Premium polymer clay' },
  ];

  return (
    <div className="dark min-h-screen bg-zinc-950">
      <Header 
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
        categories={categories}
      />

      <MiniCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Hero */}
      <HeroCarousel products={featuredProducts.length ? featuredProducts : products.slice(0, 3)} />

      {/* Features Bar */}
      <section className="bg-zinc-900/50 border-y border-zinc-800 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-zinc-500 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh drops just for you ✨"
        badge="✨ JUST IN"
        products={newArrivals.length ? newArrivals : products.slice(0, 8)}
        variants={variantsByProduct}
        onAddToCart={handleAddToCart}
        viewAllLink={`${createPageUrl('Shop')}?filter=new`}
      />

      {/* TikTok Section */}
      {tiktokProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-zinc-950 via-pink-950/20 to-zinc-950">
          <ProductSection
            title="As Seen on TikTok"
            subtitle="Fan favorites from @char.cute.rie"
            badge="📱 TIKTOK FAVE"
            badgeColor="bg-gradient-to-r from-pink-500 to-cyan-400"
            products={tiktokProducts}
            variants={variantsByProduct}
            onAddToCart={handleAddToCart}
            viewAllLink={`${createPageUrl('Shop')}?filter=tiktok`}
            className="py-0"
          />
          
          {/* TikTok CTA */}
          <div className="max-w-7xl mx-auto px-4 mt-10">
            <motion.a
              href="https://www.tiktok.com/@char.cute.rie"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="block bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30 rounded-2xl p-8 text-center hover:border-pink-500/50 transition-all"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="text-2xl font-bold text-white">@char.cute.rie</span>
              </div>
              <p className="text-zinc-300">Follow us for new drops, behind the scenes & exclusive offers!</p>
            </motion.a>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Customer favorites you'll love"
        badge="🔥 TRENDING"
        badgeColor="bg-orange-500"
        products={bestSellers.length ? bestSellers : products.slice(0, 8)}
        variants={variantsByProduct}
        onAddToCart={handleAddToCart}
        viewAllLink={`${createPageUrl('Shop')}?filter=bestseller`}
      />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <motion.a
                  key={cat.id}
                  href={`${createPageUrl('Shop')}?category=${cat.slug}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden"
                >
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400'}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-end p-6">
                    <h3 className="text-white font-bold text-xl group-hover:text-pink-400 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}