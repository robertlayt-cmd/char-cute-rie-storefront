import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Store, Truck, CreditCard, FileText, Upload, Loader2, Eye, EyeOff, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || null;
    }
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings(existingSettings);
    } else if (!isLoading) {
      setSettings({
        store_name: "Char'Cute'rie",
        logo_url: 'https://cuterie.me/skins/Cuterie2026/images/default/logo/default.png',
        tagline: 'Handcrafted polymer clay earrings & accessories',
        contact_email: '',
        tiktok_url: '',
        instagram_url: '',
        shipping_flat_rate: 9.95,
        free_shipping_threshold: 75,
        paypal_client_id: '',
        paypal_mode: 'sandbox',
        currency: 'AUD',
        about_text: '',
        shipping_policy: '',
        returns_policy: ''
      });
    }
  }, [existingSettings, isLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    
    if (settings.id) {
      await base44.entities.StoreSettings.update(settings.id, settings);
    } else {
      await base44.entities.StoreSettings.create(settings);
    }
    
    queryClient.invalidateQueries(['admin-settings']);
    toast.success('Settings saved!');
    setIsSaving(false);
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSettings({ ...settings, logo_url: file_url });
  };

  const downloadBackup = async () => {
    const data = {
      products: await base44.entities.Product.list(),
      categories: await base44.entities.Category.list(),
      variants: await base44.entities.ProductVariant.list(),
      discounts: await base44.entities.DiscountCode.list(),
      orders: await base44.entities.Order.list(),
      settings: settings
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const purgeData = async (type) => {
    try {
      if (type === 'images') {
        const products = await base44.entities.Product.list();
        for (const p of products) {
          await base44.entities.Product.update(p.id, { main_image_url: '', gallery_images: [] });
        }
        const variants = await base44.entities.ProductVariant.list();
        for (const v of variants) {
          await base44.entities.ProductVariant.update(v.id, { image_url: '' });
        }
        toast.success('All images cleared');
      } else if (type === 'products') {
        const products = await base44.entities.Product.list();
        for (const p of products) {
          await base44.entities.Product.delete(p.id);
        }
        toast.success('All products deleted');
      } else if (type === 'categories') {
        const categories = await base44.entities.Category.list();
        for (const c of categories) {
          await base44.entities.Category.delete(c.id);
        }
        toast.success('All categories deleted');
      } else if (type === 'orders') {
        const orders = await base44.entities.Order.list();
        for (const o of orders) {
          await base44.entities.Order.delete(o.id);
        }
        toast.success('All orders deleted');
      } else if (type === 'non-admin-users') {
        const users = await base44.entities.User.list();
        for (const u of users) {
          if (u.role !== 'admin') {
            await base44.entities.User.delete(u.id);
          }
        }
        toast.success('Non-admin users removed');
      } else if (type === 'reset') {
        const products = await base44.entities.Product.list();
        for (const p of products) {
          await base44.entities.Product.delete(p.id);
        }
        const categories = await base44.entities.Category.list();
        for (const c of categories) {
          await base44.entities.Category.delete(c.id);
        }
        const variants = await base44.entities.ProductVariant.list();
        for (const v of variants) {
          await base44.entities.ProductVariant.delete(v.id);
        }
        const discounts = await base44.entities.DiscountCode.list();
        for (const d of discounts) {
          await base44.entities.DiscountCode.delete(d.id);
        }
        const orders = await base44.entities.Order.list();
        for (const o of orders) {
          await base44.entities.Order.delete(o.id);
        }
        const defaultSettings = {
          store_name: "Char'Cute'rie",
          logo_url: '',
          tagline: '',
          contact_email: '',
          tiktok_url: '',
          instagram_url: '',
          facebook_url: '',
          youtube_url: '',
          pinterest_url: '',
          twitter_url: '',
          shipping_flat_rate: 9.95,
          free_shipping_enabled: true,
          free_shipping_threshold: 75,
          paypal_mode: 'sandbox',
          currency: 'AUD',
          about_text: '',
          shipping_policy: '',
          returns_policy: '',
          page_about_active: true,
          page_shipping_active: true,
          page_returns_active: true,
          page_contact_active: true
        };
        if (settings.id) {
          await base44.entities.StoreSettings.update(settings.id, defaultSettings);
        }
        setSettings(defaultSettings);
        toast.success('Store reset to white label defaults');
      }
      queryClient.invalidateQueries(['admin-settings']);
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
    setConfirmDialog(null);
  };

  if (isLoading || !settings) {
    return (
      <AdminLayout currentPage="AdminSettings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="AdminSettings">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Store Settings</h1>
          </div>
          <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-zinc-900">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="backup">Backup & Data</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-pink-400" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-200">Store Name</Label>
                  <Input
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Tagline</Label>
                  <Input
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>

                <div>
                  <Label>Logo</Label>
                  <div className="flex gap-4 mt-2">
                    {settings.logo_url && (
                      <img src={settings.logo_url} className="h-16 object-contain bg-zinc-800 rounded-lg p-2" />
                    )}
                    <label className="px-4 py-2 border-2 border-dashed border-zinc-700 rounded-lg flex items-center gap-2 cursor-pointer hover:border-pink-500 transition-colors">
                      <Upload className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-400 text-sm">Upload new logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="text-zinc-200">Contact Email</Label>
                  <Input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-zinc-400 text-sm font-medium mb-3">Social Media Links <span className="text-zinc-600">(leave blank to hide)</span></p>
                  <div className="space-y-3">
                    {[
                      { key: 'tiktok_url', label: 'TikTok URL' },
                      { key: 'instagram_url', label: 'Instagram URL' },
                      { key: 'facebook_url', label: 'Facebook URL' },
                      { key: 'youtube_url', label: 'YouTube URL' },
                      { key: 'pinterest_url', label: 'Pinterest URL' },
                      { key: 'twitter_url', label: 'X / Twitter URL' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <Label className="text-zinc-200">{label}</Label>
                        <Input
                          value={settings[key] || ''}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className="bg-zinc-800 border-zinc-600 text-white"
                          placeholder="https://..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping */}
          <TabsContent value="shipping">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-pink-400" />
                  Shipping Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-200">Flat Rate Shipping (AUD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.shipping_flat_rate}
                    onChange={(e) => setSettings({ ...settings, shipping_flat_rate: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>

                <div className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                  <div>
                    <p className="text-zinc-200 text-sm font-medium">Free Shipping</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Enable free shipping over a spend threshold</p>
                  </div>
                  <Switch
                    checked={settings.free_shipping_enabled !== false}
                    onCheckedChange={(v) => setSettings({ ...settings, free_shipping_enabled: v })}
                  />
                </div>

                {settings.free_shipping_enabled !== false && (
                  <div>
                    <Label className="text-zinc-200">Free Shipping Threshold (AUD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-800 border-zinc-600 text-white"
                    />
                    <p className="text-zinc-500 text-sm mt-1">Orders over this amount get free shipping</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <div className="space-y-4">
              {/* Setup Guide */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <CreditCard className="w-5 h-5 text-pink-400" />
                    How to set up PayPal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
                    <li>Go to <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">developer.paypal.com/dashboard</a> and log in.</li>
                    <li>Under <strong className="text-zinc-200">Apps &amp; Credentials</strong>, select <strong className="text-zinc-200">Sandbox</strong> or <strong className="text-zinc-200">Live</strong> tab to match the mode below.</li>
                    <li>Click your app (or create one) and copy the <strong className="text-zinc-200">Client ID</strong>.</li>
                    <li>The <strong className="text-zinc-200">Client Secret</strong> and <strong className="text-zinc-200">Client ID</strong> must be set as environment secrets in your Base44 dashboard (they are already set if PayPal was previously configured).</li>
                    <li>Set the mode to <strong className="text-zinc-200">Sandbox</strong> for testing, <strong className="text-zinc-200">Live</strong> when ready to accept real payments.</li>
                    <li>Save settings. The PayPal buttons will appear on checkout once the form is complete.</li>
                  </ol>
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-xs font-medium">⚠️ Sandbox test cards &amp; accounts</p>
                    <p className="text-zinc-400 text-xs mt-1">In sandbox mode, use a <a href="https://developer.paypal.com/tools/sandbox/accounts/" target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">PayPal sandbox buyer account</a> to test payments. Real cards will not work in sandbox.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-pink-400" />
                    PayPal Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-zinc-200">Environment / Mode</Label>
                    <Select value={settings.paypal_mode} onValueChange={(v) => setSettings({ ...settings, paypal_mode: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="live">Live (Production)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-zinc-500 text-xs mt-1">
                      {settings.paypal_mode === 'live'
                        ? '✅ Live mode — real payments will be charged.'
                        : '🧪 Sandbox mode — use test PayPal accounts only. No real money.'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-zinc-200">Currency</Label>
                    <Select value={settings.currency} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="NZD">NZD - New Zealand Dollar</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-zinc-200">PayPal Client ID</Label>
                    <Input
                      value={settings.paypal_client_id || ''}
                      onChange={(e) => setSettings({ ...settings, paypal_client_id: e.target.value })}
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 font-mono text-sm"
                      placeholder="AXxx... (from PayPal Developer Dashboard)"
                    />
                    <p className="text-zinc-500 text-xs mt-1">Your PayPal Client ID from the Developer Dashboard.</p>
                  </div>

                  <div>
                    <Label className="text-zinc-200">PayPal Client Secret</Label>
                    <div className="relative">
                      <Input
                        type={showSecret ? 'text' : 'password'}
                        value={settings.paypal_client_secret || ''}
                        onChange={(e) => setSettings({ ...settings, paypal_client_secret: e.target.value })}
                        className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500 font-mono text-sm pr-10"
                        placeholder="EXxx... (from PayPal Developer Dashboard)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">Your PayPal Client Secret. Stored securely and used server-side only.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Policies */}
          <TabsContent value="policies">
            <Card className="bg-zinc-900 border-zinc-800 mb-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-400" />
                  Page Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'page_about_active', label: 'About Us' },
                    { key: 'page_shipping_active', label: 'Shipping' },
                    { key: 'page_returns_active', label: 'Returns' },
                    { key: 'page_contact_active', label: 'Contact' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                      <span className="text-zinc-200 text-sm">{label}</span>
                      <Switch
                        checked={settings[key] !== false}
                        onCheckedChange={(v) => setSettings({ ...settings, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-400" />
                  Store Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-200">About Us</Label>
                  <Textarea
                    value={settings.about_text}
                    onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 min-h-[150px]"
                    placeholder="Tell your customers about your brand..."
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Shipping Policy</Label>
                  <Textarea
                    value={settings.shipping_policy}
                    onChange={(e) => setSettings({ ...settings, shipping_policy: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 min-h-[150px]"
                    placeholder="Describe your shipping policies..."
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Returns & Refunds Policy</Label>
                  <Textarea
                    value={settings.returns_policy}
                    onChange={(e) => setSettings({ ...settings, returns_policy: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 min-h-[150px]"
                    placeholder="Describe your return and refund policies..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup & Data */}
          <TabsContent value="backup">
           <div className="space-y-4">
             <Card className="bg-zinc-900 border-zinc-800">
               <CardHeader>
                 <CardTitle className="text-white flex items-center gap-2">
                   <Download className="w-5 h-5 text-pink-400" />
                   Backup
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-zinc-400 text-sm mb-4">Download a complete JSON backup of all store data including products, categories, orders, and settings.</p>
                 <Button onClick={downloadBackup} className="bg-green-600 hover:bg-green-700 text-white">
                   <Download className="w-4 h-4 mr-2" />
                   Download Backup
                 </Button>
               </CardContent>
             </Card>

             <Card className="bg-zinc-900 border-zinc-800 border-red-900/50">
               <CardHeader>
                 <CardTitle className="text-red-400 flex items-center gap-2">
                   <Trash2 className="w-5 h-5" />
                   Danger Zone
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <p className="text-zinc-400 text-sm">⚠️ These actions are permanent and cannot be undone.</p>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <Button 
                     variant="outline" 
                     onClick={() => setConfirmDialog({ type: 'images', title: 'Clear All Images', desc: 'Remove all product and variant images. Product data will remain.' })}
                     className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Clear Images
                   </Button>

                   <Button 
                     variant="outline" 
                     onClick={() => setConfirmDialog({ type: 'products', title: 'Delete All Products', desc: 'Permanently delete all products. Variants will also be removed.' })}
                     className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Delete Products
                   </Button>

                   <Button 
                     variant="outline" 
                     onClick={() => setConfirmDialog({ type: 'categories', title: 'Delete All Categories', desc: 'Permanently delete all product categories.' })}
                     className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Delete Categories
                   </Button>

                   <Button 
                     variant="outline" 
                     onClick={() => setConfirmDialog({ type: 'orders', title: 'Delete All Orders', desc: 'Permanently delete all order records.' })}
                     className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Delete Orders
                   </Button>

                   <Button 
                     variant="outline" 
                     onClick={() => setConfirmDialog({ type: 'non-admin-users', title: 'Remove Non-Admin Users', desc: 'Delete all user accounts except admin roles. Admin users will remain.' })}
                     className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Remove Non-Admin Users
                   </Button>

                   <Button 
                     variant="outline" 
                     onClick={() => setConfirmDialog({ type: 'reset', title: 'White Label Reset', desc: 'Delete ALL products, categories, variants, orders, and discounts. Reset store settings to defaults. The logged-in admin user will remain.' })}
                     className="border-red-700/50 text-red-500 hover:bg-red-700/10 font-semibold"
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     White Label Reset
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>
          </TabsContent>
          </Tabs>

          {/* Confirmation Dialog */}
          <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-red-400">{confirmDialog?.title}</AlertDialogTitle>
             <AlertDialogDescription className="text-zinc-400">
               {confirmDialog?.desc}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <div className="mt-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
             <p className="text-red-400 text-sm font-medium">This action cannot be undone.</p>
           </div>
           <div className="flex gap-3 justify-end">
             <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">Cancel</AlertDialogCancel>
             <AlertDialogAction 
               onClick={() => purgeData(confirmDialog?.type)}
               className="bg-red-600 hover:bg-red-700 text-white border-0"
             >
               Confirm Delete
             </AlertDialogAction>
           </div>
          </AlertDialogContent>
          </AlertDialog>
          </div>
          </AdminLayout>
          );
          }