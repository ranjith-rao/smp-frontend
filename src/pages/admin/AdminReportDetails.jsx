import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { API_CONFIG } from '../../config/api';
import apiFetch from '../../utils/apiFetch';
import Dialog from '../../components/Dialog';
import { ToastContainer } from '../../components/Toast';
import { normalizePostContent } from '../../utils/contentHelpers';

const AdminReportDetails = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const dialogActionRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    variant: 'default'
  });

  const showToast = (message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
    dialogActionRef.current = null;
  };

  const handleDialogConfirm = async () => {
    if (dialogActionRef.current) {
      await dialogActionRef.current();
    } else {
      closeDialog();
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const token = authService.getToken();
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load reports');
        
        const found = (data.reports || []).find((r) => String(r.id) === String(reportId));
        if (!found) throw new Error('Report not found.');
        
        setReport(found);
      } catch (err) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleToggleContentVisibility = (shouldHide) => {
    if (report.type === 'PAGE') return;

    const contentType = report.type === 'POST' ? 'post' : 'comment';
    const contentId = report.type === 'POST' ? report.postId : report.commentId;
    const actionLabel = shouldHide ? 'Block' : 'Unblock';

    setDialogState({
      open: true,
      title: `${actionLabel} ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
      message: shouldHide
        ? `Are you sure you want to block this reported ${contentType}? The content will be hidden from users but can be restored later.`
        : `Are you sure you want to unblock this ${contentType}? The content will become visible to users again.`,
      confirmText: actionLabel,
      cancelText: 'Cancel',
      variant: shouldHide ? 'danger' : 'default'
    });

    dialogActionRef.current = async () => {
      try {
        const token = authService.getToken();
        const endpoint = report.type === 'POST'
          ? `${API_CONFIG.ENDPOINTS.POSTS}/admin/posts/${contentId}/visibility`
          : `${API_CONFIG.ENDPOINTS.POSTS}/admin/comments/${contentId}/visibility`;

        const res = await apiFetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isHidden: shouldHide })
        });

        if (!res.ok) throw new Error(`Failed to ${actionLabel.toLowerCase()} ${contentType}`);

        if (shouldHide) {
          // Mark report as resolved when content is blocked
          await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/reports/${reportId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'RESOLVED', type: report.type })
          });
        }

        setReport((prev) => ({
          ...prev,
          isHidden: shouldHide,
          status: shouldHide ? 'RESOLVED' : prev.status
        }));

        showToast(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} ${shouldHide ? 'blocked' : 'unblocked'} successfully`, 'success');
        closeDialog();
      } catch (err) {
        showToast(err.message || `Failed to ${actionLabel.toLowerCase()} ${contentType}`, 'error');
        closeDialog();
      }
    };
  };

  const handleResolveReport = () => {
    setDialogState({
      open: true,
      title: 'Resolve Report',
      message: 'Mark this report as resolved?',
      confirmText: 'Resolve',
      cancelText: 'Cancel',
      variant: 'default'
    });

    dialogActionRef.current = async () => {
      try {
        const token = authService.getToken();
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/reports/${reportId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'RESOLVED', type: report.type })
        });

        if (!res.ok) throw new Error('Failed to resolve report');

        setReport((prev) => ({ ...prev, status: 'RESOLVED' }));
        showToast('Report resolved successfully', 'success');
        closeDialog();
      } catch (err) {
        showToast(err.message || 'Failed to resolve report', 'error');
        closeDialog();
      }
    };
  };

  const handleDismissReport = () => {
    setDialogState({
      open: true,
      title: 'Dismiss Report',
      message: 'Are you sure you want to dismiss this report? This marks the report as a false or invalid complaint and keeps the content visible.',
      confirmText: 'Dismiss',
      cancelText: 'Cancel',
      variant: 'default'
    });
    
    dialogActionRef.current = async () => {
      try {
        const token = authService.getToken();
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/reports/${reportId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'DISMISSED', type: report.type })
        });
        
        if (!res.ok) throw new Error('Failed to dismiss report');
        
        setReport((prev) => ({ ...prev, status: 'DISMISSED' }));
        showToast('Report dismissed successfully', 'success');
        closeDialog();
      } catch (err) {
        showToast(err.message || 'Failed to dismiss report', 'error');
        closeDialog();
      }
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '16px', color: '#64748b' }}>Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
        <button onClick={() => navigate('/admin/reports')} style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Back to Reports
        </button>
      </div>
    );
  }

  if (!report) return null;

  const statusColors = {
    PENDING: { bg: '#fef3c7', color: '#92400e' },
    RESOLVED: { bg: '#d1fae5', color: '#065f46' },
    DISMISSED: { bg: '#e5e7eb', color: '#374151' }
  };
  const statusColor = statusColors[report.status] || statusColors.PENDING;
  const isPageReport = report.type === 'PAGE';

  return (
    <div style={{ padding: '20px', maxWidth: '1000px' }}>
      {/* Header with Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          <span onClick={() => navigate('/admin/reports')} style={{ cursor: 'pointer', color: '#6366f1' }}>
            Reports
          </span>
          {' / '}
          <span>Report Details</span>
        </div>
        <button 
          onClick={() => navigate('/admin/reports')}
          style={{
            padding: '8px 16px',
            background: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Back to Reports
        </button>
      </div>

      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Report Details</h1>

      {/* Report Info Card */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '600', color: '#64748b' }}>Report ID:</div>
          <div>{report.id}</div>

          <div style={{ fontWeight: '600', color: '#64748b' }}>Type:</div>
          <div>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '13px',
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
          </div>

          <div style={{ fontWeight: '600', color: '#64748b' }}>Status:</div>
          <div>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
              background: statusColor.bg,
              color: statusColor.color
            }}>
              {report.status}
            </span>
          </div>

          <div style={{ fontWeight: '600', color: '#64748b' }}>Reported By:</div>
          <div>
            <div>{report.reportedBy.firstName} {report.reportedBy.lastName}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{report.reportedBy.email}</div>
          </div>

          <div style={{ fontWeight: '600', color: '#64748b' }}>Report Date:</div>
          <div>{new Date(report.createdAt).toLocaleString()}</div>

          <div style={{ fontWeight: '600', color: '#64748b' }}>Reason:</div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            {report.reason}
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0, color: '#1e293b', fontSize: '18px' }}>Reported Content</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px' }}>
          <div style={{ fontWeight: '600', color: '#64748b' }}>
            {report.type === 'POST' ? 'Post ID:' : report.type === 'COMMENT' ? 'Comment ID:' : 'Page ID:'}
          </div>
          <div>{report.type === 'POST' ? report.postId : report.type === 'COMMENT' ? report.commentId : report.pageId}</div>

          {report.type === 'PAGE' && report.page?.name && (
            <>
              <div style={{ fontWeight: '600', color: '#64748b' }}>Page:</div>
              <div>
                {report.page.name}
                {report.page.slug ? <span style={{ color: '#64748b' }}> ({report.page.slug})</span> : null}
              </div>
            </>
          )}

          {report.postId && report.type === 'COMMENT' && (
            <>
              <div style={{ fontWeight: '600', color: '#64748b' }}>Post ID:</div>
              <div>{report.postId}</div>
            </>
          )}

          <div style={{ fontWeight: '600', color: '#64748b' }}>Content:</div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
            {report.content ? normalizePostContent(report.content) : <em style={{ color: '#94a3b8' }}>Media only (no text)</em>}
          </div>

          {report.mediaType && (
            <>
              <div style={{ fontWeight: '600', color: '#64748b' }}>Media:</div>
              <div>
                {report.mediaType === 'image' ? (
                  <img src={report.mediaUrl} alt="Post media" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
                ) : (
                  <video controls style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}>
                    <source src={report.mediaUrl} type="video/mp4" />
                  </video>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {report.status === 'PENDING' && (
          <>
            {isPageReport && (
              <button
                onClick={handleResolveReport}
                style={{
                  padding: '10px 20px',
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Resolve Report
              </button>
            )}
            <button
              onClick={handleDismissReport}
              style={{
                padding: '10px 20px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Dismiss Report
            </button>
          </>
        )}
        {!isPageReport && (
          <button
            onClick={() => handleToggleContentVisibility(!report.isHidden)}
            style={{
              padding: '10px 20px',
              background: report.isHidden ? '#10b981' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {report.isHidden ? 'Unblock' : 'Block'} {report.type === 'POST' ? 'Post' : 'Comment'}
          </button>
        )}
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default AdminReportDetails;
