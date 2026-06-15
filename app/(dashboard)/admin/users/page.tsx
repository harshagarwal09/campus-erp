'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  entityType: string | null;
  entityId: number | null;
  createdAt: string;
  studentName?: string;
}

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

const ROLES = ['ADMIN', 'STUDENT', 'CLUB_HEAD', 'HACKATHON_LEAD', 'FEST_COORDINATOR'];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'STUDENT', entityType: '', entityId: '' });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch {
      showToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        showToast('success', 'Role updated');
      } else {
        showToast('error', data.error || 'Update failed');
      }
    } catch {
      showToast('error', 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
        showToast('success', 'User deleted');
      } else {
        showToast('error', data.error || 'Delete failed');
      }
    } catch {
      showToast('error', 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createForm.username,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          entityType: createForm.entityType || null,
          entityId: createForm.entityId ? Number(createForm.entityId) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'User created');
        setShowCreate(false);
        setCreateForm({ username: '', email: '', password: '', role: 'STUDENT', entityType: '', entityId: '' });
        fetchUsers();
      } else {
        showToast('error', data.error || 'Create failed');
      }
    } catch {
      showToast('error', 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return <div className="page"><div className="error-banner">Unauthorized</div></div>;
  }

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">System</p>
            <h1>Users</h1>
            <p className="subtitle">Manage user accounts, roles, and access permissions.</p>
          </div>
          <button className="primary" onClick={() => setShowCreate(true)}>+ Create User</button>
        </div>

        <div className="page-card">
          <header><h2>User list</h2></header>
          {loading ? (
            <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading users...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Entity</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length ? users.map(u => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.email || '—'}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>{u.entityType ? `${u.entityType} #${u.entityId ?? ''}` : '—'}</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="actions">
                        <button className="btn-small btn-danger" onClick={() => setDeleteTarget(u)}>Delete</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="empty-state">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="overlay">
          <div className="modal">
            <h2>Create User</h2>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <label>Username</label>
                <input value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div>
                <label>Email</label>
                <input value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label>Role</label>
                <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label>Entity Type</label>
                <input value={createForm.entityType} onChange={e => setCreateForm(p => ({ ...p, entityType: e.target.value }))} placeholder="e.g. CLUB" />
              </div>
              <div>
                <label>Entity ID</label>
                <input value={createForm.entityId} onChange={e => setCreateForm(p => ({ ...p, entityId: e.target.value }))} placeholder="e.g. 1" />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="button" className="primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="overlay">
          <div className="modal">
            <h2>Confirm delete</h2>
            <p>Delete user <strong>{deleteTarget.username}</strong>? This action cannot be undone.</p>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
