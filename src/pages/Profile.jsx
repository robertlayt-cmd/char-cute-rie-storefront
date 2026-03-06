import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User, Camera, Globe, ShoppingBag, MapPin,
  Save, Loader2, CheckCircle, Package, Clock, Truck, LogOut } from
'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AU_STATES = [
'Australian Capital Territory', 'New South Wales', 'Northern Territory',
'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'];


const TikTokIcon = () =>
<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>;


const InstagramIcon = () =>
<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>;


export default function Profile() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState('');

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders', currentUser?.email],
    enabled: !!currentUser?.email,
    queryFn: () => base44.entities.Order.filter({ customer_email: currentUser.email }, '-created_date', 20)
  });

  const [form, setForm] = useState({
    full_name: '', phone: '', business_name: '', description: '',
    profile_image_url: '', banner_image_url: '',
    website_url: '', tiktok_url: '', instagram_url: '', facebook_url: '',
    default_address: { first_name: '', last_name: '', street: '', city: '', state: '', postcode: '', country: 'Australia' }
  });

  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        full_name: form.full_name || currentUser.full_name || '',
        phone: form.phone || currentUser.phone || '',
        business_name: form.business_name || currentUser.business_name || '',
        description: form.description || currentUser.description || '',
        profile_image_url: form.profile_image_url || currentUser.profile_image_url || '',
        banner_image_url: form.banner_image_url || currentUser.banner_image_url || '',
        website_url: form.website_url || currentUser.website_url || '',
        tiktok_url: form.tiktok_url || currentUser.tiktok_url || '',
        instagram_url: form.instagram_url || currentUser.instagram_url || '',
        facebook_url: form.facebook_url || currentUser.facebook_url || '',
        default_address: form.default_address?.street ? form.default_address : currentUser.default_address || { first_name: '', last_name: '', street: '', city: '', state: '', postcode: '', country: 'Australia' }
      }));
    }
  }, [currentUser?.id]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // If user was community-enabled and changed key profile fields, set back to pending
      const communityFields = ['business_name', 'description', 'profile_image_url', 'banner_image_url', 'website_url', 'tiktok_url', 'instagram_url', 'facebook_url'];
      const wasEnabled = currentUser?.community_status === 'enabled';
      const hasChanges = wasEnabled && communityFields.some((f) => data[f] !== currentUser[f]);
      const payload = hasChanges ? { ...data, community_status: 'pending' } : data;
      return base44.auth.updateMe(payload);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['me'], (old) => ({ ...old, ...updatedUser }));
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const handleUpload = async (field, file) => {
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, [field]: file_url }));
    setUploading('');
  };

  const handleSave = () => saveMutation.mutate(form);

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    paid: 'bg-green-500/20 text-green-400',
    shipped: 'bg-blue-500/20 text-blue-400',
    cancelled: 'bg-red-500/20 text-red-400'
  };

  if (userLoading) {
    return (
      <div className="dark min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>);

  }

  if (!currentUser) {
    base44.auth.redirectToLogin(window.location.href);
    return null;
  }

  return (
    <div className="dark min-h-screen bg-zinc-950">
      <Header cartCount={0} onCartClick={() => window.location.href = createPageUrl('Cart')} categories={[]} />

      {/* Banner */}
      <div className="relative bg-gradient-to-r from-pink-900/40 to-purple-900/40" style={{ height: '25rem', paddingTop: '6rem' }}>
        {form.banner_image_url &&
        <img src={form.banner_image_url} className="w-full h-full object-cover" alt="Banner" />
        }
        <label className="absolute bottom-3 right-3 cursor-pointer">
          <div className="bg-zinc-900/80 backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-2 text-zinc-300 text-sm hover:text-white transition-colors">
            <Camera className="w-4 h-4" />
            {uploading === 'banner_image_url' ? 'Uploading…' : 'Change Banner'}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUpload('banner_image_url', e.target.files[0])} />
        </label>
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-12 mb-8 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-zinc-800 border-4 border-zinc-950 overflow-hidden relative z-10">
              {form.profile_image_url ?
              <img src={form.profile_image_url} className="w-full h-full object-cover" alt="Profile" /> :
              <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-zinc-600" /></div>
              }
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-pink-600 transition-colors z-20">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUpload('profile_image_url', e.target.files[0])} />
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{form.full_name || currentUser.full_name}</h1>
            {form.business_name && <p className="text-pink-400 font-medium">{form.business_name}</p>}
            <p className="text-zinc-400 text-sm">{currentUser.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => base44.auth.logout(createPageUrl('Home'))}
              className="text-zinc-400 hover:text-red-400 border border-zinc-700">

              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-pink-500 hover:bg-pink-600">

              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {saved ? 'Saved!' : 'Save Profile'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="profile" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-zinc-400">Profile</TabsTrigger>
            <TabsTrigger value="address" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-zinc-400">Address</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-zinc-400">My Orders</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-base">Personal Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-zinc-300">Display Name</Label>
                    <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Your name" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="04XX XXX XXX" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Business Name</Label>
                    <Input value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} placeholder="Your business name" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Description / Bio</Label>
                    <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Tell us about yourself…" className="bg-zinc-800 border-zinc-700 text-white mt-1 resize-none" rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white text-base">Social & Web</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-zinc-300 flex items-center gap-2"><Globe className="w-3 h-3" />Website</Label>
                    <Input value={form.website_url} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} placeholder="https://yourwebsite.com" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300 flex items-center gap-2"><TikTokIcon />TikTok</Label>
                    <Input value={form.tiktok_url} onChange={(e) => setForm((f) => ({ ...f, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@username" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300 flex items-center gap-2"><InstagramIcon />Instagram</Label>
                    <Input value={form.instagram_url} onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/username" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      Facebook
                    </Label>
                    <Input value={form.facebook_url} onChange={(e) => setForm((f) => ({ ...f, facebook_url: e.target.value }))} placeholder="https://facebook.com/username" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-pink-400" />
                  Default Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-300">First Name</Label>
                    <Input value={form.default_address?.first_name || ''} onChange={(e) => setForm((f) => ({ ...f, default_address: { ...f.default_address, first_name: e.target.value } }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Last Name</Label>
                    <Input value={form.default_address?.last_name || ''} onChange={(e) => setForm((f) => ({ ...f, default_address: { ...f.default_address, last_name: e.target.value } }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-zinc-300">Street Address</Label>
                  <Input value={form.default_address?.street || ''} onChange={(e) => setForm((f) => ({ ...f, default_address: { ...f.default_address, street: e.target.value } }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-300">City / Suburb</Label>
                    <Input value={form.default_address?.city || ''} onChange={(e) => setForm((f) => ({ ...f, default_address: { ...f.default_address, city: e.target.value } }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Postcode</Label>
                    <Input value={form.default_address?.postcode || ''} onChange={(e) => setForm((f) => ({ ...f, default_address: { ...f.default_address, postcode: e.target.value } }))} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-zinc-300">State</Label>
                  <Select value={form.default_address?.state || ''} onValueChange={(val) => setForm((f) => ({ ...f, default_address: { ...f.default_address, state: val } }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {AU_STATES.map((s) => <SelectItem key={s} value={s} className="text-white focus:bg-zinc-700">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ?
              <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">No orders yet</p>
                    <Link to={createPageUrl('Shop')}>
                      <Button className="mt-4 bg-pink-500 hover:bg-pink-600">Start Shopping</Button>
                    </Link>
                  </CardContent>
                </Card> :
              orders.map((order, i) =>
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-pink-400 font-mono font-semibold">{order.order_number}</p>
                          <p className="text-zinc-400 text-sm">{new Date(order.created_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <Badge className={statusColors[order.status] || 'bg-zinc-700 text-zinc-300'}>
                          {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {order.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {order.status === 'shipped' && <Truck className="w-3 h-3 mr-1" />}
                          {order.status === 'cancelled' && <Package className="w-3 h-3 mr-1" />}
                          {order.status}
                        </Badge>
                        <p className="text-white font-bold text-lg">${order.total?.toFixed(2)} AUD</p>
                      </div>
                      {order.line_items?.length > 0 &&
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex gap-2 flex-wrap">
                          {order.line_items.map((item, j) =>
                      <div key={j} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
                              {item.image_url && <img src={item.image_url} className="w-6 h-6 rounded object-cover" alt="" />}
                              <span className="text-zinc-300 text-xs">{item.product_title} {item.variant_name ? `(${item.variant_name})` : ''} ×{item.quantity}</span>
                            </div>
                      )}
                        </div>
                    }
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>);

}