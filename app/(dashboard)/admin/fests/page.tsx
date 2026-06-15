'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface Fest {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  participantCount: number;
  createdAt: string;
  [key: string]: unknown;
}

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminFestsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [fests, setFests] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Fest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchFests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fests', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setFests(data.data || []);
    } catch {
      showToast('error', 'Failed to load fests');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchFests(); }, [fetchFests]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/fests/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setFests((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        showToast('success', 'Fest deleted');
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
            <h1>Fests</h1>
            <p className="subtitle">Manage campus fests, participants, and schedules.</p>
          </div>
          <button className="primary" onClick={() => router.push('/admin/fests/new')}>
            + Create Fest
          </button>
        </div>

        <div className="page-card">
          <header>
            <div>
              <h2>Fest list</h2>
              <p className="subtitle">View and manage all fests.</p>
            </div>
          </header>

          {loading ? (
            <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading fests...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Venue</th>
                    <th>Participants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fests.length ? (
                    fests.map((f) => (
                      <tr key={f.id}>
                        <td>{f.name}</td>
                        <td>{f.startDate ? new Date(f.startDate).toLocaleDateString() : '—'}</td>
                        <td>{f.endDate ? new Date(f.endDate).toLocaleDateString() : '—'}</td>
                        <td>{f.venue || '—'}</td>
                        <td>{f.participantCount ?? 0}</td>
                        <td className="actions">
                          <button className="btn-small" onClick={() => router.push(`/admin/fests/${f.id}/view`)}>View</button>
                          <button className="btn-small" onClick={() => router.push(`/admin/fests/${f.id}/edit`)}>Edit</button>
                          <button className="btn-small btn-danger" onClick={() => setDeleteTarget(f)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty-state">No fests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
