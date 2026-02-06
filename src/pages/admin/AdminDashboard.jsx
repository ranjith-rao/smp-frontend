import React from 'react';

const AdminDashboard = () => {
  return (
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Welcome to Admin Dashboard</h1>
      <p style={{ color: '#64748b', fontSize: '16px' }}>Select an option from the sidebar to manage your platform.</p>
      
      {/* Dashboard Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px' }}>Total Users</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6366f1', margin: 0 }}>--</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px' }}>Total Posts</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>--</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px' }}>Pending Reports</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>--</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
