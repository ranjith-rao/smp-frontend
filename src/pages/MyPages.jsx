import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';
import Toast from '../components/Toast';
import AppHeader from '../components/AppHeader';
import PageCard from '../components/PageCard';
import { API_CONFIG } from '../config/api';

const MyPages = () => {
  const navigate = useNavigate();
  const [ownedPages, setOwnedPages] = useState([]);
  const [followedPages, setFollowedPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('owned'); // owned or followed

  useEffect(() => {
    fetchAllPages();
  }, []);

  const normalizePage = (page) => ({
    ...page,
    profileImageUrl: page?.profileImageUrl || page?.profileimageurl || page?.avatarUrl || ''
  });

  const hydrateMissingProfileImages = async (pages, token) => {
    const missing = pages.filter((p) => !p?.profileImageUrl);
    if (missing.length === 0) return pages;

    const resolved = await Promise.all(
      pages.map(async (page) => {
        if (page?.profileImageUrl) return page;
        try {
          const res = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${page.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) return page;
          const data = await res.json();
          return {
            ...page,
            profileImageUrl: data?.page?.profileImageUrl || data?.page?.profileimageurl || page?.profileImageUrl || ''
          };
        } catch {
          return page;
        }
      })
    );

    return resolved;
  };

  const fetchAllPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch both owned and followed pages in parallel
      const [ownedRes, followedRes] = await Promise.all([
        apiFetch(`${API_CONFIG.BASE_URL}/api/pages/user/owned-pages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch(`${API_CONFIG.BASE_URL}/api/pages/user/followed-pages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!ownedRes.ok || !followedRes.ok) {
        throw new Error('Failed to fetch pages');
      }

      const ownedData = await ownedRes.json();
      const followedData = await followedRes.json();

      const normalizedOwned = (ownedData.pages || []).map(normalizePage);
      const normalizedFollowed = (followedData.pages || []).map(normalizePage);
      const hydratedFollowed = await hydrateMissingProfileImages(normalizedFollowed, token);

      setOwnedPages(normalizedOwned);
      setFollowedPages(hydratedFollowed);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Get the current tab's pages
  const pages = activeTab === 'owned' ? ownedPages : followedPages;

  return (
    <div>
      <AppHeader />
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
      {/* Breadcrumbs */}
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
        <span style={{ color: '#1e293b', fontWeight: '600' }}>My Pages</span>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ color: '#1e293b', margin: 0 }}>My Pages</h1>
          <p style={{ color: '#64748b', margin: '8px 0 0 0' }}>
            Manage and explore all your pages
          </p>
        </div>
        <button
          onClick={() => navigate('/pages/create')}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#059669'}
          onMouseOut={(e) => e.target.style.background = '#10b981'}
        >
          + Create New Page
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '16px'
      }}>
        <button
          onClick={() => setActiveTab('owned')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'owned' ? '#0284c7' : 'transparent',
            color: activeTab === 'owned' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          My Pages ({ownedPages.length})
        </button>
        <button
          onClick={() => setActiveTab('followed')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'followed' ? '#0284c7' : 'transparent',
            color: activeTab === 'followed' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          Following ({followedPages.length})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
          color: '#64748b'
        }}>
          Loading pages...
        </div>
      )}

      {/* Pages Grid */}
      {!loading && (
        <div>
          {pages.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {pages.map(page => (
                <PageCard
                  key={page.id}
                  page={page}
                  mode="mypages"
                  onOpen={() => navigate(`/pages/${page.id}`)}
                  onManage={() => navigate(`/pages/${page.id}/manage`)}
                  showManage={activeTab === 'owned'}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {activeTab === 'owned' ? '📭' : '👀'}
              </div>
              <h2 style={{ color: '#1e293b', margin: '0 0 8px 0' }}>
                {activeTab === 'owned' ? 'No Pages Yet' : 'Not Following Any Pages'}
              </h2>
              <p style={{ color: '#64748b', margin: '0 0 24px 0' }}>
                {activeTab === 'owned'
                  ? 'Create your first page to get started!'
                  : 'Explore and follow pages to see them here.'}
              </p>
              <button
                onClick={() => {
                  if (activeTab === 'owned') {
                    navigate('/pages/create');
                  } else {
                    navigate('/pages');
                  }
                }}
                style={{
                  padding: '10px 24px',
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {activeTab === 'owned' ? 'Create Page' : 'Explore Pages'}
              </button>
            </div>
          )}
        </div>
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

export default MyPages;
