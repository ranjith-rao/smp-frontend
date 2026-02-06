import React from 'react';

const AdminReports = () => {
  return (
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Reports</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>View and manage user reports and complaints.</p>
      
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>Report ID</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>Reported By</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>Reason</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No reports found. Data will be populated from API.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReports;
