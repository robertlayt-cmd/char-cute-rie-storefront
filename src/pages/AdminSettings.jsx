import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Store, Truck, CreditCard, FileText, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
        tiktok_url: 'https://www.tiktok.com/@char.cute.rie',
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

  if (isLoading || !settings) {
    return (
      <div className="dark min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Admin')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
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
                  <Label>Store Name</Label>
                  <Input
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Tagline</Label>
                  <Input
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
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
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>TikTok URL</Label>
                  <Input
                    value={settings.tiktok_url}
                    onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Instagram URL</Label>
                  <Input
                    value={settings.instagram_url}
                    onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
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
                  <Label>Flat Rate Shipping (AUD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.shipping_flat_rate}
                    onChange={(e) => setSettings({ ...settings, shipping_flat_rate: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Free Shipping Threshold (AUD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <p className="text-zinc-500 text-sm mt-1">Orders over this amount get free shipping</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-pink-400" />
                  PayPal Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Currency</Label>
                  <Select value={settings.currency} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>PayPal Mode</Label>
                  <Select value={settings.paypal_mode} onValueChange={(v) => setSettings({ ...settings, paypal_mode: v })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                      <SelectItem value="live">Live (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>PayPal Client ID</Label>
                  <Input
                    value={settings.paypal_client_id}
                    onChange={(e) => setSettings({ ...settings, paypal_client_id: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 font-mono"
                    placeholder="Your PayPal Client ID"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies */}
          <TabsContent value="policies">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-400" />
                  Store Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>About Us</Label>
                  <Textarea
                    value={settings.about_text}
                    onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 min-h-[150px]"
                    placeholder="Tell your customers about your brand..."
                  />
                </div>

                <div>
                  <Label>Shipping Policy</Label>
                  <Textarea
                    value={settings.shipping_policy}
                    onChange={(e) => setSettings({ ...settings, shipping_policy: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 min-h-[150px]"
                    placeholder="Describe your shipping policies..."
                  />
                </div>

                <div>
                  <Label>Returns & Refunds Policy</Label>
                  <Textarea
                    value={settings.returns_policy}
                    onChange={(e) => setSettings({ ...settings, returns_policy: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 min-h-[150px]"
                    placeholder="Describe your return and refund policies..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}