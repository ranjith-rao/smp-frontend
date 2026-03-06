import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import AppHeader from '../components/AppHeader';
import PageCard from '../components/PageCard';
import '../styles/ExplorePage.css';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [followedPageIds, setFollowedPageIds] = useState(new Set());
  const [ownedPageIds, setOwnedPageIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPages, setFilteredPages] = useState([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const token = authService.getToken();
        
        // Fetch all pages
        const allRes = await fetch(`${API_CONFIG.BASE_URL}/api/pages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!allRes.ok) throw new Error('Failed to load pages');
        
        const allData = await allRes.json();
        const allPages = Array.isArray(allData.pages) ? allData.pages : [];

        // Fetch followed and owned pages if user is logged in
        let followedPageIds = new Set();
        let ownedPageIds = new Set();
        if (token) {
          try {
            const [followedRes, ownedRes] = await Promise.all([
              fetch(`${API_CONFIG.BASE_URL}/api/pages/user/followed-pages`, {
                headers: { Authorization: `Bearer ${token}` }
              }),
              fetch(`${API_CONFIG.BASE_URL}/api/pages/user/owned-pages`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            ]);
            
            if (followedRes.ok) {
              const followedData = await followedRes.json();
              followedPageIds = new Set(
                Array.isArray(followedData.pages) ? followedData.pages.map(p => p.id) : []
              );
            }

            if (ownedRes.ok) {
              const ownedData = await ownedRes.json();
              ownedPageIds = new Set(
                Array.isArray(ownedData.pages) ? ownedData.pages.map(p => p.id) : []
              );
            }
          } catch (err) {
            console.error('Error fetching followed/owned pages:', err);
          }
        }

        setPages(allPages);
        setFilteredPages(allPages);
        setFollowedPageIds(followedPageIds);
        setOwnedPageIds(ownedPageIds);
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPages(pages);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pages.filter(page =>
      page.name.toLowerCase().includes(query) ||
      page.description.toLowerCase().includes(query) ||
      page.category.toLowerCase().includes(query)
    );
    setFilteredPages(filtered);
  }, [searchQuery, pages]);

  const handleFollowPage = async (pageId) => {
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      setFollowLoading(prev => ({ ...prev, [pageId]: true }));
      
      if (followedPageIds.has(pageId)) {
        // Unfollow
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}/follow`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          setFollowedPageIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(pageId);
            return newSet;
          });
        }
      } else {
        // Follow
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}/follow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          setFollowedPageIds(prev => new Set([...prev, pageId]));
        }
      }
    } catch (err) {
      console.error('Error following/unfollowing page:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [pageId]: false }));
    }
  };

  if (loading) {
    return (
      <div>
        <AppHeader />
        <div className="explore-page-container">
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
            <span style={{ color: '#1e293b', fontWeight: '600' }}>Explore Pages</span>
          </div>
          <div className="explore-header">
            <h1>Explore Pages</h1>
          </div>
          <div className="loading">Loading pages...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader />
      <div className="explore-page-container">
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
          <span style={{ color: '#1e293b', fontWeight: '600' }}>Explore Pages</span>
        </div>
        <div className="explore-header">
          <h1>Explore Pages</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search pages by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {filteredPages.length === 0 ? (
          <div className="empty-state">
            <p>No pages found</p>
          </div>
        ) : (
          <div className="pages-grid">
            {filteredPages.map((page) => {
              const isFollowing = followedPageIds.has(page.id);
              const isOwned = ownedPageIds.has(page.id);
              return (
                <PageCard
                  key={page.id}
                  page={page}
                  mode="explore"
                  onOpen={() => navigate(`/pages/${page.id}`)}
                  isFollowing={isFollowing}
                  isOwned={isOwned}
                  followLoading={followLoading[page.id]}
                  onFollowToggle={handleFollowPage}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
