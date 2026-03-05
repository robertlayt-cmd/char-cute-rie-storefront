import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminGuard from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminMenu() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [formData, setFormData] = useState({
    label: '',
    link_type: 'category',
    category_id: '',
    page_name: '',
    external_url: '',
    parent_id: '',
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-config'],
    queryFn: () => base44.entities.MenuConfig.list('display_order'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-menu-categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-config'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-config'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-config'] });
    },
  });

  const resetForm = () => {
    setFormData({ label: '', link_type: 'category', category_id: '', page_name: '', external_url: '', parent_id: '' });
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.link_type) return;

    const dataToSave = { 
      label: formData.label, 
      link_type: formData.link_type,
      display_order: editingItem ? editingItem.display_order : menuItems.length,
      is_active: editingItem?.is_active ?? true,
    };

    if (formData.link_type === 'category') dataToSave.category_id = formData.category_id;
    else if (formData.link_type === 'page') dataToSave.page_name = formData.page_name;
    else if (formData.link_type === 'external') dataToSave.external_url = formData.external_url;

    if (formData.parent_id) dataToSave.parent_id = formData.parent_id;

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      link_type: item.link_type,
      category_id: item.category_id || '',
      page_name: item.page_name || '',
      external_url: item.external_url || '',
      parent_id: item.parent_id || '',
    });
    setShowDialog(true);
  };

  const handleReorder = async (itemId, direction) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const newOrder = direction === 'up' ? item.display_order - 1 : item.display_order + 1;
    if (newOrder < 0) return;

    await updateMutation.mutateAsync({ id: itemId, data: { display_order: newOrder } });
  };

  const parentItems = menuItems.filter(item => !item.parent_id).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const getChildItems = (parentId) => menuItems.filter(item => item.parent_id === parentId).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const toggleExpanded = (id) => setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <AdminGuard>
      <AdminLayout currentPage="AdminMenu">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Menu Management</h1>
              <p className="text-zinc-400">Edit and organize your main navigation menu</p>
            </div>
            <Button className="bg-pink-500 hover:bg-pink-600" onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              {menuItems.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-zinc-400">No menu items yet. Add your first item to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {parentItems.map((item, index) => (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-zinc-600" />
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-zinc-400 text-sm capitalize">
                            {item.link_type === 'category' && `Category: ${categories.find(c => c.id === item.category_id)?.name || 'Unknown'}`}
                            {item.link_type === 'page' && `Page: ${item.page_name}`}
                            {item.link_type === 'external' && `Link: ${item.external_url}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit2 className="w-4 h-4 text-zinc-400" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-zinc-300 text-sm mb-1 block">Label</label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Shop, Categories"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 text-sm mb-1 block">Link Type</label>
                  <Select value={formData.link_type} onValueChange={(value) => setFormData({ ...formData, link_type: value })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="external">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.link_type === 'category' && (
                  <div>
                    <label className="text-zinc-300 text-sm mb-1 block">Select Category</label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.link_type === 'page' && (
                  <div>
                    <label className="text-zinc-300 text-sm mb-1 block">Page Name</label>
                    <Select value={formData.page_name} onValueChange={(value) => setFormData({ ...formData, page_name: value })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Choose a page" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="About">About</SelectItem>
                        <SelectItem value="Contact">Contact</SelectItem>
                        <SelectItem value="Shipping">Shipping</SelectItem>
                        <SelectItem value="Returns">Returns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.link_type === 'external' && (
                  <div>
                    <label className="text-zinc-300 text-sm mb-1 block">URL</label>
                    <Input
                      value={formData.external_url}
                      onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                      placeholder="https://example.com"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="border-zinc-700">Cancel</Button>
                <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600">
                  {editingItem ? 'Update' : 'Add'} Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}