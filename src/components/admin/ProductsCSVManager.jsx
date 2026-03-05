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

  const downloadSampleCSV = () => {
    const sampleData = [
      ['id', 'title', 'base_price', 'compare_price', 'default_stock', 'status'],
      ['', 'Sample Product', '29.99', '49.99', '50', 'draft'],
      ['', 'Another Product', '39.99', '59.99', '100', 'published'],
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
    const headers = ['id', 'title', 'slug', 'base_price', 'compare_price', 'category_id', 'status', 'default_stock', 'is_featured', 'badge'];
    const rows = [headers];
    
    products.forEach(p => {
      rows.push([
        p.id,
        p.title,
        p.slug,
        p.base_price,
        p.compare_price || '',
        p.category_id || '',
        p.status,
        p.default_stock || 0,
        p.is_featured ? '1' : '0',
        p.badge || '',
      ]);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx];
          return obj;
        }, {});
      }).filter(row => row.title || row.id);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const row of rows) {
        try {
          const updateData = {
            title: row.title,
            base_price: parseFloat(row.base_price) || 0,
            compare_price: row.compare_price ? parseFloat(row.compare_price) : undefined,
            category_id: row.category_id || undefined,
            status: row.status || 'draft',
            default_stock: row.default_stock ? parseInt(row.default_stock) : 0,
            is_featured: row.is_featured === '1',
            badge: row.badge || '',
          };

          Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

          if (row.id) {
            await base44.entities.Product.update(row.id, updateData);
          } else if (row.title) {
            await base44.entities.Product.create({
              ...updateData,
              slug: (row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
            });
          }
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push(`Row ${rows.indexOf(row) + 2}: ${err.message}`);
        }
      }

      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-products-csv']);

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
            
            <div className="space-y-3 mb-3">
              <p className="text-sm text-zinc-300">
                CSV should have these columns: <code className="bg-black/30 px-2 py-1 rounded text-blue-300 text-xs">id, title, slug, base_price, compare_price, category_id, status, default_stock, is_featured, badge</code>
              </p>
              <p className="text-sm text-zinc-400">
                Leave <code className="bg-black/30 px-2 py-1 rounded text-xs">id</code> empty to create new products, or add it to update existing ones.
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