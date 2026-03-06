import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';

const PageCarousel = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followingPages, setFollowingPages] = useState(new Set());
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const token = authService.getToken();
        
        // Fetch all pages, followed pages, and owned pages
        const [allRes, followedRes, ownedRes] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}/api/pages`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
          fetch(`${API_CONFIG.BASE_URL}/api/pages/user/followed-pages`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
          fetch(`${API_CONFIG.BASE_URL}/api/pages/user/owned-pages`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          })
        ]);

        if (!allRes.ok) throw new Error('Failed to load pages');
        
        const allData = await allRes.json();
        const allPages = Array.isArray(allData.pages) ? allData.pages : [];
        
        // Get followed page IDs
        let followedPageIds = [];
        if (followedRes.ok) {
          const followedData = await followedRes.json();
          followedPageIds = Array.isArray(followedData.pages) ? followedData.pages.map(p => p.id) : [];
        }

        // Get owned page IDs
        let ownedPageIds = [];
        if (ownedRes.ok) {
          const ownedData = await ownedRes.json();
          ownedPageIds = Array.isArray(ownedData.pages) ? ownedData.pages.map(p => p.id) : [];
        }

        // Filter out followed pages AND owned pages - show only unfollowed pages we don't own
        const excludedPageIds = new Set([...followedPageIds, ...ownedPageIds]);
        const unfollowedPages = allPages.filter(page => !excludedPageIds.has(page.id));
        setPages(unfollowedPages.slice(0, 3));
        setFollowingPages(new Set(followedPageIds));
        setError(null);
      } catch (err) {
        console.error('Error fetching pages:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const handleFollowPage = async (e, pageId) => {
    e.stopPropagation();
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      setFollowLoading(prev => ({ ...prev, [pageId]: true }));
      
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setFollowingPages(prev => new Set([...prev, pageId]));
      }
    } catch (err) {
      console.error('Error following page:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [pageId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="page-carousel-container">
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
          Loading pages...
        </div>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return null;
  }

  return (
    <div className="page-carousel-container">
      <div className="carousel-header">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
          🔍 Discover Pages
        </h3>
      </div>
      
      <div className="carousel-cards">
        {pages.map((page) => (
          <div 
            key={page.id} 
            className="carousel-card"
            style={{ cursor: 'default' }}
          >
            {/* Page Banner */}
            <div 
              className="carousel-banner"
              onClick={() => navigate(`/pages/${page.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {page.bannerImageUrl ? (
                <img src={page.bannerImageUrl} alt={page.name} />
              ) : (
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
              )}
            </div>

            {/* Page Avatar and Info */}
            <div className="carousel-content">
              <div className="carousel-avatar">
                {(page.profileImageUrl || page.avatarUrl) ? (
                  <img src={page.profileImageUrl || page.avatarUrl} alt={page.name} />
                ) : (
                  <div style={{ fontSize: '24px' }}>{page.name[0]}</div>
                )}
              </div>

              <div className="carousel-info">
                <h4 
                  style={{ margin: '8px 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}
                  onClick={() => navigate(`/pages/${page.id}`)}
                >
                  {page.name}
                </h4>
                <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>
                  {page._count?.followers || 0} followers
                </p>
              </div>

              {/* Follow Button */}
              <button
                onClick={(e) => handleFollowPage(e, page.id)}
                disabled={followLoading[page.id]}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#6366f1',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: followLoading[page.id] ? 'not-allowed' : 'pointer',
                  opacity: followLoading[page.id] ? 0.7 : 1,
                }}
              >
                {followLoading[page.id] ? 'Following...' : 'Follow'}
              </button>
            </div>
          </div>
        ))}

        {/* View More Card */}
        <div 
          className="carousel-card carousel-view-more"
          onClick={() => navigate('/pages/explore')}
          style={{ cursor: 'pointer' }}
        >
          <div className="view-more-content">
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>→</div>
            <p style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#6366f1' }}>
              Explore all pages
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .page-carousel-container {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .carousel-header {
          margin-bottom: 12px;
        }

        .carousel-cards {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-bottom: 4px;
        }

        .carousel-cards::-webkit-scrollbar {
          height: 4px;
        }

        .carousel-cards::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }

        .carousel-cards::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }

        .carousel-cards::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .carousel-card {
          flex: 0 0 160px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .carousel-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .carousel-banner {
          height: 80px;
          background: #f1f5f9;
          overflow: hidden;
          position: relative;
        }

        .carousel-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .carousel-content {
          padding: 12px;
          text-align: center;
          position: relative;
        }

        .carousel-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 3px solid white;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: -28px auto 8px;
          font-weight: 600;
          font-size: '16px';
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .carousel-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .carousel-info {
          min-height: 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .carousel-view-more {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }

        .view-more-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .carousel-cards {
            gap: 10px;
          }

          .carousel-card {
            flex: 0 0 140px;
          }

          .carousel-banner {
            height: 70px;
          }

          .carousel-avatar {
            width: 42px;
            height: 42px;
            margin-top: -24px;
          }
        }
      `}</style>
    </div>
  );
};

export default PageCarousel;
