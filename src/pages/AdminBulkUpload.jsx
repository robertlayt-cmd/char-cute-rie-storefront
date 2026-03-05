import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { reuploadImageFromUrl } from '@/components/utils/imageUtils';

// Map of color names (lowercase) to hex codes
const COLOR_NAME_MAP = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  rose: '#FF007F',
  'rose gold': '#B76E79',
  pink: '#FF69B4',
  hotpink: '#FF69B4',
  'hot pink': '#FF69B4',
  red: '#FF0000',
  blue: '#0000FF',
  navy: '#001F5B',
  green: '#008000',
  mint: '#98FF98',
  teal: '#008080',
  purple: '#800080',
  lavender: '#E6E6FA',
  lilac: '#C8A2C8',
  yellow: '#FFFF00',
  orange: '#FFA500',
  peach: '#FFCBA4',
  white: '#FFFFFF',
  black: '#000000',
  grey: '#808080',
  gray: '#808080',
  brown: '#A52A2A',
  cream: '#FFFDD0',
  ivory: '#FFFFF0',
  coral: '#FF7F50',
  turquoise: '#40E0D0',
  'bubblegum': '#FFC1CC',
  'bubblegum pink': '#FFC1CC',
};

function colorNameToHex(name) {
  if (!name) return '#FF69B4';
  const lower = name.toLowerCase().trim();
  if (lower.startsWith('#')) return lower;
  return COLOR_NAME_MAP[lower] || '#FF69B4';
}

