import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Pencil, Trash2, Search, ArrowLeft, Image, 
  Package, Eye, EyeOff, Star, Palette, X, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BADGES = ['', 'new', 'hot', 'limited', 'tiktok', 'bestseller'];

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariants, setEditingVariants] = useState([]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['admin-variants'],
    queryFn: () => base44.entities.ProductVariant.list(),
  });

  const createProduct = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setIsDialogOpen(false);
      setEditingProduct(null);
    }
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setIsDialogOpen(false);
      setEditingProduct(null);
    }
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-products'])
  });

  const createVariant = useMutation({
    mutationFn: (data) => base44.entities.ProductVariant.create(data),
    onSuccess: () => queryClient.invalidateQueries(['admin-variants'])
  });

  const updateVariant = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductVariant.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['admin-variants'])
  });

  const deleteVariant = useMutation({
    mutationFn: (id) => base44.entities.ProductVariant.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-variants'])
  });

  const filtered = products.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    const productData = {
      ...editingProduct,
      slug: editingProduct.slug || editingProduct.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };

    let productId;
    if (editingProduct.id) {
      await updateProduct.mutateAsync({ id: editingProduct.id, data: productData });
      productId = editingProduct.id;
    } else {
      const result = await createProduct.mutateAsync(productData);
      productId = result.id;
    }

    // Handle variants
    for (const v of editingVariants) {
      if (v.id && v._deleted) {
        await deleteVariant.mutateAsync(v.id);
      } else if (v.id) {
        await updateVariant.mutateAsync({ id: v.id, data: { ...v, product_id: productId } });
      } else if (!v._deleted) {
        await createVariant.mutateAsync({ ...v, product_id: productId });
      }
    }

    queryClient.invalidateQueries(['admin-variants']);
  };

  const openEditDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setEditingVariants(variants.filter(v => v.product_id === product.id));
    } else {
      setEditingProduct({
        title: '',
        slug: '',
        description: '',
        short_description: '',
        base_price: 0,
        compare_price: 0,
        category_id: '',
        main_image_url: '',
        gallery_images: [],
        materials: 'Handcrafted polymer clay with stainless steel findings',
        care_instructions: 'Store in a cool, dry place. Avoid contact with water and perfumes.',
        tags: [],
        badge: '',
        is_featured: false,
        is_tiktok_featured: false,
        status: 'draft',
        rating: 5,
        review_count: 0
      });
      setEditingVariants([]);
    }
    setIsDialogOpen(true);
  };

  const addVariant = () => {
    setEditingVariants([...editingVariants, {
      name: '',
      sku: `SKU-${Date.now()}`,
      color_hex: '#FF69B4',
      image_url: '',
      price_adjustment: 0,
      stock_quantity: 10,
      is_default: editingVariants.length === 0,
      display_order: editingVariants.length
    }]);
  };

  const handleUploadImage = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (field === 'main') {
      setEditingProduct({ ...editingProduct, main_image_url: file_url });
    } else if (field === 'gallery') {
      setEditingProduct({ 
        ...editingProduct, 
        gallery_images: [...(editingProduct.gallery_images || []), file_url] 
      });
    }
  };

  const handleVariantImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...editingVariants];
    updated[index].image_url = file_url;
    setEditingVariants(updated);
  };

  return (
    <div className="dark min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Admin')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Products</h1>
              <p className="text-zinc-400">{products.length} products</p>
            </div>
          </div>
          <Button onClick={() => openEditDialog()} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((product) => {
              const productVariants = variants.filter(v => v.product_id === product.id);
              const totalStock = productVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                    <div className="relative aspect-square">
                      <img
                        src={product.main_image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400'}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {product.status === 'draft' && (
                          <Badge className="bg-yellow-500/20 text-yellow-400">Draft</Badge>
                        )}
                        {product.is_featured && (
                          <Badge className="bg-pink-500/20 text-pink-400">Featured</Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-white font-semibold mb-1 line-clamp-1">{product.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-pink-400 font-bold">${product.base_price?.toFixed(2)}</span>
                        <span className="text-zinc-400 text-sm">{totalStock} in stock</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-zinc-700"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-zinc-700 text-red-400 hover:text-red-300"
                          onClick={() => {
                            if (confirm('Delete this product?')) {
                              deleteProduct.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProduct?.id ? 'Edit Product' : 'New Product'}
              </DialogTitle>
            </DialogHeader>

            {editingProduct && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Title</Label>
                    <Input
                      value={editingProduct.title}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label>Base Price (AUD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.base_price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label>Compare Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.compare_price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, compare_price: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={editingProduct.category_id} 
                      onValueChange={(v) => setEditingProduct({ ...editingProduct, category_id: v })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select 
                      value={editingProduct.status} 
                      onValueChange={(v) => setEditingProduct({ ...editingProduct, status: v })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Badge</Label>
                    <Select 
                      value={editingProduct.badge || ''} 
                      onValueChange={(v) => setEditingProduct({ ...editingProduct, badge: v })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="No badge" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value={null}>None</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="limited">Limited</SelectItem>
                        <SelectItem value="tiktok">TikTok Fave</SelectItem>
                        <SelectItem value="bestseller">Bestseller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingProduct.is_featured}
                      onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_featured: v })}
                    />
                    <Label>Featured in Hero</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingProduct.is_tiktok_featured}
                      onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_tiktok_featured: v })}
                    />
                    <Label>TikTok Featured</Label>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <Label>Main Image</Label>
                  <div className="flex gap-4 mt-2">
                    {editingProduct.main_image_url && (
                      <img src={editingProduct.main_image_url} className="w-24 h-24 object-cover rounded-lg" />
                    )}
                    <label className="w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
                      <Upload className="w-6 h-6 text-zinc-400" />
                      <span className="text-xs text-zinc-400 mt-1">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'main')} />
                    </label>
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Colour Variants</Label>
                    <Button size="sm" variant="outline" onClick={addVariant} className="border-zinc-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Variant
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {editingVariants.filter(v => !v._deleted).map((variant, i) => (
                      <div key={i} className="flex gap-3 items-center p-3 bg-zinc-800 rounded-lg">
                        <input
                          type="color"
                          value={variant.color_hex}
                          onChange={(e) => {
                            const updated = [...editingVariants];
                            updated[i].color_hex = e.target.value;
                            setEditingVariants(updated);
                          }}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          placeholder="Variant name"
                          value={variant.name}
                          onChange={(e) => {
                            const updated = [...editingVariants];
                            updated[i].name = e.target.value;
                            setEditingVariants(updated);
                          }}
                          className="flex-1 bg-zinc-700 border-zinc-600"
                        />
                        <Input
                          type="number"
                          placeholder="Stock"
                          value={variant.stock_quantity}
                          onChange={(e) => {
                            const updated = [...editingVariants];
                            updated[i].stock_quantity = parseInt(e.target.value) || 0;
                            setEditingVariants(updated);
                          }}
                          className="w-20 bg-zinc-700 border-zinc-600"
                        />
                        <label className="w-10 h-10 border border-dashed border-zinc-600 rounded flex items-center justify-center cursor-pointer hover:border-pink-500">
                          {variant.image_url ? (
                            <img src={variant.image_url} className="w-full h-full object-cover rounded" />
                          ) : (
                            <Image className="w-4 h-4 text-zinc-400" />
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImageUpload(e, i)} />
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = [...editingVariants];
                            updated[i]._deleted = true;
                            setEditingVariants(updated);
                          }}
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    className="bg-pink-500 hover:bg-pink-600"
                    disabled={createProduct.isPending || updateProduct.isPending}
                  >
                    Save Product
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