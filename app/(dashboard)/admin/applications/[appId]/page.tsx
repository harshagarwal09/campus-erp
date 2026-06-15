'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface AppDetail {
  id: number;
  entityType: string;
  entityName: string;
  status: string;
  appliedAt: string;
  reviewedAt?: string;
  studentName: string;
  studentRoll: string;
  studentEmail?: string;
  skills?: string;
  githubUrl?: string;
}

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

export default function ViewApplicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const appId = params.appId as string;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchApp = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${appId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setApp(data.data);
      else showToast('error', data.error || 'Failed to load');
    } catch {
      showToast('error', 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [appId, showToast]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  const handleAction = async (action: 'approve' | 'reject') => {
    setActing(true);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || `Application ${action}d`);
        setTimeout(() => router.push('/admin/applications'), 1200);
      } else {
        showToast('error', data.error || 'Action failed');
      }
    } catch {
      showToast('error', 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return <div className="page"><div className="error-banner">Unauthorized</div></div>;
  }

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-breadcrumbs">
          <button className="secondary" onClick={() => router.push('/admin/applications')}>
            &larr; Back to Applications
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading...</p>
        ) : !app ? (
          <div className="page-card"><p className="empty-state">Application not found.</p></div>
        ) : (
          <>
            <div className="page-header">
              <div>
                <p className="eyebrow">Application</p>
                <h1>{app.entityName} &mdash; {app.entityType} Application</h1>
              </div>
              <div className="page-header-actions">
                {app.status === 'pending' && (
                  <>
                    <button className="primary" disabled={acting} onClick={() => handleAction('approve')}>
                      {acting ? 'Processing...' : 'Approve Application'}
                    </button>
                    <button className="btn-danger" disabled={acting} onClick={() => handleAction('reject')}>
                      Reject Application
                    </button>
                  </>
                )}
                {app.status !== 'pending' && (
                  <span className={`badge badge-${app.status}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                    {app.status}
                  </span>
                )}
              </div>
            </div>

            <div className="profile-grid">
              <div className="page-card">
                <header><h2>Application Details</h2></header>
                <div className="info-grid">
                  <div>
                    <div className="label">Entity Type</div>
                    <p style={{ textTransform: 'capitalize' }}>{app.entityType}</p>
                  </div>
                  <div>
                    <div className="label">Entity Name</div>
                    <p>{app.entityName}</p>
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <p><span className={`badge badge-${app.status}`}>{app.status}</span></p>
                  </div>
                  <div>
                    <div className="label">Applied Date</div>
                    <p>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              </div>

              <div className="page-card">
                <header><h2>Student Profile</h2></header>
                <div className="info-grid">
                  <div>
                    <div className="label">Name</div>
                    <p>{app.studentName}</p>
                  </div>
                  <div>
                    <div className="label">Roll Number</div>
                    <p>{app.studentRoll || '—'}</p>
                  </div>
                  <div>
                    <div className="label">Email</div>
                    <p>{app.studentEmail || '—'}</p>
                  </div>
                  <div>
                    <div className="label">Skills</div>
                    <p>{app.skills || '—'}</p>
                  </div>
                  <div>
                    <div className="label">GitHub</div>
                    <p>{app.githubUrl ? <a href={app.githubUrl} target="_blank" rel="noopener noreferrer">{app.githubUrl}</a> : '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
