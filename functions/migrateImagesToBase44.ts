import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const isCuterie = (url) => url && typeof url === 'string' && url.includes('cuterie.me');

    const products = await base44.asServiceRole.entities.Product.list();
    const results = [];

    for (const product of products) {
      const productResult = { productId: product.id, title: product.title, migrated: [], failed: [] };
      const updates = {};

      // Migrate main image
      if (isCuterie(product.main_image_url)) {
        try {
          const file_url = await reuploadImage(product.main_image_url, base44);
          updates.main_image_url = file_url;
          productResult.migrated.push('main_image_url');
        } catch (err) {
          productResult.failed.push({ field: 'main_image_url', error: err.message });
        }
      }

      // Migrate thumbnail
      if (isCuterie(product.thumbnail_url)) {
        try {
          const file_url = await reuploadImage(product.thumbnail_url, base44);
          updates.thumbnail_url = file_url;
          productResult.migrated.push('thumbnail_url');
        } catch (err) {
          productResult.failed.push({ field: 'thumbnail_url', error: err.message });
        }
      }

      // Migrate gallery images
      if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
        const migratedGallery = [];
        for (const imgUrl of product.gallery_images) {
          if (isCuterie(imgUrl)) {
            try {
              const file_url = await reuploadImage(imgUrl, base44);
              migratedGallery.push(file_url);
              productResult.migrated.push('gallery_image');
            } catch (err) {
              migratedGallery.push(imgUrl); // keep original if failed
              productResult.failed.push({ field: 'gallery_images', url: imgUrl, error: err.message });
            }
          } else {
            migratedGallery.push(imgUrl);
          }
        }
        updates.gallery_images = migratedGallery;
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Product.update(product.id, updates);
      }

      results.push(productResult);
    }

    // Migrate variant images
    const variants = await base44.asServiceRole.entities.ProductVariant.list();
    const variantResults = [];

    for (const variant of variants) {
      if (isCuterie(variant.image_url)) {
        try {
          const file_url = await reuploadImage(variant.image_url, base44);
          await base44.asServiceRole.entities.ProductVariant.update(variant.id, { image_url: file_url });
          variantResults.push({ variantId: variant.id, name: variant.name, status: 'migrated' });
        } catch (err) {
          variantResults.push({ variantId: variant.id, name: variant.name, status: 'failed', error: err.message });
        }
      }
    }

    const migratedProducts = results.filter(r => r.migrated.length > 0).length;
    const failedProducts = results.filter(r => r.failed.length > 0).length;

    return Response.json({
      success: true,
      products: results,
      variants: variantResults,
      summary: {
        totalProducts: products.length,
        migratedProducts,
        failedProducts,
        totalVariants: variants.length,
        migratedVariants: variantResults.filter(v => v.status === 'migrated').length,
        failedVariants: variantResults.filter(v => v.status === 'failed').length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function reuploadImage(url, base44) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image from ${url}: ${res.status} ${res.statusText}`);

  const blob = await res.blob();
  const file = new File([blob], `migrated-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });

  const result = await base44.integrations.Core.UploadFile({ file });
  if (!result || !result.file_url) throw new Error('Upload returned no file_url');

  return result.file_url;
}