import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Lock, ArrowLeft, Loader2, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

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
  const paypalContainerRef = useRef(null);
  const paypalRendered = useRef(false);
  const [cartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formValid, setFormValid] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
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
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    const valid = !!(updated.email && updated.phone && updated.firstName && updated.lastName && updated.street && updated.city && updated.state && updated.postcode);
    setFormValid(valid);
  };

  const renderPaypalButtons = (paypal) => {
    if (!paypalContainerRef.current || paypalRendered.current) return;
    if (!paypal?.Buttons) { console.error('PayPal SDK not available'); return; }
    paypalRendered.current = true;
    paypalContainerRef.current.innerHTML = '';

    paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
      createOrder: async () => {
        setFormError('');
        const orderNumber = generateOrderNumber();
        const createdOrder = await base44.entities.Order.create(buildOrder(orderNumber));
        const paypalRes = await base44.functions.invoke('paypalCreateOrder', {
          amount: total,
          currency: 'AUD',
          orderId: createdOrder.id,
          shippingAddress: {
            name: formData.firstName + ' ' + formData.lastName,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postcode: formData.postcode,
          },
        });
        if (!paypalRes.data?.id) throw new Error('Failed to create PayPal order');
        sessionStorage.setItem('internalOrderId', createdOrder.id);
        sessionStorage.setItem('orderNumber', orderNumber);
        return paypalRes.data.id;
      },
      onApprove: async (data) => {
        setIsProcessing(true);
        const internalOrderId = sessionStorage.getItem('internalOrderId');
        const orderNumber = sessionStorage.getItem('orderNumber');
        await base44.functions.invoke('paypalCaptureOrder', {
          paypalOrderId: data.orderID,
          internalOrderId,
        });
        sendConfirmationEmail(orderNumber);
        localStorage.removeItem('cart');
        localStorage.removeItem('appliedDiscount');
        sessionStorage.removeItem('internalOrderId');
        sessionStorage.removeItem('orderNumber');
        navigate(createPageUrl('ThankYou') + '?order=' + orderNumber);
      },
      onError: () => {
        setFormError('Payment failed. Please try again.');
        setIsProcessing(false);
      },
    }).render(paypalContainerRef.current);
  };

  // Load PayPal SDK once on mount
  useEffect(() => {
    base44.functions.invoke('paypalClientId').then(res => {
      const clientId = res.data?.clientId || 'sb';
      if (document.querySelector('#paypal-sdk-script')) return;
      const script = document.createElement('script');
      script.id = 'paypal-sdk-script';
      script.src = 'https://www.paypal.com/sdk/js?client-id=' + clientId + '&currency=AUD';
      script.onload = () => {
        window.__paypalSdkReady = true;
        // If form is already valid, render now
        if (window.__paypalFormValid && !paypalRendered.current && paypalContainerRef.current) {
          renderPaypalButtons(window.paypal);
        }
      };
      document.body.appendChild(script);
    });
    return () => {
      const s = document.querySelector('#paypal-sdk-script');
      if (s) s.remove();
      window.__paypalSdkReady = false;
      window.__paypalFormValid = false;
    };
  }, []); // eslint-disable-line

  // Render PayPal buttons whenever form becomes valid
  useEffect(() => {
    if (!formValid) {
      paypalRendered.current = false;
      window.__paypalFormValid = false;
      return;
    }
    window.__paypalFormValid = true;
    if (paypalRendered.current) return;
    if (window.__paypalSdkReady && window.paypal && paypalContainerRef.current) {
      renderPaypalButtons(window.paypal);
    }
    // else onload callback above will handle it
  }, [formValid]); // eslint-disable-line

  const generateOrderNumber = () => {
    const prefix = 'CC';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return prefix + '-' + timestamp + '-' + random;
  };

  const buildOrder = (orderNumber) => ({
    order_number: orderNumber,
    customer_email: formData.email,
    customer_name: formData.firstName + ' ' + formData.lastName,
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
  });

  const sendConfirmationEmail = (orderNumber) => {
    const itemRows = cartItems.map(item =>
      '<tr>' +
      '<td style="padding:12px 8px;border-bottom:1px solid #27272a;"><strong style="color:#ffffff;">' + item.product_title + '</strong>' +
      (item.variant_name ? '<br/><span style="color:#a1a1aa;font-size:13px;">' + item.variant_name + '</span>' : '') +
      '</td>' +
      '<td style="padding:12px 8px;border-bottom:1px solid #27272a;color:#a1a1aa;text-align:center;">x' + item.quantity + '</td>' +
      '<td style="padding:12px 8px;border-bottom:1px solid #27272a;color:#ec4899;font-weight:bold;text-align:right;">$' + (item.price * item.quantity).toFixed(2) + '</td>' +
      '</tr>'
    ).join('');

    const discountRow = discountAmount > 0
      ? '<tr><td style="color:#22c55e;padding:6px 8px;">Discount (' + appliedDiscount?.code + ')</td><td style="color:#22c55e;text-align:right;padding:6px 8px;">-$' + discountAmount.toFixed(2) + '</td></tr>'
      : '';

    const emailBody = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
      '<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">' +
      '<div style="max-width:600px;margin:0 auto;padding:40px 20px;">' +
      '<div style="text-align:center;margin-bottom:32px;"><img src="https://cuterie.me/skins/Cuterie2026/images/default/logo/default.png" alt="Charcuteri" style="height:60px;" /></div>' +
      '<div style="background:linear-gradient(135deg,#ec4899,#a855f7);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">' +
      '<div style="font-size:48px;margin-bottom:12px;">🎉</div>' +
      '<h1 style="color:#ffffff;margin:0 0 8px;font-size:28px;font-weight:800;">Order Confirmed!</h1>' +
      '<p style="color:rgba(255,255,255,0.85);margin:0;font-size:16px;">Thanks ' + formData.firstName + '! We\'re so excited to make your order.</p>' +
      '</div>' +
      '<div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">' +
      '<p style="color:#a1a1aa;font-size:13px;margin:0 0 4px;">Order Number</p>' +
      '<p style="color:#ec4899;font-size:20px;font-weight:700;font-family:monospace;margin:0;">' + orderNumber + '</p>' +
      '</div>' +
      '<div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">' +
      '<h3 style="color:#ffffff;margin:0 0 16px;font-size:16px;">Your Items</h3>' +
      '<table style="width:100%;border-collapse:collapse;">' + itemRows + '</table>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:16px;">' +
      '<tr><td style="color:#a1a1aa;padding:6px 8px;">Subtotal</td><td style="color:#ffffff;text-align:right;padding:6px 8px;">$' + subtotal.toFixed(2) + '</td></tr>' +
      '<tr><td style="color:#a1a1aa;padding:6px 8px;">Shipping</td><td style="color:#ffffff;text-align:right;padding:6px 8px;">' + (shippingCost === 0 ? 'FREE' : '$' + shippingCost.toFixed(2)) + '</td></tr>' +
      discountRow +
      '<tr style="border-top:1px solid #27272a;"><td style="color:#ffffff;font-weight:700;font-size:18px;padding:12px 8px;">Total</td><td style="color:#ec4899;font-weight:700;font-size:18px;text-align:right;padding:12px 8px;">$' + total.toFixed(2) + ' AUD</td></tr>' +
      '</table></div>' +
      '<div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:24px;">' +
      '<h3 style="color:#ffffff;margin:0 0 12px;font-size:16px;">Shipping To</h3>' +
      '<p style="color:#d4d4d8;margin:0;line-height:1.6;">' + formData.street + '<br/>' + formData.city + ', ' + formData.state + ' ' + formData.postcode + '<br/>Australia</p>' +
      '</div>' +
      '<div style="text-align:center;margin-bottom:24px;"><a href="https://www.tiktok.com/@char.cute.rie" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">Follow @char.cute.rie on TikTok 💕</a></div>' +
      '<p style="color:#52525b;text-align:center;font-size:13px;margin:0;">© 2024 Char\'Cute\'rie · Made with love in Melbourne, Australia 🇦🇺</p>' +
      '</div></body></html>';

    base44.integrations.Core.SendEmail({
      to: formData.email,
      from_name: "Char'Cute'rie",
      subject: 'Order Confirmed! 🎉 ' + orderNumber,
      body: emailBody,
    });
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
              <Button className="bg-pink-500 hover:bg-pink-600">Continue Shopping</Button>
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

              <form className="space-y-8">
                {/* Contact */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-zinc-300">Email</Label>
                      <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="your@email.com" className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-zinc-300">Phone</Label>
                      <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange} placeholder="04XX XXX XXX" className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Shipping Address</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-zinc-300">First Name</Label>
                        <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-zinc-300">Last Name</Label>
                        <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="street" className="text-zinc-300">Street Address</Label>
                      <Input id="street" name="street" required value={formData.street} onChange={handleInputChange} placeholder="123 Example Street" className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-zinc-300">City / Suburb</Label>
                        <Input id="city" name="city" required value={formData.city} onChange={handleInputChange} className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                      </div>
                      <div>
                        <Label htmlFor="postcode" className="text-zinc-300">Postcode</Label>
                        <Input id="postcode" name="postcode" required value={formData.postcode} onChange={handleInputChange} className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-zinc-300">State</Label>
                      <Select value={formData.state} onValueChange={(value) => {
                        const updated = { ...formData, state: value };
                        setFormData(updated);
                        const valid = !!(updated.email && updated.phone && updated.firstName && updated.lastName && updated.street && updated.city && updated.state && updated.postcode);
                        setFormValid(valid);
                      }}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {AU_STATES.map(state => (
                            <SelectItem key={state} value={state} className="text-white focus:bg-zinc-700 focus:text-white">{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Payment</h2>
                  {!formValid && (
                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
                      <Lock className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400 text-sm">Complete the form above to continue to payment</p>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
                      <Loader2 className="w-8 h-8 text-pink-500 mx-auto mb-3 animate-spin" />
                      <p className="text-zinc-400 text-sm">Processing your order...</p>
                    </div>
                  )}
                  {/* Always keep container in DOM so ref is always available */}
                  <div className={formValid && !isProcessing ? '' : 'hidden'}>
                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                      {formError && <p className="text-red-400 text-sm mb-4">{formError}</p>}
                      <div ref={paypalContainerRef} id="paypal-button-container" />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.product_id + '-' + item.variant_id}
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
                        {item.variant_name && <p className="text-zinc-400 text-xs">{item.variant_name}</p>}
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
                    <span>{shippingCost === 0 ? 'FREE' : '$' + shippingCost.toFixed(2)}</span>
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