'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface Hackathon {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  participantCount: number;
  createdAt: string;
  [key: string]: unknown;
}

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminHackathonsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Hackathon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hackathons', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setHackathons(data.data || []);
    } catch {
      showToast('error', 'Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hackathons/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setHackathons((prev) => prev.filter((h) => h.id !== deleteTarget.id));
        showToast('success', 'Hackathon deleted');
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
            <h1>Hackathons</h1>
            <p className="subtitle">Manage campus hackathons, participants, and schedules.</p>
          </div>
          <button className="primary" onClick={() => router.push('/admin/hackathons/new')}>
            + Create Hackathon
          </button>
        </div>

        <div className="page-card">
          <header>
            <div>
              <h2>Hackathon list</h2>
              <p className="subtitle">View and manage all hackathons.</p>
            </div>
          </header>

          {loading ? (
            <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading hackathons...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Max Participants</th>
                    <th>Participants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hackathons.length ? (
                    hackathons.map((h) => (
                      <tr key={h.id}>
                        <td>{h.name}</td>
                        <td>{h.startDate ? new Date(h.startDate).toLocaleDateString() : '—'}</td>
                        <td>{h.endDate ? new Date(h.endDate).toLocaleDateString() : '—'}</td>
                        <td>{h.maxParticipants ?? '—'}</td>
                        <td>{h.participantCount ?? 0}</td>
                        <td className="actions">
                          <button className="btn-small" onClick={() => router.push(`/admin/hackathons/${h.id}/view`)}>View</button>
                          <button className="btn-small" onClick={() => router.push(`/admin/hackathons/${h.id}/edit`)}>Edit</button>
                          <button className="btn-small btn-danger" onClick={() => setDeleteTarget(h)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty-state">No hackathons found.</td>
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
