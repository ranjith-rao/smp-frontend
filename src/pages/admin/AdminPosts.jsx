import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTable from '../../components/AdminTable';
import { authService } from '../../services/authService';
import { API_CONFIG } from '../../config/api';
import { getUserHandle } from '../../utils/userHelpers';
import apiFetch from '../../utils/apiFetch';

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
        <span style={{ color: '#64748b', fontSize: '13px' }}>
          @{getUserHandle(post.author)}
        </span>
      ),
      sortValue: (post) => getUserHandle(post.author),
    },
    {
      label: 'Type',
      key: 'type',
      render: (post) => (
        <span style={{
          background: post.type === 'PAGE' ? '#dbeafe' : '#f0fdf4',
          color: post.type === 'PAGE' ? '#0284c7' : '#059669',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {post.type === 'PAGE' ? `📄 Page (${post.pageName})` : '👤 User Post'}
        </span>
      ),
      sortValue: (post) => post.type,
    },
    {
      label: 'Likes',
      key: 'likes',
      render: (post) => (
        <span style={{ background: '#e0e7ff', color: '#6366f1', padding: '2px 8px', borderRadius: '4px' }}>
          {post.likeCount || 0}
        </span>
      ),
      sortValue: (post) => post.likeCount || 0,
    },
    {
      label: 'Comments',
      key: 'comments',
      render: (post) => (
        <span style={{ background: '#dbeafe', color: '#0284c7', padding: '2px 8px', borderRadius: '4px' }}>
          {post.commentCount || 0}
        </span>
      ),
      sortValue: (post) => post.commentCount || 0,
    },
    {
      label: 'Posted at',
      key: 'createdAt',
      render: (post) => (
        <span style={{ color: '#64748b', fontSize: '12px' }}>
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
          style={{ padding: '6px 12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          View
        </button>
      ),
    },
  ], [formatDate, navigate]);

  return (
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Manage Posts</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>View and manage all platform posts.</p>
      
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search by author, content, ID, or page..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px', flex: 1, borderRadius: '5px', border: '1px solid #cbd5e1' }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: '5px',
            border: '1px solid #cbd5e1',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <option value="ALL">All Posts</option>
          <option value="USER">User Posts</option>
          <option value="PAGE">Page Posts</option>
        </select>
        <div style={{ color: '#64748b', fontSize: '13px', minWidth: 'max-content' }}>
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
