import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTable from '../../components/AdminTable';
import { authService } from '../../services/authService';
import { API_CONFIG } from '../../config/api';
import { getUserHandle } from '../../utils/userHelpers';
import apiFetch from '../../utils/apiFetch';
import '../../styles/AdminPages.css';

const AdminPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'USER', 'PAGE'

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch posts');
      setPosts(data.posts || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((post) => post.type === typeFilter);
    }

    // Filter by search
    const query = search.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((post) => {
        const authorName = `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.toLowerCase();
        const content = (post.content || '').toLowerCase();
        const id = String(post.id || '').toLowerCase();
        const pageName = (post.pageName || '').toLowerCase();
        return authorName.includes(query) || content.includes(query) || id.includes(query) || pageName.includes(query);
      });
    }

    return filtered;
  }, [posts, search, typeFilter]);

  const columns = useMemo(() => [
    {
      label: 'Posted by',
      key: 'author',
      render: (post) => `${post.author.firstName} ${post.author.lastName}`,
      sortValue: (post) => `${post.author.firstName} ${post.author.lastName}`,
    },
    {
      label: 'Username',
      key: 'username',
      render: (post) => (
        <span className="admin-user-handle">
          @{getUserHandle(post.author)}
        </span>
      ),
      sortValue: (post) => getUserHandle(post.author),
    },
    {
      label: 'Type',
      key: 'type',
      render: (post) => (
        <span className={`admin-badge ${post.type === 'PAGE' ? 'page' : 'user'}`}>
          {post.type === 'PAGE' ? `📄 Page (${post.pageName})` : '👤 User Post'}
        </span>
      ),
      sortValue: (post) => post.type,
    },
    {
      label: 'Likes',
      key: 'likes',
      render: (post) => (
        <span className="admin-badge stat likes">
          {post.likeCount || 0}
        </span>
      ),
      sortValue: (post) => post.likeCount || 0,
    },
    {
      label: 'Comments',
      key: 'comments',
      render: (post) => (
        <span className="admin-badge stat comments">
          {post.commentCount || 0}
        </span>
      ),
      sortValue: (post) => post.commentCount || 0,
    },
    {
      label: 'Posted at',
      key: 'createdAt',
      render: (post) => (
        <span className="admin-date-text">
          {formatDate(post.createdAt)}
        </span>
      ),
      sortValue: (post) => new Date(post.createdAt).getTime(),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (post) => (
        <button
          onClick={() => navigate(`/admin/posts/${post.id}`)}
          className="admin-action-btn primary"
        >
          View
        </button>
      ),
    },
  ], [formatDate, navigate]);

  return (
    <div className="admin-page">
      <div className="admin-page-header stacked">
        <h1 className="admin-page-title">Manage Posts</h1>
        <p className="admin-page-subtitle">View and manage all platform posts.</p>
      </div>
      
      {error && (
        <div className="admin-banner error">
          {error}
        </div>
      )}

      <div className="admin-toolbar">
        <input
          type="text"
          placeholder="Search by author, content, ID, or page..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="admin-select-input"
        >
          <option value="ALL">All Posts</option>
          <option value="USER">User Posts</option>
          <option value="PAGE">Page Posts</option>
        </select>
        <div className="admin-count-text">
          Showing {filteredPosts.length} of {posts.length}
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredPosts}
        loading={loading}
        emptyText="No posts found."
        onRefresh={fetchPosts}
      />

    </div>
  );
};

export default AdminPosts;
