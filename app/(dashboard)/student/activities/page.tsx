'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface MyApp {
  id: number;
  entityType: string;
  entityId: number;
  entityName: string;
  status: string;
  appliedAt: string;
}

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

export default function MyActivitiesPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<MyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/my', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setApps(data.data || []);
      else showToast('error', data.error || 'Failed to load');
    } catch {
      showToast('error', 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const clubApps = apps.filter(a => a.entityType === 'club');
  const hackathonApps = apps.filter(a => a.entityType === 'hackathon');
  const festApps = apps.filter(a => a.entityType === 'fest');

  const getEntityPath = (app: MyApp) => {
    const typePath: Record<string, string> = { club: '/club', hackathon: '/hackathon', fest: '/fest' };
    return typePath[app.entityType] ? `${typePath[app.entityType]}/${app.entityId}` : null;
  };

  const renderSection = (title: string, items: MyApp[]) => (
    <div className="page-card">
      <header><h2>{title}</h2></header>
      {!items.length ? (
        <p className="empty-state">No applications yet.</p>
      ) : (
        items.map(app => {
          const path = app.status === 'approved' ? getEntityPath(app) : null;
          return (
            <div key={app.id} className="app-row">
              <div>
                {path ? (
                  <Link href={path} style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
                    {app.entityName}
                  </Link>
                ) : (
                  <strong>{app.entityName}</strong>
                )}
                <div className="muted">
                  Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}
                </div>
              </div>
              <span className={`badge badge-${app.status}`}>{app.status}</span>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Activities</p>
            <h1>My Activities</h1>
            <p className="subtitle">Track your applications and memberships across the campus.</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading...</p>
        ) : (
          <>
            {renderSection('Club Applications', clubApps)}
            {renderSection('Hackathon Applications', hackathonApps)}
            {renderSection('Fest Applications', festApps)}

            {!apps.length && (
              <div className="page-card">
                <p className="empty-state" style={{ padding: '2rem 0' }}>
                  You haven&apos;t applied to anything yet. Head to Explore to find opportunities!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
