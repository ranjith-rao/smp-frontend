import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { getUserHandle } from '../../utils/userHelpers';
import AdminTable from '../../components/AdminTable';
import Dialog from '../../components/Dialog';
import '../../styles/AdminPages.css';

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
        <div className="admin-user-cell">
          <div className="admin-user-name">{user.firstName} {user.lastName}</div>
          <div className="admin-user-handle">@{getUserHandle(user)}</div>
          <div className="admin-user-email">{user.email}</div>
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
        <div className="admin-table-actions">
          <button
            onClick={() => handleToggleBlock(user.id)}
            className="admin-action-btn"
          >
            {user.isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="admin-action-btn danger"
          >
            Delete
          </button>
        </div>
      ),
    },
  ], [handleToggleBlock, handleDelete]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">Create users, manage status, and search the community quickly.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="admin-primary-btn"
        >
          {showCreateForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="admin-card admin-form-card">
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div className="admin-form-grid two-col">
              <div className="admin-field">
                <label>First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="admin-field">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="admin-primary-btn success"
            >
              Create User
            </button>
          </form>
        </div>
      )}
      
      {error && <div className="admin-banner error">{error}</div>}
      {loading && <div className="admin-banner info">Loading...</div>}
      
      {/* Search and Filter Bar */}
      <div className="admin-toolbar">
        <input 
          type="text" 
          placeholder="Search by email or name..." 
          className="admin-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="admin-select-input">
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
      <div className="admin-pagination-external">
        {[...Array(totalPages)].map((_, i) => (
          <button 
            key={i} 
            onClick={() => setPage(i + 1)}
            className={page === i + 1 ? 'active' : ''}
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