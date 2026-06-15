'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface Application {
  id: number;
  entity_type: string;
  entity_id: number;
  studentName: string;
  studentRoll: string;
  status: string;
  applied_at: string;
  clubName?: string;
  hackathonName?: string;
  festName?: string;
  skills?: string;
  githubUrl?: string;
}

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

export default function AdminApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'club' | 'hackathon' | 'fest'>('club');
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setApps(data.data || []);
    } catch {
      showToast('error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  if (user?.role !== 'ADMIN') {
    return <div className="page"><div className="error-banner">Unauthorized</div></div>;
  }

  const clubApps = apps.filter(a => a.entity_type === 'club');
  const hackathonApps = apps.filter(a => a.entity_type === 'hackathon');
  const festApps = apps.filter(a => a.entity_type === 'fest');

  const currentApps = tab === 'club' ? clubApps : tab === 'hackathon' ? hackathonApps : festApps;

  // Group by entity name
  const grouped = currentApps.reduce<Record<string, Application[]>>((acc, app) => {
    const name = app.clubName || app.hackathonName || app.festName || `Entity #${app.entity_id}`;
    if (!acc[name]) acc[name] = [];
    acc[name].push(app);
    return acc;
  }, {});

  const pendingCount = (list: Application[]) => list.filter(a => a.status === 'pending').length;

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">System</p>
            <h1>Applications</h1>
            <p className="subtitle">Review and manage student applications for clubs, hackathons, and fests.</p>
          </div>
        </div>

        <div className="tabs">
          <button className={tab === 'club' ? 'active' : ''} onClick={() => setTab('club')}>
            Clubs ({clubApps.length})
          </button>
          <button className={tab === 'hackathon' ? 'active' : ''} onClick={() => setTab('hackathon')}>
            Hackathons ({hackathonApps.length})
          </button>
          <button className={tab === 'fest' ? 'active' : ''} onClick={() => setTab('fest')}>
            Fests ({festApps.length})
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading applications...</p>
        ) : !Object.keys(grouped).length ? (
          <div className="page-card"><p className="empty-state">No applications found.</p></div>
        ) : (
          <div className="entity-list">
            {Object.entries(grouped).map(([entityName, entityApps]) => (
              <div key={entityName} className="entity-card">
                <h3>{entityName}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
                  {pendingCount(entityApps)} pending &middot; {entityApps.length} total
                </p>
                {entityApps.map(app => (
                  <div key={app.id} className="app-row">
                    <div>
                      <strong>{app.studentName}</strong>
                      <div className="muted">Roll: {app.studentRoll || '—'}</div>
                    </div>
                    <div className="app-actions">
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                      <button className="btn-small secondary" onClick={() => router.push(`/admin/applications/${app.id}`)}>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
