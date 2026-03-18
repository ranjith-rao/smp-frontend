import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_CONFIG } from '../config/api';

const SiteSettingsContext = createContext({
  settings: {},
  loading: true,
  refresh: async () => {},
});

const ensureFavicon = (href) => {
  if (!href) return;
  const existing = document.querySelector('link[rel="icon"]');
  if (existing) {
    existing.setAttribute('href', href);
    return;
  }
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  document.head.appendChild(link);
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const cacheBust = Date.now();
      const res = await fetch(`${API_CONFIG.ENDPOINTS.CONTENT}/landing-page?_=${cacheBust}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data || {});
      }
    } catch (error) {
      // keep defaults from consuming components
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings?.appName) {
      document.title = settings.appName;
    }
    if (settings?.faviconUrl) {
      ensureFavicon(settings.faviconUrl);
    }
  }, [settings]);

  const value = useMemo(() => ({
    settings,
    loading,
    refresh: loadSettings,
  }), [settings, loading, loadSettings]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
