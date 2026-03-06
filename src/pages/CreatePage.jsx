import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '../components/Dialog';
import Toast from '../components/Toast';
import AppHeader from '../components/AppHeader';
import apiFetch from '../utils/apiFetch';
import { API_CONFIG } from '../config/api';

const PAGE_CATEGORIES = [
  'Technology',
  'Business',
  'Entertainment',
  'Sports',
  'Travel',
  'Food',
  'Health',
  'Education',
  'Fashion',
  'Gaming',
  'Music',
  'Art',
  'News',
  'Lifestyle',
  'Other'
];

const CreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Technology',
    bannerImageUrl: '',
    profileImageUrl: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Page name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Page name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Page name must not exceed 100 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must not exceed 1000 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImagePreview = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'banner') {
          setBannerPreview(reader.result);
          setFormData(prev => ({
            ...prev,
            bannerImageUrl: reader.result
          }));
        } else {
          setProfilePreview(reader.result);
          setFormData(prev => ({
            ...prev,
            profileImageUrl: reader.result
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted', formData);
    console.log('Validation result:', validateForm());
    if (validateForm()) {
      console.log('Validation passed, showing dialog');
      setShowConfirmDialog(true);
    } else {
      console.log('Validation failed', errors);
    }
  };

  const createPageConfirmed = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          bannerImageUrl: formData.bannerImageUrl,
          profileImageUrl: formData.profileImageUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Page created successfully:', data);
        setToast({
          type: 'success',
          message: 'Page created successfully! Redirecting...'
        });
        
        setTimeout(() => {
          navigate(`/pages/${data.page.id}`);
        }, 2500);
      } else {
        const error = await response.json();
        setToast({
          type: 'error',
          message: error.message || 'Failed to create page'
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Error creating page: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AppHeader />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '24px',
        color: '#64748b',
        fontSize: '13px'
      }}>
        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            cursor: 'pointer',
            fontSize: '13px',
            padding: 0,
            textDecoration: 'none'
          }}
          onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.target.style.textDecoration = 'none'}
        >
          Home
        </button>
        <span>/</span>
        <span style={{ color: '#1e293b', fontWeight: '600' }}>Create Page</span>
      </div>
      <h1 style={{ color: '#1e293b', marginBottom: '10px' }}>Create a New Page</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>
        Build your community and share content with your followers
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* Banner Image */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Banner Image (1200x400px recommended)
            </label>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '250px',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: bannerPreview ? 'transparent' : '#f8fafc',
              backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              {!bannerPreview && (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>Click to upload banner</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    JPG, PNG up to 5MB
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImagePreview(e, 'banner')}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Profile Image */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '12px'
            }}>
              Page Avatar
            </label>
            <div style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '2px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: profilePreview ? 'transparent' : '#f8fafc',
                backgroundImage: profilePreview ? `url(${profilePreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0,
                fontSize: '40px',
                color: '#94a3b8'
              }}>
                {profilePreview ? '' : '🏢'}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#0284c7',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#0369a1'}
                onMouseOut={(e) => e.target.style.background = '#0284c7'}
                >
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImagePreview(e, 'profile')}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
                  JPG, PNG. Recommended size 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Page Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Page Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Tech Innovations Daily"
              maxLength={100}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: errors.name ? '2px solid #ef4444' : '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px'
            }}>
              {errors.name && (
                <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.name}</span>
              )}
              <span style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginLeft: 'auto'
              }}>
                {formData.name.length}/100
              </span>
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              {PAGE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell your audience what this page is about. Be clear and engaging..."
              maxLength={1000}
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.description ? '2px solid #ef4444' : '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical',
                transition: 'border-color 0.3s ease'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px'
            }}>
              {errors.description && (
                <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.description}</span>
              )}
              <span style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginLeft: 'auto'
              }}>
                {formData.description.length}/1000
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                padding: '10px 24px',
                background: '#f1f5f9',
                color: '#1e293b',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
              onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: loading ? '#94a3b8' : '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'background 0.3s ease'
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = '#0369a1')}
              onMouseOut={(e) => !loading && (e.target.style.background = '#0284c7')}
            >
              {loading ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </div>
      </form>

      {showConfirmDialog && (
        <Dialog
          isOpen={showConfirmDialog}
          title="Create Page?"
          message={`Are you sure you want to create the page "${formData.name}"?`}
          onConfirm={createPageConfirmed}
          onCancel={() => setShowConfirmDialog(false)}
          confirmText="Create"
          confirmStyle={{ background: '#0284c7', color: 'white' }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      </div>
    </div>
  );
};

export default CreatePage;
