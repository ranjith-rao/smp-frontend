import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getUsers(page, limit, search);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      await adminService.toggleBlockUser(id);
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  return (
    <div>
      <h1 style={{ color: '#1e293b' }}>User Management</h1>
      
      {error && <p style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
      {loading && <p style={{ color: '#6366f1' }}>Loading...</p>}
      
      {/* Search and Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search by email or name..." 
          style={{ padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <select value={limit} onChange={(e) => setLimit(e.target.value)} style={{ padding: '10px' }}>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: '600' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                    backgroundColor: user.isBlocked ? '#fee2e2' : '#dcfce7',
                    color: user.isBlocked ? '#ef4444' : '#22c55e'
                  }}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>{user.role}</td>
                <td style={{ padding: '15px' }}>
                  <button 
                    onClick={() => handleToggleBlock(user.id)}
                    style={{ 
                      padding: '5px 10px', cursor: 'pointer', borderRadius: '4px',
                      border: '1px solid #cbd5e1', backgroundColor: 'white'
                    }}>
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        {[...Array(totalPages)].map((_, i) => (
          <button 
            key={i} 
            onClick={() => setPage(i + 1)}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: page === i + 1 ? '#6366f1' : 'white',
              color: page === i + 1 ? 'white' : 'black'
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;