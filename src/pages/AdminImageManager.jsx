import React, { useState, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader, Trash2, Eye, RefreshCw, Download, Search, Grid, List, Upload } from 'lucide-react';
import { uploadProductImage } from '@/components/utils/imageUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminImageManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [layoutView, setLayoutView] = useState('grid');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [imageFilter, setImageFilter] = useState('all');

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-images'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['admin-variants-images'],
    queryFn: () => base44.entities.ProductVariant.list(),
  });

  const deleteProductImage = useMutation({
    mutationFn: async ({ productId, field }) => {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      if (field === 'main') {
        await base44.entities.Product.update(productId, { main_image_url: '' });
      } else if (field === 'thumbnail') {
        await base44.entities.Product.update(productId, { thumbnail_url: '' });
      } else if (field === 'gallery') {
        await base44.entities.Product.update(productId, { gallery_images: [] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products-images']);
      setImageToDelete(null);
    },
  });

  const deleteVariantImage = useMutation({
    mutationFn: async (variantId) => {
      await base44.entities.ProductVariant.update(variantId, { image_url: '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-variants-images']);
      setImageToDelete(null);
    },
  });

  const rebuildImages = useMutation({
    mutationFn: async ({ productId, field }) => {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      if (field === 'main' && product.main_image_url) {
        const blob = await fetch(product.main_image_url).then(r => r.blob());
        const file = new File([blob], 'main.jpg', { type: 'image/jpeg' });
        const { full_url, thumbnail_url } = await uploadProductImage(file);
        await base44.entities.Product.update(productId, { 
          main_image_url: full_url, 
          thumbnail_url: thumbnail_url 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products-images']);
    },
  });

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationStatus({ status: 'running', message: 'Starting migration...' });
    try {
      const response = await base44.functions.invoke('migrateImagesToBase44', {});
      setMigrationStatus({
        status: 'success',
        message: 'Migration complete!',
        data: response.data,
      });
      queryClient.invalidateQueries(['admin-products-images']);
      queryClient.invalidateQueries(['admin-variants-images']);
    } catch (error) {
      setMigrationStatus({
        status: 'error',
        message: error.message,
      });
    }
    setIsMigrating(false);
  };

  // Collect all images with metadata
  const allImages = [
    ...products.flatMap(p => [
      p.main_image_url && { id: p.id, type: 'product', field: 'main', url: p.main_image_url, productTitle: p.title, productId: p.id, thumbnail: p.thumbnail_url },
      ...(p.gallery_images || []).map((url, idx) => ({ id: `${p.id}-gallery-${idx}`, type: 'product', field: 'gallery', url, productTitle: p.title, productId: p.id, index: idx })),
    ]).filter(Boolean),
    ...variants.map(v => ({
      id: v.id,
      type: 'variant',
      field: 'image',
      url: v.image_url,
      variantName: v.name,
      variantId: v.id,
    })).filter(v => v.url),
  ];

  const isExternal = (url) => url?.includes('cuterie.me') || url?.includes('unsplash.com');

  const filtered = useMemo(() => allImages.filter(img => {
    const matchesSearch = !search || img.productTitle?.toLowerCase().includes(search.toLowerCase()) || img.variantName?.toLowerCase().includes(search.toLowerCase());
    const external = isExternal(img.url);
    const matchesFilter = imageFilter === 'all' || (imageFilter === 'external' && external) || (imageFilter === 'local' && !external);
    return matchesSearch && matchesFilter;
  }), [allImages, search, imageFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedImages = filtered.slice(startIdx, startIdx + itemsPerPage);

  const externalCount = allImages.filter(img => isExternal(img.url)).length;

  return (
    <AdminLayout currentPage="AdminImageManager">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Image Manager</h1>
            <p className="text-zinc-400">{allImages.length} total images · {externalCount} external</p>
          </div>
          <Button
            onClick={handleMigrate}
            disabled={isMigrating || externalCount === 0}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            {isMigrating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Migrate All External Images
              </>
            )}
          </Button>
        </div>

        {/* Migration Status */}
        {migrationStatus && (
          <div className={`p-4 rounded-lg mb-6 border ${
            migrationStatus.status === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : migrationStatus.status === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            <p className="font-medium">{migrationStatus.message}</p>
            {migrationStatus.data && (
              <div className="text-sm mt-2">
                <p>Products processed: {migrationStatus.data.summary?.totalProducts || 0}</p>
                <p>Variants processed: {migrationStatus.data.summary?.totalVariants || 0}</p>
              </div>
            )}
          </div>
        )}

        {/* Search and Controls */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search by product or variant name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-zinc-900 border-zinc-800 text-white"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLayoutView(layoutView === 'grid' ? 'table' : 'grid')}
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
              title={`Switch to ${layoutView === 'grid' ? 'table' : 'grid'} view`}
            >
              {layoutView === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => setShowBulkUpload(!showBulkUpload)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>

          </div>
        </div>

        {/* Bulk Upload Section */}
        {showBulkUpload && (
          <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Bulk Image Upload</h2>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-blue-500/50 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <div className="text-zinc-400">
                  <p className="font-medium mb-2">Drop images here or click to upload</p>
                  <p className="text-sm">Supports JPG, PNG, WebP</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="bulk-upload-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Pagination and Items Per Page */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-zinc-400">Show per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(val) => {
              setItemsPerPage(parseInt(val));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20 bg-zinc-900 border-zinc-800 text-white">
                <SelectValue className="text-white" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="10" className="text-white">10</SelectItem>
                <SelectItem value="20" className="text-white">20</SelectItem>
                <SelectItem value="50" className="text-white">50</SelectItem>
                <SelectItem value="100" className="text-white">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-zinc-400">Filter:</span>
            <select
              value={imageFilter}
              onChange={(e) => { setImageFilter(e.target.value); setCurrentPage(1); }}
              className="bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-1.5 text-sm"
            >
              <option value="all">All Images</option>
              <option value="local">Local (Base44)</option>
              <option value="external">External (cuterie.me)</option>
            </select>
          </div>
          <div className="text-sm text-zinc-400">
            {filtered.length === 0 ? 'No images' : `${startIdx + 1}-${Math.min(startIdx + itemsPerPage, filtered.length)} of ${filtered.length}`}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className={layoutView === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
          {paginatedImages.map((img) => (
            <div
              key={img.id}
              className={layoutView === 'grid' ? 'group relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-pink-500/50 transition-all' : 'flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-pink-500/50 transition-all'}
            >
              {/* Image Preview */}
              <div className={layoutView === 'grid' ? 'aspect-square bg-zinc-800 overflow-hidden' : 'w-16 h-16 bg-zinc-800 overflow-hidden rounded flex-shrink-0'}>
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.target.className = 'w-full h-full flex items-center justify-center text-zinc-500 text-sm';
                    e.target.textContent = 'Failed to load';
                  }}
                />
              </div>

              {/* Thumbnail Icon */}
              {layoutView === 'grid' && img.thumbnail && (
                <div className="absolute bottom-2 right-2">
                  <div className="w-10 h-10 rounded-lg border-2 border-white/50 overflow-hidden bg-zinc-800 hover:border-white transition-colors cursor-pointer" title="Thumbnail exists">
                    <img src={img.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {layoutView === 'grid' && (
                <>
                  {/* External Badge */}
                  {isExternal(img.url) && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">External</Badge>
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className={`text-xs ${img.type === 'product' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {img.type === 'product' ? (img.field === 'main' ? 'Main' : 'Gallery') : 'Variant'}
                    </Badge>
                  </div>
                </>
              )}

              {layoutView === 'table' && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{img.productTitle || img.variantName}</p>
                  <p className="text-xs text-zinc-400">{img.type === 'product' ? (img.field === 'main' ? 'Main' : 'Gallery') : 'Variant'}</p>
                </div>
              )}

              {/* Actions */}
              <div className={layoutView === 'grid' ? 'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2' : 'flex items-center gap-2'}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                  onClick={() => setSelectedImage(img)}
                >
                  <Eye className="w-4 h-4" />
                </Button>

                {img.type === 'product' && img.field === 'main' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                    onClick={() => rebuildImages.mutate({ productId: img.productId, field: 'main' })}
                    disabled={rebuildImages.isPending}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  onClick={() => setImageToDelete(img)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {layoutView === 'grid' && (
                <div className="p-2 text-xs text-zinc-400 border-t border-zinc-800">
                  <p className="truncate font-medium text-zinc-300">{img.productTitle || img.variantName}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-400">No images found</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Previous
            </Button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className={currentPage === page ? 'bg-pink-600 hover:bg-pink-700' : 'border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {selectedImage.productTitle || selectedImage.variantName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img src={selectedImage.url} alt="" className="w-full rounded-lg" />
                <div className="text-sm text-zinc-400 space-y-1">
                  <p><strong>URL:</strong> {selectedImage.url}</p>
                  <p><strong>Type:</strong> {selectedImage.type}</p>
                  <p><strong>Field:</strong> {selectedImage.field}</p>
                  <p><strong>Hosted:</strong> {isExternal(selectedImage.url) ? 'External (cuterie.me)' : 'Base44 Storage'}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation */}
        {imageToDelete && (
          <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
              <AlertDialogTitle className="text-white">Delete Image?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Remove {imageToDelete.field} image from {imageToDelete.productTitle || imageToDelete.variantName}
              </AlertDialogDescription>
              <div className="flex gap-3 justify-end">
                <AlertDialogCancel className="border-zinc-700 text-white hover:bg-zinc-800">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (imageToDelete.type === 'product') {
                      deleteProductImage.mutate({
                        productId: imageToDelete.productId,
                        field: imageToDelete.field,
                      });
                    } else {
                      deleteVariantImage.mutate(imageToDelete.variantId);
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={deleteProductImage.isPending || deleteVariantImage.isPending}
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}


      </div>
    </AdminLayout>
  );
}