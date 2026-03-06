import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader, Download, Upload } from 'lucide-react';
import { convertColorNameToHex } from '@/components/utils/colorConverter';

export default function ProductsCSVManager({ isOpen, onOpenChange }) {
  const queryClient = useQueryClient();
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-csv'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    enabled: isOpen,
  });

  const { data: variants = [] } = useQuery({
    queryKey: ['admin-variants-csv'],
    queryFn: () => base44.entities.ProductVariant.list('-created_date'),
    enabled: isOpen,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-csv'],
    queryFn: () => base44.entities.Category.list(),
    enabled: isOpen,
  });

  const downloadSampleCSV = () => {
    const sampleData = [
      ['product_id', 'product_type', 'title', 'slug', 'description', 'short_description', 'base_price', 'compare_price', 'category_name', 'main_image_url', 'thumbnail_url', 'gallery_images', 'materials', 'care_instructions', 'tags', 'badge', 'is_featured', 'is_tiktok_featured', 'status', 'default_stock', 'variant_id', 'variant_name', 'variant_color', 'variant_image_url', 'variant_price_adjustment', 'variant_stock', 'variant_sku'],
      ['', 'product', 'Sample Product', 'sample-product', 'Full product description here', 'Short description', '29.99', '49.99', 'My Category', 'https://example.com/main.jpg', 'https://example.com/thumb.jpg', 'https://example.com/gallery1.jpg', 'Cotton, Polyester', 'Hand wash cold', 'tag1,tag2', 'new', '1', '0', 'published', '50', '', '', '', '', '', '', ''],
      ['', 'product', 'Sample Product', 'sample-product', 'Full product description here', 'Short description', '29.99', '49.99', 'My Category', 'https://example.com/main.jpg', 'https://example.com/thumb.jpg', 'https://example.com/gallery1.jpg', 'Cotton, Polyester', 'Hand wash cold', 'tag1,tag2', 'new', '1', '0', 'published', '50', '', 'Bubblegum Pink', 'hot pink', 'https://example.com/variant.jpg', '5', '20', 'SKU-001'],
    ];
    
    const csv = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAllProducts = () => {
    const headers = ['product_id', 'product_type', 'title', 'slug', 'description', 'short_description', 'base_price', 'compare_price', 'category_name', 'main_image_url', 'thumbnail_url', 'gallery_images', 'materials', 'care_instructions', 'tags', 'badge', 'is_featured', 'is_tiktok_featured', 'status', 'default_stock', 'variant_id', 'variant_name', 'variant_color', 'variant_image_url', 'variant_price_adjustment', 'variant_stock', 'variant_sku'];
    const rows = [headers];
    
    products.forEach(p => {
      const productVariants = variants.filter(v => v.product_id === p.id);
      const catName = categories.find(c => c.id === p.category_id)?.name || '';
      
      if (productVariants.length === 0) {
        // Export product without variants
        rows.push([
          p.id,
          'product',
          p.title,
          p.slug,
          p.description || '',
          p.short_description || '',
          p.base_price,
          p.compare_price || '',
          catName,
          p.main_image_url || '',
          p.thumbnail_url || '',
          (p.gallery_images || []).join('|'),
          p.materials || '',
          p.care_instructions || '',
          (p.tags || []).join(','),
          p.badge || '',
          p.is_featured ? '1' : '0',
          p.is_tiktok_featured ? '1' : '0',
          p.status,
          p.default_stock || 0,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ]);
      } else {
        // Export product with each variant on a separate row
        productVariants.forEach((v, idx) => {
          rows.push([
            p.id,
            idx === 0 ? 'product' : 'variant',
            idx === 0 ? p.title : '',
            idx === 0 ? p.slug : '',
            idx === 0 ? (p.description || '') : '',
            idx === 0 ? (p.short_description || '') : '',
            idx === 0 ? p.base_price : '',
            idx === 0 ? (p.compare_price || '') : '',
            idx === 0 ? catName : '',
            idx === 0 ? (p.main_image_url || '') : '',
            idx === 0 ? (p.thumbnail_url || '') : '',
            idx === 0 ? (p.gallery_images || []).join('|') : '',
            idx === 0 ? (p.materials || '') : '',
            idx === 0 ? (p.care_instructions || '') : '',
            idx === 0 ? ((p.tags || []).join(',')) : '',
            idx === 0 ? (p.badge || '') : '',
            idx === 0 ? (p.is_featured ? '1' : '0') : '',
            idx === 0 ? (p.is_tiktok_featured ? '1' : '0') : '',
            idx === 0 ? p.status : '',
            idx === 0 ? (p.default_stock || 0) : '',
            v.id,
            v.name,
            v.color_hex || '',
            v.image_url || '',
            v.price_adjustment || '',
            v.stock_quantity || 0,
            v.sku || '',
          ]);
        });
      }
    });

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().replace(/"/g, ''));
      
      const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx] || '';
          return obj;
        }, {});
      }).filter(row => row.product_id || row.title);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      const processedProducts = new Set();

      for (const row of rows) {
        try {
          const productId = row.product_id;
          const isVariant = row.product_type === 'variant';

          if (!isVariant && row.title) {
            // Process product
            if (!processedProducts.has(productId)) {
              // Resolve category name to ID (case-insensitive), fallback to raw value if it's already an ID
              const rawCat = row.category_name || row.category_id || '';
              const matchedCat = categories.find(c => c.name.toLowerCase() === rawCat.toLowerCase());
              const resolvedCategoryId = matchedCat ? matchedCat.id : (rawCat || undefined);

              const productData = {
                title: row.title,
                slug: row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: row.description || undefined,
                short_description: row.short_description || undefined,
                base_price: parseFloat(row.base_price) || 0,
                compare_price: row.compare_price ? parseFloat(row.compare_price) : undefined,
                category_id: resolvedCategoryId,
                main_image_url: row.main_image_url || undefined,
                thumbnail_url: row.thumbnail_url || undefined,
                gallery_images: row.gallery_images ? row.gallery_images.split('|').map(s => s.trim()).filter(Boolean) : undefined,
                materials: row.materials || undefined,
                care_instructions: row.care_instructions || undefined,
                tags: row.tags ? row.tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                badge: row.badge || '',
                is_featured: row.is_featured === '1',
                is_tiktok_featured: row.is_tiktok_featured === '1',
                status: row.status || 'draft',
                default_stock: row.default_stock ? parseInt(row.default_stock) : 0,
              };

              Object.keys(productData).forEach(key => productData[key] === undefined && delete productData[key]);

              if (productId) {
                await base44.entities.Product.update(productId, productData);
              } else {
                await base44.entities.Product.create(productData);
              }
              processedProducts.add(productId);
            }
          }

          // Process variant if present
          if (isVariant || row.variant_name) {
            const colorHex = row.variant_color ? convertColorNameToHex(row.variant_color) : row.variant_color || '';
            
            const variantData = {
              product_id: productId,
              name: row.variant_name,
              sku: row.variant_sku,
              color_hex: colorHex || undefined,
              image_url: row.variant_image_url || undefined,
              price_adjustment: row.variant_price_adjustment ? parseFloat(row.variant_price_adjustment) : 0,
              stock_quantity: row.variant_stock ? parseInt(row.variant_stock) : 0,
            };

            Object.keys(variantData).forEach(key => variantData[key] === undefined && delete variantData[key]);

            if (row.variant_id) {
              await base44.entities.ProductVariant.update(row.variant_id, variantData);
            } else if (row.variant_name) {
              await base44.entities.ProductVariant.create(variantData);
            }
          }

          successCount++;
        } catch (err) {
          errorCount++;
          errors.push(`Row ${rows.indexOf(row) + 2}: ${err.message}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-csv'] });
      queryClient.invalidateQueries({ queryKey: ['admin-variants-csv'] });

      setImportStatus({
        success: true,
        successCount,
        errorCount,
        errors: errors.slice(0, 5),
      });
    } catch (error) {
      setImportStatus({
        success: false,
        error: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Import/Export Products</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manage your products via CSV import and export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Section */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Export Products</h3>
            <p className="text-sm text-zinc-300 mb-3">Download all products as CSV</p>
            <Button
              onClick={exportAllProducts}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All {products.length} Products
            </Button>
          </div>

          {/* Import Section */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Import Products</h3>
            
            <div className="space-y-3 mb-3 text-sm text-zinc-300">
              <p className="font-semibold text-white mb-2">CSV Columns Required:</p>
              <div className="bg-black/30 rounded p-3 space-y-2 text-xs">
                <div><strong>Product Fields:</strong> product_id, product_type, title, slug, description, short_description, base_price, compare_price, category_id, main_image_url, thumbnail_url, gallery_images (pipe-separated), materials, care_instructions, tags (comma-separated), badge, is_featured, is_tiktok_featured, status, default_stock</div>
                <div><strong>Variant Fields:</strong> variant_id, variant_name, variant_color (text name or hex, e.g., "gold" or "#FFD700"), variant_image_url, variant_price_adjustment, variant_stock, variant_sku</div>
              </div>
              <p className="text-zinc-400 mt-3">
                • Leave <code className="bg-black/30 px-2 py-1 rounded">product_id</code> empty to create new products
              </p>
              <p className="text-zinc-400">
                • For variants, set <code className="bg-black/30 px-2 py-1 rounded">product_type</code> to "variant" and include variant fields
              </p>
              <p className="text-zinc-400">
                • Color names (case-insensitive) are auto-converted to hex: gold, blue, pink, etc.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 mb-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample CSV
            </Button>

            {/* File Input */}
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
                id="products-csv-input"
              />
              <label htmlFor="products-csv-input" className="cursor-pointer">
                <div className="space-y-2">
                  {isImporting ? (
                    <>
                      <Loader className="w-8 h-8 mx-auto text-zinc-400 animate-spin" />
                      <p className="text-zinc-400">Importing...</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-medium">Choose CSV file</p>
                      <p className="text-sm text-zinc-400">Click to select or drag and drop</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Status Messages */}
          {importStatus && (
            <div className={`rounded-lg p-4 border ${
              importStatus.success
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {importStatus.success ? (
                <>
                  <p className="font-semibold">Import Successful!</p>
                  <p className="text-sm mt-1">
                    {importStatus.successCount} records processed
                    {importStatus.errorCount > 0 && `, ${importStatus.errorCount} errors`}
                  </p>
                  {importStatus.errors?.length > 0 && (
                    <div className="text-xs mt-2 space-y-1">
                      {importStatus.errors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold">Import Failed</p>
                  <p className="text-sm mt-1">{importStatus.error}</p>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}