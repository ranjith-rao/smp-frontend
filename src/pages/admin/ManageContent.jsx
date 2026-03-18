import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import '../../styles/AdminManageContent.css';

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const emptyFeature = { icon: '', title: '', description: '' };
const emptyStat = { value: '', label: '' };
const defaultAboutBullets = [
  '✨ Clean and intuitive user interface',
  '🔒 Privacy-first approach to social networking',
  '💬 Real-time messaging and notifications',
];

const ManageContent = () => {
  const { refresh } = useSiteSettings();
  const [formData, setFormData] = useState({
    heroBadge: '',
    heroTitle: '',
    heroSubtitle: '',
    heroImageUrl: '',
    statsJson: [],
    aboutTitle: '',
    aboutDescription: '',
    aboutBulletsJson: [],
    aboutImageUrl: '',
    featuresJson: [],
    ctaTitle: '',
    ctaDescription: '',
    ctaButtonText: '',
  });
  const [newBullet, setNewBullet] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminService.getLandingContent();
        setFormData({
          heroBadge: data.heroBadge || '',
          heroTitle: data.heroTitle || data.homeTitle || '',
          heroSubtitle: data.heroSubtitle || data.homeSubtitle || '',
          heroImageUrl: data.heroImageUrl || '',
          statsJson: Array.isArray(data.statsJson) ? data.statsJson : [],
          aboutTitle: data.aboutTitle || 'Build your community here',
          aboutDescription: data.aboutDescription || data.homeDescription || '',
          aboutBulletsJson: Array.isArray(data.aboutBulletsJson) && data.aboutBulletsJson.length > 0
            ? data.aboutBulletsJson
            : defaultAboutBullets,
          aboutImageUrl: data.aboutImageUrl || '',
          featuresJson: Array.isArray(data.featuresJson) ? data.featuresJson : [],
          ctaTitle: data.ctaTitle || '',
          ctaDescription: data.ctaDescription || '',
          ctaButtonText: data.ctaButtonText || 'Create your account',
        });
      } catch (err) {
        setError(err.message || 'Failed to load landing content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (field) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setFormData((prev) => ({ ...prev, [field]: dataUrl }));
  };

  const updateFeature = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      featuresJson: prev.featuresJson.map((feature, idx) => (idx === index ? { ...feature, [field]: value } : feature)),
    }));
  };

  const updateStat = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      statsJson: prev.statsJson.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateLandingContent(formData);
      await refresh();
      setSuccess('Landing page content updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manage-content-page">
      <h1 className="manage-content-title">Manage Landing Content</h1>
      <p className="manage-content-subtitle">Update each landing section independently: Hero, Stats, About, Features, and CTA.</p>

      {error && <p className="manage-content-banner error">{error}</p>}
      {success && <p className="manage-content-banner success">{success}</p>}
      {loading && <p className="manage-content-banner info">Loading...</p>}

      <form onSubmit={handleUpdate} className="manage-content-form">
        <section className="manage-section">
          <h3 className="manage-section-title">Hero Section</h3>
          <div className="manage-grid-2">
            <input name="heroBadge" value={formData.heroBadge} onChange={handleChange} placeholder="Hero badge text" />
            <input name="heroTitle" value={formData.heroTitle} onChange={handleChange} placeholder="Hero title" />
          </div>
          <textarea name="heroSubtitle" value={formData.heroSubtitle} onChange={handleChange} placeholder="Hero subtitle" rows={3} />
          <input name="heroImageUrl" value={formData.heroImageUrl} onChange={handleChange} placeholder="Hero image URL" />
          <input type="file" accept="image/*" onChange={handleImageUpload('heroImageUrl')} className="file-input" />
        </section>

        <section className="manage-section">
          <h3 className="manage-section-title">Stats Section</h3>
          {formData.statsJson.map((stat, index) => (
            <div key={`stat-${index}`} className="manage-row-3">
              <input value={stat.value || ''} onChange={(e) => updateStat(index, 'value', e.target.value)} placeholder="Value (e.g. 120k+)" />
              <input value={stat.label || ''} onChange={(e) => updateStat(index, 'label', e.target.value)} placeholder="Label (e.g. Active Members)" />
              <button type="button" onClick={() => setFormData((prev) => ({ ...prev, statsJson: prev.statsJson.filter((_, idx) => idx !== index) }))} className="btn-remove">×</button>
            </div>
          ))}
          <button type="button" onClick={() => setFormData((prev) => ({ ...prev, statsJson: [...prev.statsJson, emptyStat] }))} className="btn-add-outline">+ Add Stat</button>
        </section>

        <section className="manage-section">
          <h3 className="manage-section-title">About Section</h3>
          <input name="aboutTitle" value={formData.aboutTitle} onChange={handleChange} placeholder="About heading" />
          <textarea name="aboutDescription" value={formData.aboutDescription} onChange={handleChange} placeholder="About description" rows={4} />

          <div className="manage-inline-add">
            <input value={newBullet} onChange={(e) => setNewBullet(e.target.value)} placeholder="Add bullet point" />
            <button type="button" onClick={() => {
              if (!newBullet.trim()) return;
              setFormData((prev) => ({ ...prev, aboutBulletsJson: [...prev.aboutBulletsJson, newBullet.trim()] }));
              setNewBullet('');
            }} className="btn-add-square">+</button>
          </div>

          <div className="manage-list-grid">
            {formData.aboutBulletsJson.map((item, index) => (
              <div key={`bullet-${index}`} className="manage-list-row">
                <input value={item} onChange={(e) => setFormData((prev) => ({ ...prev, aboutBulletsJson: prev.aboutBulletsJson.map((v, idx) => (idx === index ? e.target.value : v)) }))} />
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, aboutBulletsJson: prev.aboutBulletsJson.filter((_, idx) => idx !== index) }))} className="btn-remove">×</button>
              </div>
            ))}
          </div>

          <input name="aboutImageUrl" value={formData.aboutImageUrl} onChange={handleChange} placeholder="About section image URL" />
          <input type="file" accept="image/*" onChange={handleImageUpload('aboutImageUrl')} className="file-input" />
        </section>

        <section className="manage-section">
          <h3 className="manage-section-title">Features Section</h3>
          {formData.featuresJson.map((feature, index) => (
            <div key={`feature-${index}`} className="feature-card-admin">
              <div className="manage-row-feature-head">
                <input value={feature.icon || ''} onChange={(e) => updateFeature(index, 'icon', e.target.value)} placeholder="Icon" />
                <input value={feature.title || ''} onChange={(e) => updateFeature(index, 'title', e.target.value)} placeholder="Feature title" />
                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, featuresJson: prev.featuresJson.filter((_, idx) => idx !== index) }))} className="btn-remove">×</button>
              </div>
              <textarea value={feature.description || ''} onChange={(e) => updateFeature(index, 'description', e.target.value)} placeholder="Feature description" rows={3} />
            </div>
          ))}
          <button type="button" onClick={() => setFormData((prev) => ({ ...prev, featuresJson: [...prev.featuresJson, emptyFeature] }))} className="btn-add-outline">+ Add Feature</button>
        </section>

        <section className="manage-section">
          <h3 className="manage-section-title">CTA Section</h3>
          <input name="ctaTitle" value={formData.ctaTitle} onChange={handleChange} placeholder="CTA title" />
          <textarea name="ctaDescription" value={formData.ctaDescription} onChange={handleChange} placeholder="CTA description" rows={3} />
          <input name="ctaButtonText" value={formData.ctaButtonText} onChange={handleChange} placeholder="CTA button text" />
        </section>

        <button type="submit" disabled={saving} className="btn-save-content">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ManageContent;