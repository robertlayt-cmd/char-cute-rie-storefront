import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if default theme exists
    const existingThemes = await base44.asServiceRole.entities.ThemeTemplate.list();
    if (existingThemes.length > 0) {
      return Response.json({ message: 'Themes already exist' }, { status: 200 });
    }

    // Create default theme
    const defaultTheme = await base44.asServiceRole.entities.ThemeTemplate.create({
      name: 'Default',
      slug: 'default',
      description: 'The default Char\'Cute\'rie theme',
      is_default: true,
      is_active: true,
      primary_color: '330 80% 60%',
      primary_foreground: '0 0% 98%',
      secondary_color: '0 0% 96.1%',
      background_color: '0 0% 100%',
      header_style: 'dark',
      card_style: 'minimal',
      border_radius: 'md',
      display_order: 0,
    });

    // Update settings to use this theme
    const settings = await base44.asServiceRole.entities.StoreSettings.list();
    if (settings.length > 0) {
      await base44.asServiceRole.entities.StoreSettings.update(settings[0].id, {
        active_theme_id: defaultTheme.id,
      });
    }

    return Response.json({ 
      success: true, 
      theme: defaultTheme,
      message: 'Default theme created successfully' 
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});