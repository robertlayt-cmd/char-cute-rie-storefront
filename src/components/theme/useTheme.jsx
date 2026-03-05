import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useTheme() {
  const [theme, setTheme] = useState(null);

  const { data: settings } = useQuery({
    queryKey: ['settings-theme'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const all = await base44.entities.ThemeTemplate.filter({ is_active: true }, 'display_order', 100);
      return all.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
  });

  useEffect(() => {
    if (settings?.active_theme_id && themes.length > 0) {
      const activeTheme = themes.find(t => t.id === settings.active_theme_id);
      setTheme(activeTheme || themes[0]);
    } else if (themes.length > 0) {
      const defaultTheme = themes.find(t => t.is_default) || themes[0];
      setTheme(defaultTheme);
    }
  }, [settings, themes]);

  const applyTheme = (themeData) => {
    if (!themeData) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', themeData.primary_color);
    root.style.setProperty('--primary-foreground', themeData.primary_foreground);
    root.style.setProperty('--secondary', themeData.secondary_color);
    root.style.setProperty('--background', themeData.background_color);

    if (themeData.custom_css) {
      let styleEl = document.getElementById('theme-custom-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'theme-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = themeData.custom_css;
    }
  };

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  return { theme, themes, applyTheme };
}