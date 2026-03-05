import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import MiniCart from '@/components/store/MiniCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag, Tag, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Cart() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.filter({ is_active: true }),
  });

  const { data: discountCodes = [] } = useQuery({
    queryKey: ['discountCodes'],
    queryFn: () => base44.entities.DiscountCode.filter({ is_active: true }),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeShippingEnabled = settings?.free_shipping_enabled !== false;
  const shippingThreshold = settings?.free_shipping_threshold || 75;
  const flatRate = settings?.shipping_flat_rate || 9.95;
  const shippingCost = freeShippingEnabled && subtotal >= shippingThreshold ? 0 : flatRate;
  
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.discount_type === 'percentage') {
      discountAmount = subtotal * (appliedDiscount.discount_value / 100);
    } else {
      discountAmount = appliedDiscount.discount_value;
    }
  }
  
  const total = subtotal + shippingCost - discountAmount;

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

  const applyDiscountCode = () => {
    setDiscountError('');
    const code = discountCodes.find(c => 
      c.code.toLowerCase() === discountCode.toLowerCase() && c.is_active
    );
    
    if (!code) {
      setDiscountError('Invalid discount code');
      return;
    }
    
    if (code.minimum_order && subtotal < code.minimum_order) {
      setDiscountError(`Minimum order of $${code.minimum_order} required`);
      return;
    }
    
    if (code.max_uses > 0 && code.times_used >= code.max_uses) {
      setDiscountError('This code has reached its usage limit');
      return;
    }
    
    setAppliedDiscount(code);
    localStorage.setItem('appliedDiscount', JSON.stringify(code));
  };

  useEffect(() => {
    const saved = localStorage.getItem('appliedDiscount');
    if (saved) {
      setAppliedDiscount(JSON.parse(saved));
    }
  }, []);

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

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
              <p className="text-zinc-400 mb-6">Looks like you haven't added anything yet</p>
              <Link to={createPageUrl('Shop')}>
                <Button className="bg-pink-500 hover:bg-pink-600">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.product_id}-${item.variant_id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
                    >
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200'}
                        alt={item.product_title}
                        className="w-28 h-28 object-cover rounded-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-base md:text-lg mb-1">{item.product_title}</h4>
                        {item.variant_name && (
                          <p className="text-zinc-400 text-sm mb-2">{item.variant_name}</p>
                        )}
                        <p className="text-pink-400 font-bold text-lg">${item.price.toFixed(2)}</p>
                        
                        {/* Qty controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="icon" className="h-7 w-7 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white" onClick={() => handleUpdateQuantity(item, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-white w-7 text-center text-sm">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white" onClick={() => handleUpdateQuantity(item, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Total + Delete */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white font-semibold text-sm">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-400" onClick={() => handleRemoveItem(item)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Link to={createPageUrl('Shop')}>
                  <Button variant="ghost" className="text-pink-400">
                    ← Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24">
                  <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

                  {/* Free Shipping Progress */}
                  {freeShippingEnabled && subtotal < shippingThreshold && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-zinc-400">Free shipping progress</span>
                        <span className="text-pink-400">${(shippingThreshold - subtotal).toFixed(2)} away</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all"
                          style={{ width: `${Math.min(100, (subtotal / shippingThreshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Discount Code */}
                  <div className="mb-6">
                    <label className="text-sm text-zinc-400 mb-2 block">Discount Code</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="bg-zinc-800 border-zinc-700"
                        disabled={!!appliedDiscount}
                      />
                      {appliedDiscount ? (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setAppliedDiscount(null);
                            setDiscountCode('');
                            localStorage.removeItem('appliedDiscount');
                          }}
                          className="border-zinc-700"
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button onClick={applyDiscountCode} className="bg-zinc-700">
                          Apply
                        </Button>
                      )}
                    </div>
                    {discountError && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {discountError}
                      </p>
                    )}
                    {appliedDiscount && (
                      <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {appliedDiscount.code} applied!
                      </p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-zinc-800">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-xl font-bold text-white mb-6">
                    <span>Total</span>
                    <span>${total.toFixed(2)} AUD</span>
                  </div>

                  <Link to={createPageUrl('Checkout')}>
                    <Button className="w-full bg-pink-500 hover:bg-pink-600 btn-shine" size="lg">
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>

                  <p className="text-xs text-zinc-500 text-center mt-4">
                    Secure checkout powered by PayPal
                  </p>
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