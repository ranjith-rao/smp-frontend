import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AdminTable from '../../components/AdminTable';
import { authService } from '../../services/authService';
import { API_CONFIG } from '../../config/api';
import apiFetch from '../../utils/apiFetch';
import Dialog from '../../components/Dialog';

const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogState, setDialogState] = useState({ open: false, title: '', message: '', variant: 'default' });
  const dialogActionRef = useRef(null);

  useEffect(() => {
    fetchPages();
  }, [page, limit, search]);

  const fetchPages = async () => {
    setLoading(true);
    setError('');
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({
        page,
        limit,
        search,
      });

      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.PAGES}/admin?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load pages');

      setPages(data.pages || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = useCallback((pageId, pageName) => {
    dialogActionRef.current = async () => {
      try {
        const token = authService.getToken();
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.PAGES}/${pageId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete page');

        fetchPages();
        setDialogState((prev) => ({ ...prev, open: false }));
      } catch (err) {
        setError(err.message || 'Failed to delete page');
      }
    };

    setDialogState({
      open: true,
      title: 'Delete Page',
      message: `Are you sure you want to delete "${pageName}"? This cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
  }, []);

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pages;

    return pages.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const slug = (p.slug || '').toLowerCase();
      const ownerName = `${p.owner?.firstName || ''} ${p.owner?.lastName || ''}`.toLowerCase();
      const category = (p.category || '').toLowerCase();

      return (
        name.includes(query) ||
        slug.includes(query) ||
        ownerName.includes(query) ||
        category.includes(query)
      );
    });
  }, [pages, search]);

  const columns = useMemo(() => [
    {
      label: 'Page Name',
      key: 'name',
      render: (p) => (
        <div>
          <div style={{ fontWeight: '600', color: '#0f172a' }}>{p.name}</div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>/{p.slug}</div>
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      label: 'Owner',
      key: 'owner',
      render: (p) => `${p.owner?.firstName || ''} ${p.owner?.lastName || ''}`,
      sortValue: (p) => `${p.owner?.firstName || ''} ${p.owner?.lastName || ''}`,
    },
    {
      label: 'Category',
      key: 'category',
      render: (p) => (
        <span style={{ background: '#eef2ff', color: '#6366f1', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>
          {p.category || 'Uncategorized'}
        </span>
      ),
      sortValue: (p) => p.category || '',
    },
    {
      label: 'Posts',
      key: 'postCount',
      render: (p) => (
        <span style={{ background: '#dbeafe', color: '#0284c7', padding: '2px 8px', borderRadius: '4px' }}>
          {p.postCount || 0}
        </span>
      ),
      sortValue: (p) => p.postCount || 0,
    },
    {
      label: 'Followers',
      key: 'followerCount',
      render: (p) => (
        <span style={{ background: '#e0fdf4', color: '#059669', padding: '2px 8px', borderRadius: '4px' }}>
          {p.followerCount || 0}
        </span>
      ),
      sortValue: (p) => p.followerCount || 0,
    },
    {
      label: 'Created',
      key: 'createdAt',
      render: (p) => (
        <span style={{ color: '#64748b', fontSize: '12px' }}>
          {formatDate(p.createdDate || p.createdAt)}
        </span>
      ),
      sortValue: (p) => new Date(p.createdDate || p.createdAt).getTime(),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (p) => (
        <button
          onClick={() => handleDeletePage(p.id, p.name)}
          style={{
            padding: '6px 12px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Delete
        </button>
      ),
    },
  ], [handleDeletePage, formatDate]);

  return (
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Manage Pages</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>View and manage all community pages.</p>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search by name, slug, owner, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px', flex: 1, borderRadius: '5px', border: '1px solid #cbd5e1' }}
        />
        <div style={{ color: '#64748b', fontSize: '13px', minWidth: 'max-content' }}>
          Showing {filteredPages.length} of {pages.length}
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredPages}
        loading={loading}
        emptyText="No pages found."
        onRefresh={fetchPages}
      />

      <Dialog
        isOpen={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText || 'Confirm'}
        cancelText={dialogState.cancelText || 'Cancel'}
        onConfirm={() => dialogActionRef.current?.()}
        onCancel={() => setDialogState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default AdminPages;
