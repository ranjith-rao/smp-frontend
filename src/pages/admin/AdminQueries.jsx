import React, { useEffect, useState, useMemo, useRef } from 'react';
import { adminService } from '../../services/adminService';
import AdminTable from '../../components/AdminTable';
import Dialog from '../../components/Dialog';
import '../../styles/AdminPages.css';

const AdminQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [search, setSearch] = useState('');
  const dialogActionRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    variant: 'default'
  });

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
    dialogActionRef.current = null;
  };

  const openConfirm = (message, onConfirm, title = 'Confirm', confirmText = 'Confirm') => {
    setDialogState({
      open: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      variant: 'danger'
    });
    dialogActionRef.current = async () => {
      closeDialog();
      await onConfirm();
    };
  };

  const handleDialogConfirm = async () => {
    if (dialogActionRef.current) {
      await dialogActionRef.current();
    } else {
      closeDialog();
    }
  };

  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getQueries();
      setQueries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleDelete = async (queryId) => {
    openConfirm('Are you sure you want to delete this query?', async () => {
      try {
        await adminService.deleteQuery(queryId);
        setQueries((prev) => prev.filter((q) => q.id !== queryId));
        if (selectedQuery && selectedQuery.id === queryId) {
          setSelectedQuery(null);
        }
      } catch (err) {
        setError(err.message || 'Failed to delete query');
      }
    }, 'Delete query', 'Delete');
  };

  const handleReply = (query) => {
    const subject = encodeURIComponent(`Re: ${query.subject || 'Your Query'}`);
    const body = encodeURIComponent(`Hi ${query.name || ''},\n\nThanks for reaching out.\n\nYour message:\n${query.message || ''}\n\nRegards,\nNEXUS Support`);
    window.location.href = `mailto:${query.email}?subject=${subject}&body=${body}`;
  };

  const filteredQueries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return queries;
    return queries.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      const message = (item.message || '').toLowerCase();
      const id = String(item.id || '').toLowerCase();
      return (
        name.includes(query) ||
        email.includes(query) ||
        subject.includes(query) ||
        message.includes(query) ||
        id.includes(query)
      );
    });
  }, [queries, search]);

  const columns = useMemo(() => [
    {
      label: 'Name',
      key: 'name',
      render: (query) => query.name,
      sortValue: (query) => query.name,
    },
    {
      label: 'Email',
      key: 'email',
      render: (query) => query.email,
      sortValue: (query) => query.email,
    },
    {
      label: 'Subject',
      key: 'subject',
      render: (query) => query.subject || '—',
      sortValue: (query) => query.subject || '',
    },
    {
      label: 'Date',
      key: 'date',
      render: (query) => (query.createdAt ? new Date(query.createdAt).toLocaleString() : '—'),
      sortValue: (query) => (query.createdAt ? new Date(query.createdAt).getTime() : 0),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (query) => (
        <div className="admin-table-actions">
          <button
            onClick={() => setSelectedQuery(query)}
            className="admin-action-btn"
          >
            View
          </button>
          <button
            onClick={() => handleReply(query)}
            className="admin-action-btn primary"
          >
            Reply
          </button>
          <button
            onClick={() => handleDelete(query.id)}
            className="admin-action-btn danger-fill"
          >
            Delete
          </button>
        </div>
      ),
    },
  ], [handleDelete, handleReply]);

  return (
    <div className="admin-page">
      <div className="admin-page-header stacked">
        <h1 className="admin-page-title">Manage Queries</h1>
        <p className="admin-page-subtitle">View, reply, and delete user contact queries.</p>
      </div>

      {error && <div className="admin-banner error">{error}</div>}
      {loading && <div className="admin-banner info">Loading...</div>}

      <div className="admin-toolbar">
        <input
          type="text"
          placeholder="Search by name, email, subject, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
        <div className="admin-count-text">
          Showing {filteredQueries.length} of {queries.length}
        </div>
      </div>

      <div className="admin-grid-two">
        {/* Queries Table */}
        <AdminTable
          columns={columns}
          data={filteredQueries}
          loading={loading}
          emptyText="No queries found."
          onRefresh={fetchQueries}
        />

        {/* Query Details */}
        <div className="admin-card admin-detail-card">
          <h3>Query Details</h3>
          {!selectedQuery ? (
            <p className="admin-muted">Select a query to view details.</p>
          ) : (
            <div>
              <p><strong>Name:</strong> {selectedQuery.name}</p>
              <p><strong>Email:</strong> {selectedQuery.email}</p>
              <p><strong>Subject:</strong> {selectedQuery.subject || '—'}</p>
              <p><strong>Date:</strong> {selectedQuery.createdAt ? new Date(selectedQuery.createdAt).toLocaleString() : '—'}</p>
              <p><strong>Message:</strong></p>
              <div className="admin-message-box">
                {selectedQuery.message || '—'}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        isOpen={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={handleDialogConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
};

export default AdminQueries;
