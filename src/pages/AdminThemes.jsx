import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Plus, Check, Copy } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminThemes() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_default: false,
    primary_color: '330 80% 60%',
    primary_foreground: '0 0% 98%',
    secondary_color: '0 0% 96.1%',
    background_color: '0 0% 100%',
    header_style: 'dark',
    card_style: 'minimal',
    border_radius: 'md',
    custom_css: '',
  });

  const queryClient = useQueryClient();

  const { data: themes = [] } = useQuery({
    queryKey: ['all-themes'],
    queryFn: async () => {
      const all = await base44.entities.ThemeTemplate.list();
      return all.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings-for-theme'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ThemeTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-themes'] });
      resetForm();
      setShowDialog(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ThemeTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-themes'] });
      resetForm();
      setShowDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ThemeTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-themes'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (themeId) => {
      const settingsId = settings.id || (settings && Object.keys(settings)[0]);
      return base44.entities.StoreSettings.update(settingsId, { active_theme_id: themeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-for-theme'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      is_default: false,
      primary_color: '330 80% 60%',
      primary_foreground: '0 0% 98%',
      secondary_color: '0 0% 96.1%',
      background_color: '0 0% 100%',
      header_style: 'dark',
      card_style: 'minimal',
      border_radius: 'md',
      custom_css: '',
    });
    setEditingTheme(null);
  };

  const handleEdit = (theme) => {
    setEditingTheme(theme);
    setFormData(theme);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) return;
    if (editingTheme) {
      updateMutation.mutate({ id: editingTheme.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleActivate = (themeId) => {
    activateMutation.mutate(themeId);
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Theme Templates</h1>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Theme
          </Button>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>{editingTheme ? 'Edit Theme' : 'Create Theme'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-zinc-300 text-sm mb-1 block">Theme Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Elegant Dark"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 text-sm mb-1 block">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., elegant-dark"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 text-sm mb-1 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the theme..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 text-sm mb-1 block">Primary Color (HSL)</label>
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="330 80% 60%"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 text-sm mb-1 block">Primary Foreground</label>
                  <Input
                    value={formData.primary_foreground}
                    onChange={(e) => setFormData({ ...formData, primary_foreground: e.target.value })}
                    placeholder="0 0% 98%"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 text-sm mb-1 block">Header Style</label>
                  <select
                    value={formData.header_style}
                    onChange={(e) => setFormData({ ...formData, header_style: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md p-2"
                  >
                    <option>dark</option>
                    <option>light</option>
                    <option>gradient</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 text-sm mb-1 block">Card Style</label>
                  <select
                    value={formData.card_style}
                    onChange={(e) => setFormData({ ...formData, card_style: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md p-2"
                  >
                    <option>minimal</option>
                    <option>elevated</option>
                    <option>bordered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 text-sm mb-1 block">Custom CSS</label>
                <Textarea
                  value={formData.custom_css}
                  onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                  placeholder="Add custom CSS rules here..."
                  className="bg-zinc-800 border-zinc-700 text-white h-32 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-zinc-300 text-sm">Set as default theme</label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="border-zinc-700">Cancel</Button>
              <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600">
                {editingTheme ? 'Update' : 'Create'} Theme
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => {
            const isActive = settings?.active_theme_id === theme.id;
            const isDefault = theme.is_default;

            return (
              <motion.div key={theme.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-all h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{theme.name}</CardTitle>
                        <p className="text-zinc-400 text-sm mt-1">{theme.slug}</p>
                      </div>
                      {isActive && <Badge className="bg-pink-500">Active</Badge>}
                      {isDefault && <Badge className="bg-blue-500">Default</Badge>}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {theme.description && (
                      <p className="text-zinc-400 text-sm">{theme.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-zinc-600"
                          style={{ backgroundColor: `hsl(${theme.primary_color})` }}
                        />
                        <span className="text-zinc-400">Primary: {theme.primary_color}</span>
                      </div>
                      <p className="text-zinc-400 text-xs">Header: {theme.header_style} | Cards: {theme.card_style}</p>
                    </div>
                  </CardContent>

                  <div className="border-t border-zinc-700 p-4 flex gap-2">
                    {!isActive && (
                      <Button
                        onClick={() => handleActivate(theme.id)}
                        variant="outline"
                        className="flex-1 border-zinc-700 text-white hover:bg-zinc-700"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      onClick={() => handleEdit(theme)}
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteMutation.mutate(theme.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}