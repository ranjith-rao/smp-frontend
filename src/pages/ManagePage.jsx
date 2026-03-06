import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_CONFIG } from '../config/api';
import apiFetch from '../utils/apiFetch';
import Dialog from '../components/Dialog';
import Toast from '../components/Toast';
import AppHeader from '../components/AppHeader';

const ManagePage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const currentUserId = authService.getUserId();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    bannerImageUrl: '',
    profileImageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }
    fetchPageDetails();
  }, [pageId, currentUserId]);

  const fetchPageDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch page');
      }

      const data = await response.json();
      
      // Check if current user is owner
      if (data.owner.id !== currentUserId) {
        navigate(`/pages/${pageId}`);
        return;
      }

      setPage(data);
      setFormData({
        name: data.name,
        description: data.description,
        category: data.category,
        bannerImageUrl: data.bannerImageUrl || '',
        profileImageUrl: data.profileImageUrl || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const handleImageUpload = (field) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Image must be under 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

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

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update page');
      }

      const data = await response.json();
      setPage(data.page);
      setEditMode(false);
      setToast({
        type: 'success',
        message: 'Page updated successfully'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePage = async () => {
    setShowDeleteDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      setToast({
        type: 'success',
        message: 'Page deleted successfully'
      });

      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!adminInput.trim()) {
      setToast({
        type: 'error',
        message: 'Please enter a user ID'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: parseInt(adminInput),
          role: adminRole
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add admin');
      }

      setAdminInput('');
      fetchPageDetails();
      setToast({
        type: 'success',
        message: 'Admin added successfully'
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message
      });
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#64748b'
      }}>
        Loading...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#ef4444'
      }}>
        <p>{error || 'Page not found'}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <AppHeader />
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px 20px 60px'
      }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => navigate(`/pages/${pageId}`)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div>
          <h1 style={{ color: '#1e293b', margin: 0 }}>Manage Page</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{page.name}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowDeleteDialog(true)}
            style={{
              padding: '8px 14px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            Delete Page
          </button>
        </div>
      </div>

      {/* Page Details Section */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#1e293b', margin: 0 }}>Page Details</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{
                padding: '8px 16px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Edit
            </button>
          )}
        </div>

        {editMode ? (
          <div>
            {/* Profile Image */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '6px'
              }}>
                Profile Image
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {formData.profileImageUrl ? (
                  <img
                    src={formData.profileImageUrl}
                    alt="Profile preview"
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                    No image
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload('profileImageUrl')} />
                {formData.profileImageUrl && (
                  <button
                    onClick={() => handleRemoveImage('profileImageUrl')}
                    style={{
                      padding: '6px 12px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Banner Image */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '6px'
              }}>
                Banner Image
              </label>
              <div style={{ display: 'grid', gap: '10px' }}>
                {formData.bannerImageUrl ? (
                  <img
                    src={formData.bannerImageUrl}
                    alt="Banner preview"
                    style={{ width: '100%', maxHeight: '220px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '140px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                    No banner image
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload('bannerImageUrl')} />
                  {formData.bannerImageUrl && (
                    <button
                      onClick={() => handleRemoveImage('bannerImageUrl')}
                      style={{
                        padding: '6px 12px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '6px'
              }}>
                Page Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: errors.name ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.name && (
                <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.name}</span>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '6px'
              }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: errors.description ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              {errors.description && (
                <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.description}</span>
              )}
            </div>

            {/* Category */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '6px'
              }}>
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: page.name,
                    description: page.description,
                    category: page.category,
                    bannerImageUrl: page.bannerImageUrl || '',
                    profileImageUrl: page.profileImageUrl || ''
                  });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saveLoading}
                style={{
                  padding: '8px 16px',
                  background: saveLoading ? '#94a3b8' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#0f172a', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '700' }}>Profile Image</p>
              {page.profileImageUrl ? (
                <img
                  src={page.profileImageUrl}
                  alt="Page profile"
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                />
              ) : (
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Not set</p>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#0f172a', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '700' }}>Banner Image</p>
              {page.bannerImageUrl ? (
                <img
                  src={page.bannerImageUrl}
                  alt="Page banner"
                  style={{ width: '100%', maxHeight: '220px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                />
              ) : (
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Not set</p>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#0f172a', fontSize: '14px', margin: '0 0 4px 0', fontWeight: '700' }}>Name</p>
              <p style={{ color: '#475569', margin: 0, fontWeight: '500', fontSize: '14px' }}>{page.name}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#0f172a', fontSize: '14px', margin: '0 0 4px 0', fontWeight: '700' }}>Description</p>
              <p style={{ color: '#475569', margin: 0, fontSize: '14px' }}>{page.description}</p>
            </div>
            <div>
              <p style={{ color: '#0f172a', fontSize: '14px', margin: '0 0 4px 0', fontWeight: '700' }}>Category</p>
              <p style={{ color: '#475569', margin: 0, fontWeight: '500', fontSize: '14px' }}>{page.category}</p>
            </div>
          </div>
        )}
      </div>



      {showDeleteDialog && (
        <Dialog
          isOpen={showDeleteDialog}
          title="Delete Page?"
          message="This will permanently delete your page and all its posts. This action cannot be undone."
          onConfirm={handleDeletePage}
          onCancel={() => setShowDeleteDialog(false)}
          confirmText="Delete"
          variant="danger"
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

export default ManagePage;
