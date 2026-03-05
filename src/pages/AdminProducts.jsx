import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, Pencil, Trash2, Search, Image, 
  X, Upload, ChevronDown, Filter
} from 'lucide-react';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [badgeFilter, setBadgeFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariants, setEditingVariants] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

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
    onSuccess: () => { queryClient.invalidateQueries(['admin-products']); setIsDialogOpen(false); setEditingProduct(null); }
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-products']); setIsDialogOpen(false); setEditingProduct(null); }
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-products'])
  });

  const createVariant = useMutation({ mutationFn: (data) => base44.entities.ProductVariant.create(data), onSuccess: () => queryClient.invalidateQueries(['admin-variants']) });
  const updateVariant = useMutation({ mutationFn: ({ id, data }) => base44.entities.ProductVariant.update(id, data), onSuccess: () => queryClient.invalidateQueries(['admin-variants']) });
  const deleteVariant = useMutation({ mutationFn: (id) => base44.entities.ProductVariant.delete(id), onSuccess: () => queryClient.invalidateQueries(['admin-variants']) });

  const filtered = products.filter(p => {
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
    if (badgeFilter !== 'all' && p.badge !== badgeFilter) return false;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);

    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${ids.length} products?`)) return;
      for (const id of ids) await deleteProduct.mutateAsync(id);
    } else if (bulkAction === 'publish') {
      for (const id of ids) await updateProduct.mutateAsync({ id, data: { status: 'published' } });
    } else if (bulkAction === 'draft') {
      for (const id of ids) await updateProduct.mutateAsync({ id, data: { status: 'draft' } });
    } else if (bulkAction === 'archive') {
      for (const id of ids) await updateProduct.mutateAsync({ id, data: { status: 'archived' } });
    }
    setSelected(new Set());
    setBulkAction('');
  };

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

    for (const v of editingVariants) {
      if (v.id && v._deleted) await deleteVariant.mutateAsync(v.id);
      else if (v.id) await updateVariant.mutateAsync({ id: v.id, data: { ...v, product_id: productId } });
      else if (!v._deleted) await createVariant.mutateAsync({ ...v, product_id: productId });
    }
    queryClient.invalidateQueries(['admin-variants']);
  };

  const openEditDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setEditingVariants(variants.filter(v => v.product_id === product.id));
    } else {
      setEditingProduct({ title: '', slug: '', description: '', short_description: '', base_price: 0, compare_price: 0, category_id: '', main_image_url: '', gallery_images: [], materials: 'Handcrafted polymer clay with stainless steel findings', care_instructions: 'Store in a cool, dry place. Avoid contact with water and perfumes.', tags: [], badge: '', is_featured: false, is_tiktok_featured: false, status: 'draft', rating: 5, review_count: 0 });
      setEditingVariants([]);
    }
    setIsDialogOpen(true);
  };

  const addVariant = () => {
    setEditingVariants([...editingVariants, { name: '', sku: `SKU-${Date.now()}`, color_hex: '#FF69B4', image_url: '', price_adjustment: 0, stock_quantity: 10, is_default: editingVariants.length === 0, display_order: editingVariants.length }]);
  };

  const handleUploadImage = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (field === 'main') setEditingProduct({ ...editingProduct, main_image_url: file_url });
    else if (field === 'gallery') setEditingProduct({ ...editingProduct, gallery_images: [...(editingProduct.gallery_images || []), file_url] });
  };

  const handleVariantImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...editingVariants];
    updated[index].image_url = file_url;
    setEditingVariants(updated);
  };

  const statusBadge = (status) => {
    if (status === 'published') return 'bg-green-500/20 text-green-400';
    if (status === 'archived') return 'bg-red-500/20 text-red-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  return (
    <AdminLayout currentPage="AdminProducts">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Products</h1>
            <p className="text-zinc-400">{products.length} products</p>
          </div>
          <Button onClick={() => openEditDialog()} className="bg-pink-500 hover:bg-pink-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value="published" className="text-white">Published</SelectItem>
              <SelectItem value="draft" className="text-white">Draft</SelectItem>
              <SelectItem value="archived" className="text-white">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-white">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-white">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={badgeFilter} onValueChange={setBadgeFilter}>
            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Badge" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all" className="text-white">All Badges</SelectItem>
              <SelectItem value={null} className="text-white">No Badge</SelectItem>
              <SelectItem value="new" className="text-white">New</SelectItem>
              <SelectItem value="hot" className="text-white">Hot</SelectItem>
              <SelectItem value="limited" className="text-white">Limited</SelectItem>
              <SelectItem value="tiktok" className="text-white">TikTok Fave</SelectItem>
              <SelectItem value="bestseller" className="text-white">Bestseller</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg">
            <span className="text-pink-400 text-sm font-medium">{selected.size} selected</span>
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white h-8">
                <SelectValue placeholder="Bulk action..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="publish">Set Published</SelectItem>
                <SelectItem value="draft">Set Draft</SelectItem>
                <SelectItem value="archive">Set Archived</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction} className="bg-pink-500 hover:bg-pink-600 text-white h-8">
              Apply
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-zinc-400 hover:text-white ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="p-4 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} className="border-zinc-600" />
                  </th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Product</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Price</th>
                  <th className="text-left p-4 text-zinc-400 font-medium hidden sm:table-cell">Stock</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Status</th>
                  <th className="text-right p-4 text-zinc-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Loading...</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-zinc-500">No products found</td></tr>
                )}
                {filtered.map((product) => {
                  const productVariants = variants.filter(v => v.product_id === product.id);
                  const totalStock = productVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
                  const cat = categories.find(c => c.id === product.category_id);
                  
                  return (
                    <tr key={product.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${selected.has(product.id) ? 'bg-pink-500/5' : ''}`}>
                      <td className="p-4">
                        <Checkbox checked={selected.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} className="border-zinc-600" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.main_image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80'}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                          />
                          <div>
                            <p className="text-white font-medium line-clamp-1">{product.title}</p>
                            {product.badge && <span className="text-xs text-pink-400">{product.badge}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400 hidden md:table-cell">{cat?.name || '-'}</td>
                      <td className="p-4 text-pink-400 font-semibold">${product.base_price?.toFixed(2)}</td>
                      <td className="p-4 text-zinc-400 hidden sm:table-cell">{totalStock}</td>
                      <td className="p-4">
                        <Select
                          value={product.status}
                          onValueChange={(v) => updateProduct.mutate({ id: product.id, data: { status: v } })}
                        >
                          <SelectTrigger className="w-[120px] h-8 bg-transparent border-zinc-700 text-xs">
                            <Badge className={`${statusBadge(product.status)} text-xs`}>{product.status}</Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => openEditDialog(product)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400" onClick={() => { if (confirm('Delete this product?')) deleteProduct.mutate(product.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{editingProduct?.id ? 'Edit Product' : 'New Product'}</DialogTitle>
            </DialogHeader>

            {editingProduct && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-zinc-200">Title</Label>
                    <Input value={editingProduct.title} onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400" />
                  </div>
                  <div>
                    <Label className="text-zinc-200">Base Price (AUD)</Label>
                    <Input type="number" step="0.01" value={editingProduct.base_price} onChange={(e) => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-600 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-200">Compare Price</Label>
                    <Input type="number" step="0.01" value={editingProduct.compare_price} onChange={(e) => setEditingProduct({ ...editingProduct, compare_price: parseFloat(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-600 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-200">Category</Label>
                    <Select value={editingProduct.category_id} onValueChange={(v) => setEditingProduct({ ...editingProduct, category_id: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-600">
                        {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-white focus:bg-zinc-700 focus:text-white">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-zinc-200">Status</Label>
                    <Select value={editingProduct.status} onValueChange={(v) => setEditingProduct({ ...editingProduct, status: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-600">
                        <SelectItem value="draft" className="text-white focus:bg-zinc-700 focus:text-white">Draft</SelectItem>
                        <SelectItem value="published" className="text-white focus:bg-zinc-700 focus:text-white">Published</SelectItem>
                        <SelectItem value="archived" className="text-white focus:bg-zinc-700 focus:text-white">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-zinc-200">Badge</Label>
                    <Select value={editingProduct.badge || ''} onValueChange={(v) => setEditingProduct({ ...editingProduct, badge: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white"><SelectValue placeholder="No badge" /></SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-600">
                        <SelectItem value={null} className="text-white focus:bg-zinc-700 focus:text-white">None</SelectItem>
                        <SelectItem value="new" className="text-white focus:bg-zinc-700 focus:text-white">New</SelectItem>
                        <SelectItem value="hot" className="text-white focus:bg-zinc-700 focus:text-white">Hot</SelectItem>
                        <SelectItem value="limited" className="text-white focus:bg-zinc-700 focus:text-white">Limited</SelectItem>
                        <SelectItem value="tiktok" className="text-white focus:bg-zinc-700 focus:text-white">TikTok Fave</SelectItem>
                        <SelectItem value="bestseller" className="text-white focus:bg-zinc-700 focus:text-white">Bestseller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-zinc-200">Description</Label>
                    <Textarea value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 min-h-[100px]" />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={editingProduct.is_featured} onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_featured: v })} className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-zinc-600" />
                    <Label className="text-zinc-200">Featured in Hero</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editingProduct.is_tiktok_featured} onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_tiktok_featured: v })} className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-zinc-600" />
                    <Label className="text-zinc-200">TikTok Featured</Label>
                  </div>
                </div>

                <div>
                  <Label className="text-zinc-200">Main Image</Label>
                  <div className="flex gap-4 mt-2">
                    {editingProduct.main_image_url && <img src={editingProduct.main_image_url} className="w-24 h-24 object-cover rounded-lg" />}
                    <label className="w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
                      <Upload className="w-6 h-6 text-zinc-400" />
                      <span className="text-xs text-zinc-400 mt-1">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImage(e, 'main')} />
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-zinc-200">Colour Variants</Label>
                    <Button size="sm" onClick={addVariant} className="bg-zinc-700 hover:bg-zinc-600 text-white border-0">
                      <Plus className="w-4 h-4 mr-1" />Add Variant
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {editingVariants.filter(v => !v._deleted).map((variant, i) => (
                      <div key={i} className="flex gap-3 items-center p-3 bg-zinc-800 rounded-lg">
                        <input type="color" value={variant.color_hex} onChange={(e) => { const u = [...editingVariants]; u[i].color_hex = e.target.value; setEditingVariants(u); }} className="w-10 h-10 rounded cursor-pointer" />
                        <Input placeholder="Variant name" value={variant.name} onChange={(e) => { const u = [...editingVariants]; u[i].name = e.target.value; setEditingVariants(u); }} className="flex-1 bg-zinc-700 border-zinc-500 text-white placeholder:text-zinc-400" />
                        <Input type="number" placeholder="Stock" value={variant.stock_quantity} onChange={(e) => { const u = [...editingVariants]; u[i].stock_quantity = parseInt(e.target.value) || 0; setEditingVariants(u); }} className="w-20 bg-zinc-700 border-zinc-500 text-white" />
                        <label className="w-10 h-10 border border-dashed border-zinc-600 rounded flex items-center justify-center cursor-pointer hover:border-pink-500">
                          {variant.image_url ? <img src={variant.image_url} className="w-full h-full object-cover rounded" /> : <Image className="w-4 h-4 text-zinc-400" />}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImageUpload(e, i)} />
                        </label>
                        <Button variant="ghost" size="icon" onClick={() => { const u = [...editingVariants]; u[i]._deleted = true; setEditingVariants(u); }}>
                          <X className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button onClick={() => setIsDialogOpen(false)} className="bg-zinc-700 hover:bg-zinc-600 text-white border-0">Cancel</Button>
                  <Button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600 text-white" disabled={createProduct.isPending || updateProduct.isPending}>
                    Save Product
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}