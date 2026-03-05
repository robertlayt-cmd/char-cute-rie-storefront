import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Copy, Check, X, Loader2, Trash2, Search } from 'lucide-react';

async function compressImage(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };
    img.src = url;
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function AdminImages() {
   const [images, setImages] = useState([]);
   const [uploading, setUploading] = useState(false);
   const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
   const [copiedId, setCopiedId] = useState(null);
   const [search, setSearch] = useState('');
   const [dragOver, setDragOver] = useState(false);
   const [imageFilter, setImageFilter] = useState('all');
   const fileInputRef = useRef();

   const filtered = images.filter(img => {
     const matchesSearch = img.name.toLowerCase().includes(search.toLowerCase());
     const isExternal = img.url.includes('cuterie.me');
     const matchesFilter = imageFilter === 'all' || 
       (imageFilter === 'external' && isExternal) ||
       (imageFilter === 'local' && !isExternal);
     return matchesSearch && matchesFilter;
   });

  const handleFiles = async (files) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!fileArr.length) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: fileArr.length });

    for (let i = 0; i < fileArr.length; i++) {
      const original = fileArr[i];
      const originalSize = original.size;

      let toUpload = original;
      if (original.size > 200 * 1024) {
        toUpload = await compressImage(original);
      }

      const { file_url } = await base44.integrations.Core.UploadFile({ file: toUpload });

      setImages(prev => [...prev, {
        id: Date.now() + i,
        name: original.name,
        url: file_url,
        originalSize,
        compressedSize: toUpload.size,
        saved: originalSize - toUpload.size,
      }]);
      setUploadProgress({ done: i + 1, total: fileArr.length });
    }

    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleCopy = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <AdminLayout currentPage="AdminImages">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Image Manager</h1>
          <p className="text-zinc-400 mt-1">Upload, compress and manage your product images</p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer mb-8 ${
            dragOver ? 'border-pink-500 bg-pink-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
          }`}
        >
          {uploading ? (
            <div>
              <Loader2 className="w-12 h-12 text-pink-400 mx-auto mb-4 animate-spin" />
              <p className="text-white font-medium">
                Uploading & compressing... {uploadProgress.done}/{uploadProgress.total}
              </p>
              <div className="w-48 h-2 bg-zinc-800 rounded-full mx-auto mt-3">
                <div
                  className="h-2 bg-pink-500 rounded-full transition-all"
                  style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-white font-medium text-lg mb-1">Drop images here or click to upload</p>
              <p className="text-zinc-500 text-sm">
                Images over 200KB are automatically compressed to reduce file size. Supports JPG, PNG, WebP.
              </p>
              <Button className="mt-4 bg-pink-500 hover:bg-pink-600" onClick={(e) => e.stopPropagation()}>
                <Upload className="w-4 h-4 mr-2" />
                Select Images
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Search + Filter + Stats */}
         {images.length > 0 && (
           <div className="flex flex-col gap-4 mb-6">
             <div className="flex items-center gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <Input
                   placeholder="Search images..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="pl-10 bg-zinc-900 border-zinc-700 text-white"
                 />
               </div>
               <div className="text-zinc-400 text-sm whitespace-nowrap">
                 {images.length} image{images.length !== 1 ? 's' : ''} •{' '}
                 <span className="text-green-400">
                   {formatBytes(images.reduce((sum, img) => sum + img.saved, 0))} saved
                 </span>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-sm text-zinc-400">Filter:</span>
               <select
                  value={imageFilter}
                  onChange={(e) => setImageFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="all" className="text-white bg-zinc-900">All Images</option>
                  <option value="local" className="text-white bg-zinc-900">Local (Migrated)</option>
                  <option value="external" className="text-white bg-zinc-900">External (cuterie.me)</option>
                </select>
             </div>
           </div>
         )}

        {/* Image Grid */}
        {filtered.length === 0 && images.length === 0 && !uploading && (
          <div className="text-center py-20">
            <Image className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No images uploaded yet. Upload some above!</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((img) => (
            <Card key={img.id} className="bg-zinc-900 border-zinc-800 overflow-hidden group">
              <div className="relative aspect-square">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopy(img.id, img.url)}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === img.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="w-9 h-9 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-white text-xs truncate mb-1" title={img.name}>{img.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-xs">{formatBytes(img.compressedSize)}</span>
                  {img.saved > 1024 && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs px-1 py-0">
                      -{formatBytes(img.saved)}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(img.id, img.url)}
                  className="mt-2 w-full text-xs text-zinc-400 hover:text-pink-400 transition-colors text-left truncate"
                  title={img.url}
                >
                  {copiedId === img.id ? '✓ Copied!' : 'Copy URL'}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}