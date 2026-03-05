import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { uploadProductImage } from '@/components/utils/imageUtils';
import { motion } from 'framer-motion';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState({});

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list('display_order'),
  });

  const createCategory = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-categories']); setIsDialogOpen(false); }
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-categories']); setIsDialogOpen(false); }
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-categories'])
  });

  const rebuildCategories = useMutation({
    mutationFn: async () => {
      // Fetch fresh category list
      const allCats = await base44.entities.Category.list();
      
      const categoryStructure = {
        // Jewellery
        'earrings': 'jewellery',
        'brooches': 'jewellery',
        'necklaces': 'jewellery',
        'rings': 'jewellery',
        'bracelets': 'jewellery',
        // Accessories
        'diffusers': 'accessories',
        'vape-cover': 'accessories',
        'lighter-covers': 'accessories',
        'hair-accessories': 'accessories',
        'keychains-and-bag-charms': 'accessories',
        'perfume-atomiser': 'accessories',
        // Seasonal
        'christmas': 'seasonal',
        'easter': 'seasonal',
        'valentines-day': 'seasonal',
      };

      const updates = [];
      for (const cat of allCats) {
        const parentSlug = categoryStructure[cat.slug];
        if (parentSlug) {
          const parentCat = allCats.find(c => c.slug === parentSlug);
          if (parentCat && cat.parent_id !== parentCat.id) {
            updates.push(
              base44.entities.Category.update(cat.id, { parent_id: parentCat.id })
            );
          }
        }
      }
      await Promise.all(updates);
      return updates.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      alert(`✓ Rebuilt ${count} category relationships`);
    },
    onError: (err) => {
      alert(`Error rebuilding: ${err.message}`);
    }
  });

  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);

  const openEditDialog = (category = null, parentId = null) => {
    if (category) {
      setEditingCategory({ ...category });
    } else {
      setEditingCategory({
        name: '', slug: '', description: '', image_url: '',
        parent_id: parentId || '',
        display_order: categories.length,
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      ...editingCategory,
      parent_id: editingCategory.parent_id || null,
      slug: editingCategory.slug || editingCategory.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    if (editingCategory.id) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { full_url } = await uploadProductImage(file);
    setEditingCategory({ ...editingCategory, image_url: full_url });
  };

  const toggleActive = async (category) => {
    await updateCategory.mutateAsync({ id: category.id, data: { ...category, is_active: !category.is_active } });
  };

  const moveOrder = async (category, direction) => {
    const siblings = categories
      .filter(c => (c.parent_id || null) === (category.parent_id || null))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const idx = siblings.findIndex(c => c.id === category.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swap = siblings[swapIdx];
    await Promise.all([
      updateCategory.mutateAsync({ id: category.id, data: { display_order: swap.display_order ?? swapIdx } }),
      updateCategory.mutateAsync({ id: swap.id, data: { display_order: category.display_order ?? idx } }),
    ]);
  };

  const toggleExpand = (id) => setExpandedParents(p => ({ ...p, [id]: !p[id] }));

  const CategoryRow = ({ category, isChild = false, siblings, index }) => {
    const children = getChildren(category.id);
    const isExpanded = expandedParents[category.id] !== false; // default expanded

    return (
      <div>
        <Card className={`bg-zinc-900 border-zinc-800 ${isChild ? 'ml-8 border-l-2 border-l-pink-500/30' : ''}`}>
          <CardContent className="p-3 flex items-center gap-3">
            {/* Expand toggle */}
            {!isChild && children.length > 0 ? (
              <button onClick={() => toggleExpand(category.id)} className="text-zinc-400 hover:text-white">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-4" />
            )}

            {/* Image */}
            <img
              src={category.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80'}
              alt={category.name}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-semibold">{category.name}</h3>
                {isChild && <span className="text-xs bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">sub</span>}
                {!category.is_active && <span className="text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">Inactive</span>}
                {children.length > 0 && <span className="text-xs text-zinc-500">{children.length} sub</span>}
              </div>
              <p className="text-zinc-500 text-xs truncate">{category.slug}</p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-1">
              <Switch
                checked={!!category.is_active}
                onCheckedChange={() => toggleActive(category)}
                className="scale-75 data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-zinc-600"
              />
            </div>

            {/* Order arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveOrder(category, -1)}
                disabled={index === 0}
                className="text-zinc-500 hover:text-white disabled:opacity-20 text-xs leading-none"
              >▲</button>
              <button
                onClick={() => moveOrder(category, 1)}
                disabled={index === siblings.length - 1}
                className="text-zinc-500 hover:text-white disabled:opacity-20 text-xs leading-none"
              >▼</button>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              {!isChild && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-300 text-xs h-7 px-2"
                  onClick={() => openEditDialog(null, category.id)}
                  title="Add subcategory"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
              <Button variant="outline" size="sm" className="border-zinc-700 h-7 w-7 p-0" onClick={() => openEditDialog(category)}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-red-400 h-7 w-7 p-0"
                onClick={() => { if (confirm('Delete this category?')) deleteCategory.mutate(category.id); }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Children */}
        {!isChild && isExpanded && children.length > 0 && (
          <div className="mt-1 space-y-1">
            {children
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map((child, i) => (
                <CategoryRow key={child.id} category={child} isChild siblings={children} index={i} />
              ))}
          </div>
        )}
      </div>
    );
  };

  const sortedParents = parentCategories.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <AdminLayout currentPage="AdminCategories">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Categories</h1>
            <p className="text-zinc-400">{parentCategories.length} parent · {categories.length - parentCategories.length} sub</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => rebuildCategories.mutate()}
              disabled={rebuildCategories.isPending}
              className="bg-amber-600 hover:bg-amber-700"
              title="Auto-assign parent IDs to subcategories based on standard structure"
            >
              Rebuild Hierarchy
            </Button>
            <Button onClick={() => openEditDialog()} className="bg-pink-500 hover:bg-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {sortedParents.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <CategoryRow category={cat} siblings={sortedParents} index={i} />
            </motion.div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:bg-zinc-700 [&>button]:hover:bg-zinc-600 [&>button]:rounded-md [&>button]:border [&>button]:border-zinc-600">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCategory?.id ? 'Edit Category' : 'New Category'}
              </DialogTitle>
            </DialogHeader>

            {editingCategory && (
              <div className="space-y-4">
                {/* Parent category selector */}
                <div>
                  <Label className="text-zinc-200">Parent Category</Label>
                  <Select
                    value={editingCategory.parent_id || 'none'}
                    onValueChange={(v) => setEditingCategory({ ...editingCategory, parent_id: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="none" className="text-white">None (top-level)</SelectItem>
                      {parentCategories
                        .filter(c => c.id !== editingCategory.id)
                        .map(c => (
                          <SelectItem key={c.id} value={c.id} className="text-white">{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-200">Name</Label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Slug (URL)</Label>
                  <Input
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    placeholder="auto-generated from name"
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Description</Label>
                  <Textarea
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Image</Label>
                  <div className="flex gap-4 mt-2">
                    {editingCategory.image_url && (
                      <img src={editingCategory.image_url} className="w-24 h-24 object-cover rounded-lg" alt="" />
                    )}
                    <label className="w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
                      <Upload className="w-6 h-6 text-zinc-400" />
                      <span className="text-xs text-zinc-400 mt-1">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editingCategory.is_active}
                    onCheckedChange={(v) => setEditingCategory({ ...editingCategory, is_active: v })}
                  />
                  <Label className="text-zinc-200">Active</Label>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700">Cancel</Button>
                  <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600">Save</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}