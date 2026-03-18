import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import PublicHeader from '../components/PublicHeader';

const LegalPage = () => {
  const { settings } = useSiteSettings();
  const location = useLocation();
  const isPrivacy = location.pathname === '/privacy-policy';

  const pageTitle = isPrivacy ? 'Privacy Policy' : 'Terms and Conditions';
  const html = useMemo(() => {
    if (isPrivacy) {
      return settings?.privacyHtml || '<h2>Privacy Policy</h2><p>No privacy policy is configured yet.</p>';
    }
    return settings?.termsHtml || '<h2>Terms and Conditions</h2><p>No terms and conditions are configured yet.</p>';
  }, [isPrivacy, settings]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PublicHeader showNavLinks={false} />

      <div style={{ maxWidth: '900px', margin: '24px auto 0', background: '#fff', borderRadius: '14px', boxShadow: '0 1px 3px rgba(15,23,42,0.12)', padding: '24px' }}>
        <div style={{ marginBottom: '14px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{pageTitle}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '10px' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>{pageTitle}</h1>
        </div>
        <div style={{ color: '#1e293b', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default LegalPage;
