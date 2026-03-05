import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all categories
    const allCategories = await base44.entities.Category.list();

    // Define hierarchy: slug -> parent slug
    const hierarchy = {
      // Jewellery subcategories
      'earrings': 'jewellery',
      'brooches': 'jewellery',
      'necklaces': 'jewellery',
      'rings': 'jewellery',
      'bracelets': 'jewellery',
      // Accessories subcategories
      'diffusers': 'accessories',
      'vape-cover': 'accessories',
      'lighter-covers': 'accessories',
      'hair-accessories': 'accessories',
      'keychains-and-bag-charms': 'accessories',
      'perfume-atomiser': 'accessories',
      // Seasonal subcategories
      'christmas': 'seasonal',
      'easter': 'seasonal',
      'valentines-day': 'seasonal',
    };

    const updates = [];

    // Apply hierarchy
    for (const cat of allCategories) {
      const parentSlug = hierarchy[cat.slug];
      if (parentSlug) {
        const parent = allCategories.find(c => c.slug === parentSlug);
        if (parent && parent.id && cat.parent_id !== parent.id) {
          updates.push({
            catId: cat.id,
            parentId: parent.id
          });
        }
      } else if (cat.parent_id) {
        // Remove parent if it shouldn't have one
        updates.push({
          catId: cat.id,
          parentId: null
        });
      }
    }

    // Apply all updates
    for (const update of updates) {
      await base44.entities.Category.update(update.catId, { parent_id: update.parentId });
    }

    return Response.json({ 
      success: true, 
      message: `Updated ${updates.length} categories` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});