import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { getUserHandle } from '../../utils/userHelpers';
import AdminTable from '../../components/AdminTable';
import Dialog from '../../components/Dialog';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'USER'
  });
  const [dialogState, setDialogState] = useState({ open: false, title: '', message: '', variant: 'default', showInput: false, inputValue: '' });
  const dialogActionRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getUsers(page, limit, search);
      // Filter out system admins from the list
      const filteredUsers = (data.users || []).filter(user => user.role !== 'ADMIN');
      setUsers(filteredUsers);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = useCallback(async (id) => {
    try {
      await adminService.toggleBlockUser(id);
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  }, []);

  const handleDelete = useCallback((id) => {
    dialogActionRef.current = async () => {
      try {
        await adminService.deleteUser(id);
        fetchUsers(); // Refresh list
        setDialogState((prev) => ({ ...prev, open: false, inputValue: '' }));
      } catch (err) {
        setError(err.message || 'Failed to delete user');
      }
    };

    setDialogState({
      open: true,
      title: 'Delete User',
      message: 'Type "DELETE" to confirm this action. This cannot be undone.',
      variant: 'danger',
      showInput: true,
      inputValue: ''
    });
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await adminService.createUser(formData);
      setShowCreateForm(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'USER'
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const columns = useMemo(() => [
    {
      label: 'User',
      key: 'user',
      render: (user) => (
        <div>
          <div style={{ fontWeight: '600' }}>{user.firstName} {user.lastName}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>@{getUserHandle(user)}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
        </div>
      ),
      sortValue: (user) => `${user.firstName} ${user.lastName}`,
    },
    {
      label: 'Status',
      key: 'status',
      render: (user) => (
        <span className={`admin-table-pill ${user.isBlocked ? 'danger' : 'success'}`}>
          {user.isBlocked ? 'Blocked' : 'Active'}
        </span>
      ),
      sortValue: (user) => (user.isBlocked ? 1 : 0),
    },
    {
      label: 'Role',
      key: 'role',
      render: (user) => user.role,
      sortValue: (user) => user.role,
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (user) => (
        <div className="admin-table-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleToggleBlock(user.id)}
            style={{
              padding: '5px 10px',
              cursor: 'pointer',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: 'white'
            }}
          >
            {user.isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            style={{
              padding: '5px 10px',
              cursor: 'pointer',
              borderRadius: '4px',
              border: '1px solid #ef4444',
              backgroundColor: '#fee2e2',
              color: '#991b1b'
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ], [handleToggleBlock, handleDelete]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#1e293b', margin: 0 }}>User Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {showCreateForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Create User
            </button>
          </form>
        </div>
      )}
      
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

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        emptyText="No users found."
        onRefresh={fetchUsers}
      />

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

      <Dialog
        isOpen={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText="Delete"
        cancelText="Cancel"
        showInput={dialogState.showInput}
        inputValue={dialogState.inputValue}
        inputPlaceholder='Type "DELETE" to confirm'
        requireDeleteConfirmation={true}
        onInputChange={(value) => setDialogState({ ...dialogState, inputValue: value })}
        onConfirm={() => {
          if (dialogState.showInput && dialogState.inputValue !== 'DELETE') {
            return;
          }
          if (dialogActionRef.current) {
            dialogActionRef.current();
          }
          setDialogState({ ...dialogState, open: false, inputValue: '' });
        }}
        onCancel={() => setDialogState({ ...dialogState, open: false, inputValue: '' })}
      />
    </div>
  );
};

export default AdminUsers;