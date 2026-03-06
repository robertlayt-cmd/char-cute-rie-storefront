import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const all = await base44.asServiceRole.entities.User.list();
        const members = all
            .filter(u => u.business_name && u.business_name.trim() !== '' && u.community_status === 'enabled')
            .map(u => ({
                id: u.id,
                business_name: u.business_name,
                description: u.description,
                profile_image_url: u.profile_image_url,
                banner_image_url: u.banner_image_url,
                website_url: u.website_url,
                tiktok_url: u.tiktok_url,
                instagram_url: u.instagram_url,
                facebook_url: u.facebook_url,
            }));
        return Response.json({ members });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});