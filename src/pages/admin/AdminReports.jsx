import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import API_CONFIG from '../../config/api';
import apiFetch from '../../utils/apiFetch';
import AdminTable from '../../components/AdminTable';
import { normalizePostContent } from '../../utils/contentHelpers';

const AdminReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch reports');
      setReports(data.reports);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((report) => report.type === typeFilter);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    // Filter by search query
    const query = search.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((report) => {
        const id = String(report.id || '').toLowerCase();
        const contentId = String(report.postId || report.commentId || report.pageId || '').toLowerCase();
        const content = (report.content || '').toLowerCase();
        const pageName = (report.page?.name || '').toLowerCase();
        const reason = (report.reason || '').toLowerCase();
        const reporterName = `${report.reportedBy?.firstName || ''} ${report.reportedBy?.lastName || ''}`.toLowerCase();
        const reporterEmail = (report.reportedBy?.email || '').toLowerCase();
        return (
          id.includes(query) ||
          contentId.includes(query) ||
          content.includes(query) ||
          pageName.includes(query) ||
          reason.includes(query) ||
          reporterName.includes(query) ||
          reporterEmail.includes(query)
        );
      });
    }

    return filtered;
  }, [reports, search, typeFilter, statusFilter]);

  const columns = useMemo(() => [
    {
      label: 'Type',
      key: 'type',
      render: (report) => (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          background:
            report.type === 'POST'
              ? '#dbeafe'
              : report.type === 'COMMENT'
                ? '#fef3c7'
                : '#ede9fe',
          color:
            report.type === 'POST'
              ? '#1e40af'
              : report.type === 'COMMENT'
                ? '#92400e'
                : '#5b21b6'
        }}>
          {report.type}
        </span>
      ),
      sortValue: (report) => report.type,
    },
    {
      label: 'Content',
      key: 'content',
      render: (report) => (
        <div style={{ maxWidth: '260px' }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {report.content ? normalizePostContent(report.content) : <em style={{ color: '#94a3b8' }}>Media only</em>}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {report.type === 'POST'
              ? `Post ID: ${report.postId}`
              : report.type === 'COMMENT'
                ? `Comment ID: ${report.commentId}`
                : `Page ID: ${report.pageId}`}
          </div>
        </div>
      ),
      sortValue: (report) => report.content || '',
    },
    {
      label: 'Reported By',
      key: 'reporter',
      render: (report) => (
        <div>
          <div>{report.reportedBy.firstName} {report.reportedBy.lastName}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{report.reportedBy.email}</div>
        </div>
      ),
      sortValue: (report) => `${report.reportedBy.firstName} ${report.reportedBy.lastName}`,
    },
    {
      label: 'Reason',
      key: 'reason',
      render: (report) => (
        <div style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {report.reason}
        </div>
      ),
      sortValue: (report) => report.reason,
    },
    {
      label: 'Status',
      key: 'status',
      render: (report) => {
        const statusColors = {
          PENDING: { bg: '#fef3c7', color: '#92400e' },
          RESOLVED: { bg: '#d1fae5', color: '#065f46' },
          DISMISSED: { bg: '#e5e7eb', color: '#374151' }
        };
        const colors = statusColors[report.status] || statusColors.PENDING;
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            background: colors.bg,
            color: colors.color
          }}>
            {report.status}
          </span>
        );
      },
      sortValue: (report) => report.status,
    },
    {
      label: 'Date',
      key: 'date',
      render: (report) => (
        <span style={{ color: '#64748b', fontSize: '14px' }}>{formatDate(report.createdAt)}</span>
      ),
      sortValue: (report) => new Date(report.createdAt).getTime(),
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (report) => (
        <button
          onClick={() => navigate(`/admin/reports/${report.id}`)}
          style={{
            padding: '6px 12px',
            background: '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          View
        </button>
      ),
    },
  ], [formatDate, navigate]);

  return (
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Reports Management</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>View and manage user reports and complaints.</p>
      
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
        >
          <option value="ALL">All Types</option>
          <option value="POST">Posts</option>
          <option value="COMMENT">Comments</option>
          <option value="PAGE">Pages</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>

        <input
          type="text"
          placeholder="Search by content, reason, reporter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px', width: '320px', borderRadius: '5px', border: '1px solid #cbd5e1', flex: 1 }}
        />
        
        <div style={{ color: '#64748b', fontSize: '13px', marginLeft: 'auto' }}>
          Showing {filteredReports.length} of {reports.length}
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredReports}
        loading={loading}
        emptyText="No reports found."
        onRefresh={fetchReports}
      />
    </div>
  );
};

export default AdminReports;