const SAMPLE_CSV = `title,slug,description,short_description,base_price,compare_price,default_stock,category_name,materials,badge,status,is_featured,is_tiktok_featured,rating,review_count,tags,main_image_url,variant_image_1,variant_name_1,variant_color_1,variant_stock_1,variant_image_2,variant_name_2,variant_color_2,variant_stock_2
Strawberry Stud Earrings,strawberry-studs,"Adorable hand-sculpted strawberry studs","Cute strawberry polymer clay studs",24.00,30.00,10,Earrings,"Polymer clay, stainless steel posts",new,published,false,true,5,10,"strawberry,fruit,cute",https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200,https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800,Rose,rose,5,https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800,Gold,gold,5
Croissant Hoop Earrings,croissant-hoops,"Buttery croissant charm hoops","French croissant on gold hoops",26.00,,8,Earrings,"Polymer clay, gold hoops",hot,published,true,false,5,8,"croissant,pastry",https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1200,,Gold,gold,8,,, 
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

  // Extract variants from a CSV row (supports variant_name_1, variant_color_1, variant_stock_1, etc.)
  const extractVariants = (row) => {
    const variants = [];
    let i = 1;
    while (row[`variant_name_${i}`]) {
      const name = row[`variant_name_${i}`].trim();
      if (name) {
        variants.push({
          name,
          color_hex: colorNameToHex(row[`variant_color_${i}`]),
          stock_quantity: parseInt(row[`variant_stock_${i}`]) || 0,
          price_adjustment: parseFloat(row[`variant_price_adj_${i}`]) || 0,
          is_default: i === 1,
          display_order: i - 1,
          sku: `${row.slug || row.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        });
      }
      i++;
    }
    return variants;
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

    const categoryLookup = [...categories];

    for (const row of preview) {
      let cat = categoryLookup.find(c => c.name.toLowerCase() === (row.category_name || '').toLowerCase());

      if (!cat && row.category_name) {
        const slug = row.category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        cat = await base44.entities.Category.create({
          name: row.category_name,
          slug,
          is_active: true,
          display_order: categoryLookup.length
        });
        categoryLookup.push(cat);
        queryClient.invalidateQueries(['admin-categories']);
      }

      // Re-upload main image to base44 storage, resize + generate thumbnail
      const { full_url: main_image_url, thumbnail_url } = row.main_image_url
        ? await reuploadImageFromUrl(row.main_image_url)
        : { full_url: '', thumbnail_url: '' };

      const productSlug = row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const variants = extractVariants(row);
      const defaultStock = parseInt(row.default_stock) || 0;

      const productData = {
        title: row.title,
        slug: productSlug,
        description: row.description || '',
        short_description: row.short_description || '',
        base_price: parseFloat(row.base_price) || 0,
        compare_price: parseFloat(row.compare_price) || undefined,
        default_stock: defaultStock,
        total_stock: variants.length > 0
          ? variants.reduce((s, v) => s + v.stock_quantity, 0)
          : defaultStock,
        category_id: cat?.id || '',
        materials: row.materials || '',
        badge: row.badge || '',
        status: row.status || 'draft',
        is_featured: row.is_featured === 'true',
        is_tiktok_featured: row.is_tiktok_featured === 'true',
        rating: parseFloat(row.rating) || 5,
        review_count: parseInt(row.review_count) || 0,
        tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
        main_image_url,
        thumbnail_url,
        gallery_images: [],
      };

      try {
        const product = await base44.entities.Product.create(productData);

        // Create variants if present
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          // Re-upload variant image if present
          const variantImageUrl = row[`variant_image_${i + 1}`]
            ? (await reuploadImageFromUrl(row[`variant_image_${i + 1}`])).full_url
            : '';
          await base44.entities.ProductVariant.create({
            ...v,
            product_id: product.id,
            image_url: variantImageUrl,
          });
        }

        newResults.push({ title: row.title, status: 'success', variants: variants.length });
      } catch (err) {
        newResults.push({ title: row.title, status: 'error', error: err.message });
      }

      setResults([...newResults]);
    }

    queryClient.invalidateQueries(['admin-products']);
    queryClient.invalidateQueries(['admin-variants']);
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
                <p className="text-zinc-400 text-sm mb-2">
                  Required: <code className="text-pink-400">title, base_price, status</code>. 
                  Stock: <code className="text-pink-400">default_stock</code>. 
                  Variants: <code className="text-pink-400">variant_name_1, variant_color_1, variant_stock_1</code> (add _2, _3 etc for more).
                  Colour values can be plain text (e.g. <code className="text-pink-400">gold</code>, <code className="text-pink-400">rose pink</code>) — they'll be auto-converted to hex on import.
                  Images from URLs will be automatically re-uploaded to your store's storage.
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
                      <th className="text-left p-3 text-zinc-400">Stock</th>
                      <th className="text-left p-3 text-zinc-400">Category</th>
                      <th className="text-left p-3 text-zinc-400">Status</th>
                      <th className="text-left p-3 text-zinc-400">Variants</th>
                      <th className="text-left p-3 text-zinc-400">Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => {
                      const variants = extractVariants(row);
                      return (
                        <tr key={i} className="border-b border-zinc-800/50">
                          <td className="p-3 text-white">{row.title}</td>
                          <td className="p-3 text-pink-400">${row.base_price}</td>
                          <td className="p-3 text-zinc-300">{row.default_stock || 0}</td>
                          <td className="p-3 text-zinc-300">{row.category_name || '-'}</td>
                          <td className="p-3">
                            <Badge className={row.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                              {row.status || 'draft'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {variants.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {variants.map((v, vi) => (
                                  <div key={vi} className="flex items-center gap-1 bg-zinc-800 rounded px-2 py-0.5">
                                    <span className="w-3 h-3 rounded-full inline-block border border-zinc-600" style={{ backgroundColor: v.color_hex }} />
                                    <span className="text-zinc-300 text-xs">{v.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : <span className="text-zinc-600">-</span>}
                          </td>
                          <td className="p-3">
                            {row.main_image_url ? (
                              <img src={row.main_image_url} alt="" className="w-10 h-10 object-cover rounded" onError={(e) => { e.target.style.display='none'; }} />
                            ) : <span className="text-zinc-600">-</span>}
                          </td>
                        </tr>
                      );
                    })}
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
                    {r.status === 'success' && r.variants > 0 && (
                      <span className="text-zinc-400 text-xs">{r.variants} variant{r.variants !== 1 ? 's' : ''}</span>
                    )}
                    {r.error && <span className="text-red-400 text-xs ml-auto">{r.error}</span>}
                  </div>
                ))}
                {!isDone && (
                  <div className="flex items-center gap-2 py-2 text-zinc-400 text-sm">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    Processing... (images are being uploaded to your store storage)
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