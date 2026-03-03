import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, ArrowLeft, Upload, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list('display_order'),
  });

  const createCategory = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      setIsDialogOpen(false);
    }
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      setIsDialogOpen(false);
    }
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-categories'])
  });

  const openEditDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
    } else {
      setEditingCategory({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        display_order: categories.length,
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      ...editingCategory,
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
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditingCategory({ ...editingCategory, image_url: file_url });
  };

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
            <div>
              <h1 className="text-3xl font-bold text-white">Categories</h1>
              <p className="text-zinc-400">{categories.length} categories</p>
            </div>
          </div>
          <Button onClick={() => openEditDialog()} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {categories.map((category, i) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-zinc-600 cursor-grab" />
                  
                  <img
                    src={category.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100'}
                    alt={category.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{category.name}</h3>
                      {!category.is_active && (
                        <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm">{category.slug}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-zinc-700"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-zinc-700 text-red-400"
                      onClick={() => {
                        if (confirm('Delete this category?')) {
                          deleteCategory.mutate(category.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCategory?.id ? 'Edit Category' : 'New Category'}
              </DialogTitle>
            </DialogHeader>

            {editingCategory && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Slug (URL)</Label>
                  <Input
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    placeholder="auto-generated from name"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Image</Label>
                  <div className="flex gap-4 mt-2">
                    {editingCategory.image_url && (
                      <img src={editingCategory.image_url} className="w-24 h-24 object-cover rounded-lg" />
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
                    checked={editingCategory.is_active}
                    onCheckedChange={(v) => setEditingCategory({ ...editingCategory, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600">
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}