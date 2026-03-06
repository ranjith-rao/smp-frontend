import React, { useEffect, useState, useMemo, useRef } from 'react';
import { adminService } from '../../services/adminService';
import AdminTable from '../../components/AdminTable';
import Dialog from '../../components/Dialog';

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
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}
          >
            View
          </button>
          <button
            onClick={() => handleReply(query)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #6366f1', background: '#6366f1', color: 'white', cursor: 'pointer' }}
          >
            Reply
          </button>
          <button
            onClick={() => handleDelete(query.id)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ef4444', background: '#ef4444', color: 'white', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ], [handleDelete, handleReply]);

  return (
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Manage Queries</h1>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>View, reply, and delete user contact queries.</p>

      {error && <p style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
      {loading && <p style={{ color: '#6366f1' }}>Loading...</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by name, email, subject, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px', width: '320px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
        />
        <div style={{ color: '#64748b', fontSize: '13px' }}>
          Showing {filteredQueries.length} of {queries.length}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Queries Table */}
        <AdminTable
          columns={columns}
          data={filteredQueries}
          loading={loading}
          emptyText="No queries found."
          onRefresh={fetchQueries}
        />

        {/* Query Details */}
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>Query Details</h3>
          {!selectedQuery ? (
            <p style={{ color: '#94a3b8' }}>Select a query to view details.</p>
          ) : (
            <div>
              <p><strong>Name:</strong> {selectedQuery.name}</p>
              <p><strong>Email:</strong> {selectedQuery.email}</p>
              <p><strong>Subject:</strong> {selectedQuery.subject || '—'}</p>
              <p><strong>Date:</strong> {selectedQuery.createdAt ? new Date(selectedQuery.createdAt).toLocaleString() : '—'}</p>
              <p><strong>Message:</strong></p>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', color: '#334155' }}>
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
