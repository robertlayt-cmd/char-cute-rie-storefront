import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader, Download } from 'lucide-react';

export default function BulkCSVImport({ isOpen, onOpenChange }) {
  const [importStatus, setImportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const downloadSampleCSV = () => {
    const sampleData = [
      ['product_id', 'variant_id', 'sku', 'quantity'],
      ['prod_001', '', 'SKU001', '50'],
      ['prod_002', 'var_001', 'SKU002-PINK', '25'],
      ['prod_003', '', 'SKU003', '100'],
    ];
    
    const csv = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-sample.csv';
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
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx];
          return obj;
        }, {});
      });

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const row of rows) {
        try {
          const { product_id, variant_id, sku, quantity } = row;

          if (variant_id && sku) {
            await base44.entities.ProductVariant.update(variant_id, {
              stock_quantity: parseInt(quantity) || 0,
            });
          } else if (product_id) {
            await base44.entities.Product.update(product_id, {
              default_stock: parseInt(quantity) || 0,
            });
          }
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push(`Row ${rows.indexOf(row) + 2}: ${err.message}`);
        }
      }

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
          <DialogTitle className="text-white">Import Inventory from CSV</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Upload a CSV file to update product and variant stock quantities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">CSV Format</h3>
            <p className="text-sm text-zinc-300 mb-3">
              Your CSV should have these columns: <code className="bg-black/30 px-2 py-1 rounded text-blue-300">product_id, variant_id, sku, quantity</code>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>

          {/* File Input */}
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
              id="csv-input"
            />
            <label htmlFor="csv-input" className="cursor-pointer">
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
                    {importStatus.successCount} records updated
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