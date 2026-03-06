import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

const ManageContent = () => {
  const [formData, setFormData] = useState({
    homeTitle: '',
    homeSubtitle: '',
    homeDescription: '',
    contactEmail: '',
    contactPhone: '',
  });
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
          homeTitle: data.homeTitle || '',
          homeSubtitle: data.homeSubtitle || '',
          homeDescription: data.homeDescription || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateLandingContent(formData);
      setSuccess('Landing page content updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Manage Menu Contents</h1>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>Edit the Home and Contact Us sections on the landing page.</p>

      {error && <p style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
      {success && <p style={{ color: '#22c55e', marginBottom: '15px' }}>{success}</p>}
      {loading && <p style={{ color: '#6366f1' }}>Loading...</p>}

      <form onSubmit={handleUpdate} style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Home Title</label>
            <input
              name="homeTitle"
              value={formData.homeTitle}
              onChange={handleChange}
              placeholder="Welcome to NEXUS"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Home Subtitle</label>
            <input
              name="homeSubtitle"
              value={formData.homeSubtitle}
              onChange={handleChange}
              placeholder="The social platform where connections matter"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Home Description</label>
          <textarea
            name="homeDescription"
            value={formData.homeDescription}
            onChange={handleChange}
            placeholder="Describe the purpose of NEXUS..."
            rows={4}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <h3 style={{ marginTop: '30px', color: '#1e293b' }}>Contact Us Section</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Contact Email</label>
            <input
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="support@nexus.com"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Contact Phone</label>
            <input
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: '24px',
            padding: '12px 18px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ManageContent;