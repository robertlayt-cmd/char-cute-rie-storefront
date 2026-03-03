import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingBag, Lock, CreditCard, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const AU_STATES = [
  'Australian Capital Territory',
  'New South Wales',
  'Northern Territory',
  'Queensland',
  'South Australia',
  'Tasmania',
  'Victoria',
  'Western Australia'
];

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
    saveInfo: false
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  const appliedDiscount = JSON.parse(localStorage.getItem('appliedDiscount') || 'null');
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingThreshold = settings?.free_shipping_threshold || 75;
  const shippingCost = subtotal >= shippingThreshold ? 0 : (settings?.shipping_flat_rate || 9.95);
  
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.discount_type === 'percentage') {
      discountAmount = subtotal * (appliedDiscount.discount_value / 100);
    } else {
      discountAmount = appliedDiscount.discount_value;
    }
  }
  
  const total = subtotal + shippingCost - discountAmount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateOrderNumber = () => {
    const prefix = 'CC';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const orderNumber = generateOrderNumber();
    
    const order = {
      order_number: orderNumber,
      customer_email: formData.email,
      customer_name: `${formData.firstName} ${formData.lastName}`,
      customer_phone: formData.phone,
      shipping_address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        country: 'Australia'
      },
      line_items: cartItems.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_title: item.product_title,
        variant_name: item.variant_name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
        image_url: item.image_url
      })),
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      discount_code: appliedDiscount?.code,
      total,
      status: 'pending',
      payment_method: 'paypal'
    };

    await base44.entities.Order.create(order);
    
    // Clear cart
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedDiscount');
    
    // Redirect to thank you page
    navigate(`${createPageUrl('ThankYou')}?order=${orderNumber}`);
  };

  if (cartItems.length === 0) {
    return (
      <div className="dark min-h-screen bg-zinc-950">
        <Header cartCount={0} onCartClick={() => {}} categories={[]} />
        <main className="pt-24 pb-16">
          <div className="max-w-lg mx-auto px-4 text-center py-20">
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-zinc-400 mb-6">Add some items before checking out</p>
            <Link to={createPageUrl('Shop')}>
              <Button className="bg-pink-500 hover:bg-pink-600">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-zinc-950">
      <Header cartCount={cartItems.length} onCartClick={() => {}} categories={[]} />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <Link to={createPageUrl('Cart')}>
            <Button variant="ghost" className="text-zinc-400 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Checkout Form */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="04XX XXX XXX"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Shipping Address</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        name="street"
                        required
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="123 Example Street"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City / Suburb</Label>
                        <Input
                          id="city"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input
                          id="postcode"
                          name="postcode"
                          required
                          value={formData.postcode}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {AU_STATES.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Payment</h2>
                  <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-[#003087] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Pay</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">PayPal</p>
                        <p className="text-zinc-400 text-sm">Secure payment via PayPal</p>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      You'll be redirected to PayPal to complete your payment securely.
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-pink-500 hover:bg-pink-600 btn-shine"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay ${total.toFixed(2)} AUD
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.product_id}-${item.variant_id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="relative">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100'}
                          alt={item.product_title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm line-clamp-1">{item.product_title}</h4>
                        {item.variant_name && (
                          <p className="text-zinc-400 text-xs">{item.variant_name}</p>
                        )}
                        <p className="text-pink-400 font-semibold mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3 py-6 border-t border-zinc-800">
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
                      <span>Discount ({appliedDiscount?.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-xl font-bold text-white pt-4 border-t border-zinc-800">
                  <span>Total</span>
                  <span>${total.toFixed(2)} AUD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}