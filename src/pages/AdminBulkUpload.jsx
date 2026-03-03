import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

const SAMPLE_CSV = `title,slug,description,short_description,base_price,compare_price,category_name,materials,badge,status,is_featured,is_tiktok_featured,rating,review_count,tags,main_image_url
Strawberry Stud Earrings,strawberry-studs,"Adorable hand-sculpted strawberry studs","Cute strawberry polymer clay studs",24.00,30.00,Earrings,"Polymer clay, stainless steel posts",new,published,false,true,5,10,"strawberry,fruit,cute",https://example.com/your-image-url.jpg
Croissant Hoop Earrings,croissant-hoops,"Buttery croissant charm hoops","French croissant on gold hoops",26.00,,Earrings,"Polymer clay, gold hoops",hot,published,true,false,5,8,"croissant,pastry,french",
`;

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'charcuterie_products_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBulkUpload() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [results, setResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
        else { current += char; }
      }
      values.push(current);
      return headers.reduce((obj, h, i) => {
        obj[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
        return obj;
      }, {});
    }).filter(row => row.title);
  };

  const handleFileChange = (f) => {
    if (!f) return;
    setFile(f);
    setResults([]);
    setIsDone(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      setPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.csv')) handleFileChange(dropped);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setResults([]);
    const newResults = [];

    for (const row of preview) {
      const cat = categories.find(c => c.name.toLowerCase() === (row.category_name || '').toLowerCase());
      const productData = {
        title: row.title,
        slug: row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: row.description || '',
        short_description: row.short_description || '',
        base_price: parseFloat(row.base_price) || 0,
        compare_price: parseFloat(row.compare_price) || undefined,
        category_id: cat?.id || '',
        materials: row.materials || '',
        badge: row.badge || '',
        status: row.status || 'draft',
        is_featured: row.is_featured === 'true',
        is_tiktok_featured: row.is_tiktok_featured === 'true',
        rating: parseFloat(row.rating) || 5,
        review_count: parseInt(row.review_count) || 0,
        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
        main_image_url: row.main_image_url || '',
        gallery_images: [],
      };

      const result = await base44.entities.Product.create(productData).then(
        () => ({ title: row.title, status: 'success' })
      ).catch(err => ({ title: row.title, status: 'error', error: err.message }));

      newResults.push(result);
      setResults([...newResults]);
    }

    queryClient.invalidateQueries(['admin-products']);
    setIsUploading(false);
    setIsDone(true);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <AdminLayout currentPage="AdminBulkUpload">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Bulk Upload Products</h1>
          <p className="text-zinc-400 mt-1">Import multiple products at once using a CSV file</p>
        </div>

        {/* Sample Download */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Download Sample CSV</h3>
                <p className="text-zinc-400 text-sm mb-3">
                Use this template to format your products correctly. Required columns: <code className="text-pink-400">title, base_price, status</code>. For images, use the full URL from the Image Manager (copy URL after uploading).
                </p>
                <Button variant="outline" className="border-zinc-700 text-white hover:text-white" onClick={downloadSampleCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Download sample.csv
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                dragOver ? 'border-pink-500 bg-pink-500/5' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              onClick={() => document.getElementById('csv-input').click()}
            >
              <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-1">
                {file ? file.name : 'Drop your CSV here or click to browse'}
              </p>
              <p className="text-zinc-500 text-sm">Supports .csv files only</p>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {preview.length > 0 && !isDone && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Preview ({preview.length} products)</CardTitle>
              <Button
                className="bg-pink-500 hover:bg-pink-600"
                onClick={handleUpload}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? `Uploading... (${results.length}/${preview.length})` : `Import ${preview.length} Products`}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left p-3 text-zinc-400">Title</th>
                      <th className="text-left p-3 text-zinc-400">Price</th>
                      <th className="text-left p-3 text-zinc-400">Category</th>
                      <th className="text-left p-3 text-zinc-400">Status</th>
                      <th className="text-left p-3 text-zinc-400">Badge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-zinc-800/50">
                        <td className="p-3 text-white">{row.title}</td>
                        <td className="p-3 text-pink-400">${row.base_price}</td>
                        <td className="p-3 text-zinc-300">{row.category_name || '-'}</td>
                        <td className="p-3">
                          <Badge className={row.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                            {row.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="p-3 text-zinc-300">{row.badge || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                Import Results
                {isDone && (
                  <>
                    <Badge className="bg-green-500/20 text-green-400">{successCount} imported</Badge>
                    {errorCount > 0 && <Badge className="bg-red-500/20 text-red-400">{errorCount} failed</Badge>}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                    {r.status === 'success'
                      ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    }
                    <span className="text-white text-sm">{r.title}</span>
                    {r.error && <span className="text-red-400 text-xs ml-auto">{r.error}</span>}
                  </div>
                ))}
                {!isDone && (
                  <div className="flex items-center gap-2 py-2 text-zinc-400 text-sm">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    Processing...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}