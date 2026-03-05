import { base44 } from '@/api/base44Client';

/**
 * Resize an image File to a given max width (auto height), convert to JPEG.
 * Returns a new File.
 */
async function resizeImage(file, maxWidth) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const width = Math.min(img.width, maxWidth);
      const height = Math.round((img.height / img.width) * width);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (blob) => resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' })),
        'image/jpeg',
        0.9
      );
    };
    img.src = objectUrl;
  });
}

/**
 * Process and upload an image file.
 * Returns { full_url, thumbnail_url } — both hosted in base44 storage.
 */
export async function uploadProductImage(file) {
  const [fullFile, thumbFile] = await Promise.all([
    resizeImage(file, 1200),
    resizeImage(file, 400),
  ]);

  const [{ file_url: full_url }, { file_url: thumbnail_url }] = await Promise.all([
    base44.integrations.Core.UploadFile({ file: fullFile }),
    base44.integrations.Core.UploadFile({ file: thumbFile }),
  ]);

  return { full_url, thumbnail_url };
}

/**
 * Fetch an external image URL, then process + upload it.
 * Returns { full_url, thumbnail_url }.
 */
export async function reuploadImageFromUrl(url) {
  if (!url) return { full_url: '', thumbnail_url: '' };
  try {
    const res = await fetch(url);
    if (!res.ok) return { full_url: url, thumbnail_url: url };
    const blob = await res.blob();
    const ext = url.split('.').pop().split('?')[0] || 'jpg';
    const file = new File([blob], `image.${ext}`, { type: blob.type || 'image/jpeg' });
    return uploadProductImage(file);
  } catch {
    return { full_url: url, thumbnail_url: url };
  }
}