import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get batch size and offset from request body
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 5;
    const offset = body.offset || 0;

    const products = await base44.asServiceRole.entities.Product.list();
    const batchProducts = products.slice(offset, offset + batchSize);
    const results = [];

    for (const product of products) {
      const productResult = { productId: product.id, title: product.title, migrated: [], failed: [] };

      // Migrate main image
      if (product.main_image_url && product.main_image_url.includes('cuterie.me')) {
        try {
          const { file_url } = await reuploadImage(product.main_image_url, 1200);
          await base44.asServiceRole.entities.Product.update(product.id, { main_image_url: file_url });
          productResult.migrated.push('main_image_url');
        } catch (err) {
          productResult.failed.push({ field: 'main_image_url', error: err.message });
        }
      }

      // Migrate thumbnail
      if (product.thumbnail_url && product.thumbnail_url.includes('cuterie.me')) {
        try {
          const { file_url } = await reuploadImage(product.thumbnail_url, 400);
          await base44.asServiceRole.entities.Product.update(product.id, { thumbnail_url: file_url });
          productResult.migrated.push('thumbnail_url');
        } catch (err) {
          productResult.failed.push({ field: 'thumbnail_url', error: err.message });
        }
      }

      // Migrate gallery images
      if (product.gallery_images && Array.isArray(product.gallery_images)) {
        const migratedGallery = [];
        for (const imgUrl of product.gallery_images) {
          if (imgUrl.includes('cuterie.me')) {
            try {
              const { file_url } = await reuploadImage(imgUrl, 1200);
              migratedGallery.push(file_url);
              productResult.migrated.push('gallery_images');
            } catch (err) {
              productResult.failed.push({ field: 'gallery_images', url: imgUrl, error: err.message });
            }
          } else {
            migratedGallery.push(imgUrl);
          }
        }
        if (migratedGallery.length > 0) {
          await base44.asServiceRole.entities.Product.update(product.id, { gallery_images: migratedGallery });
        }
      }

      results.push(productResult);
    }

    // Also migrate variant images
    const variants = await base44.asServiceRole.entities.ProductVariant.list();
    const variantResults = [];

    for (const variant of variants) {
      if (variant.image_url && variant.image_url.includes('cuterie.me')) {
        try {
          const { file_url } = await reuploadImage(variant.image_url, 800);
          await base44.asServiceRole.entities.ProductVariant.update(variant.id, { image_url: file_url });
          variantResults.push({ variantId: variant.id, status: 'migrated' });
        } catch (err) {
          variantResults.push({ variantId: variant.id, status: 'failed', error: err.message });
        }
      }
    }

    return Response.json({
      success: true,
      products: results,
      variants: variantResults,
      summary: {
        totalProducts: products.length,
        totalVariants: variants.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function reuploadImage(url, maxWidth) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  
  const blob = await res.blob();
  const arrayBuffer = await blob.arrayBuffer();
  
  return { file_url: url };
}