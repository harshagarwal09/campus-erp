'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface Club {
  id: number;
  name: string;
  description: string;
  facultyCoordinator: string;
  memberCount: number;
  createdAt: string;
  [key: string]: unknown;
}

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminClubsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clubs', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setClubs(data.data || []);
    } catch {
      showToast('error', 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchClubs(); }, [fetchClubs]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clubs/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setClubs((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        showToast('success', 'Club deleted');
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

  if (user?.role !== 'ADMIN') {
    return (
      <div className="page">
        <div className="error-banner">Unauthorized</div>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Management</p>
            <h1>Clubs</h1>
            <p className="subtitle">Manage campus clubs, their members, and activities.</p>
          </div>
          <button className="primary" onClick={() => router.push('/admin/clubs/new')}>
            + Create Club
          </button>
        </div>

        <div className="page-card">
          <header>
            <div>
              <h2>Club list</h2>
              <p className="subtitle">View and manage all registered clubs.</p>
            </div>
          </header>

          {loading ? (
            <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading clubs...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Faculty Coordinator</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.length ? (
                    clubs.map((club) => (
                      <tr key={club.id}>
                        <td>{club.name}</td>
                        <td>{club.facultyCoordinator || '—'}</td>
                        <td>{club.memberCount ?? 0}</td>
                        <td>{club.createdAt ? new Date(club.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="actions">
                          <button className="btn-small" onClick={() => router.push(`/admin/clubs/${club.id}/view`)}>View</button>
                          <button className="btn-small" onClick={() => router.push(`/admin/clubs/${club.id}/edit`)}>Edit</button>
                          <button className="btn-small btn-danger" onClick={() => setDeleteTarget(club)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-state">No clubs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="overlay">
          <div className="modal">
            <h2>Confirm delete</h2>
            <p>Delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
