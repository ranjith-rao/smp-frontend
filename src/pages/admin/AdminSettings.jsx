import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import RichTextEditor from '../../components/RichTextEditor';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const AdminSettings = () => {
  const { refresh } = useSiteSettings();
  const [formData, setFormData] = useState({
    appName: '',
    appTagline: '',
    logoUrl: '',
    faviconUrl: '',
    contactEmail: '',
    contactPhone: '',
    termsHtml: '',
    privacyHtml: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminService.getLandingContent();
        setFormData((prev) => ({
          ...prev,
          appName: data.appName || '',
          appTagline: data.appTagline || '',
          logoUrl: data.logoUrl || '',
          faviconUrl: data.faviconUrl || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          termsHtml: data.termsHtml || '',
          privacyHtml: data.privacyHtml || '',
        }));
      } catch (err) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (field) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setFormData((prev) => ({ ...prev, [field]: dataUrl }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateLandingContent(formData);
      await refresh();
      setSuccess('Settings updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await adminService.changeAdminPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess('Password updated successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Unable to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ color: '#0f172a', marginTop: 0 }}>Settings</h1>
      <p style={{ color: '#64748b', marginBottom: '18px' }}>Configure white-label branding, contact details, legal pages, and admin security.</p>

      {loading && <div style={{ color: '#6366f1', marginBottom: '12px' }}>Loading settings...</div>}
      {error && <div style={{ color: '#dc2626', marginBottom: '12px' }}>{error}</div>}
      {success && <div style={{ color: '#16a34a', marginBottom: '12px' }}>{success}</div>}

      <form onSubmit={handleSaveSettings} style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)', display: 'grid', gap: '18px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Branding</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>App Name</label>
            <input name="appName" value={formData.appName} onChange={handleChange} placeholder="NEXUS" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Tagline</label>
            <input name="appTagline" value={formData.appTagline} onChange={handleChange} placeholder="The social platform where connections matter" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Logo URL / Upload</label>
            <input name="logoUrl" value={formData.logoUrl} onChange={handleChange} placeholder="https://..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '8px' }} />
            <input type="file" accept="image/*" onChange={handleFileUpload('logoUrl')} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Favicon URL / Upload</label>
            <input name="faviconUrl" value={formData.faviconUrl} onChange={handleChange} placeholder="https://..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '8px' }} />
            <input type="file" accept="image/*" onChange={handleFileUpload('faviconUrl')} />
          </div>
        </div>

        <h3 style={{ margin: 0, color: '#1e293b' }}>Contact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Contact Email</label>
            <input name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="support@yourapp.com" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Contact Phone</label>
            <input name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="+1 ..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          </div>
        </div>

        <h3 style={{ margin: 0, color: '#1e293b' }}>Terms and Conditions</h3>
        <RichTextEditor value={formData.termsHtml} onChange={(html) => setFormData((prev) => ({ ...prev, termsHtml: html }))} />

        <h3 style={{ margin: 0, color: '#1e293b' }}>Privacy Policy</h3>
        <RichTextEditor value={formData.privacyHtml} onChange={(html) => setFormData((prev) => ({ ...prev, privacyHtml: html }))} />

        <div>
          <button type="submit" disabled={saving || loading} style={{ border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <form onSubmit={handleChangePassword} style={{ marginTop: '18px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Change Admin Password</h3>
        {passwordError && <div style={{ color: '#dc2626', marginBottom: '10px' }}>{passwordError}</div>}
        {passwordSuccess && <div style={{ color: '#16a34a', marginBottom: '10px' }}>{passwordSuccess}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <input type="password" placeholder="Current password" value={passwordData.currentPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          <input type="password" placeholder="New password" value={passwordData.newPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          <input type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
        </div>
        <button type="submit" disabled={passwordSaving} style={{ marginTop: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 700, borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}>
          {passwordSaving ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
