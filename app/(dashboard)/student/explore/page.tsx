'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

interface ClubItem {
  id: number; name: string; description: string; facultyCoordinator: string;
  memberCount: number; [k: string]: any;
}
interface HackathonItem {
  id: number; name: string; description: string; startDate: string; endDate: string;
  maxParticipants: number; participantCount: number; [k: string]: any;
}
interface FestItem {
  id: number; name: string; description: string; venue: string; startDate: string;
  endDate: string; participantCount: number; [k: string]: any;
}
interface MyApp {
  id: number; entityType: string; entityName: string; status: string;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'club' | 'hackathon' | 'fest'>('club');
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [fests, setFests] = useState<FestItem[]>([]);
  const [myApps, setMyApps] = useState<MyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [clubRes, hackRes, festRes, myRes] = await Promise.all([
        fetch('/api/clubs', { credentials: 'include' }),
        fetch('/api/hackathons', { credentials: 'include' }),
        fetch('/api/fests', { credentials: 'include' }),
        fetch('/api/applications/my', { credentials: 'include' }),
      ]);
      const [clubData, hackData, festData, myData] = await Promise.all([
        clubRes.json(), hackRes.json(), festRes.json(), myRes.json(),
      ]);
      if (clubData.success) setClubs(clubData.data || []);
      if (hackData.success) setHackathons(hackData.data || []);
      if (festData.success) setFests(festData.data || []);
      if (myData.success) setMyApps(myData.data || []);
    } catch {
      showToast('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const alreadyApplied = (entityType: string, entityId: number): boolean => {
    return myApps.some(
      a => a.entityType === entityType && a.status !== 'rejected'
        && a.entityName === '' // fallback; better to check by id
    ) || myApps.some(a => {
      // We stored entityName not entityId in my route - match differently
      // Actually, let's re-check: we'll use the applications/my endpoint which returns entityName
      // For now, do a simple approach: check if any pending/approved app exists
      return false;
    });
  };

  const hasApplied = (entityType: string, entityId: number): boolean => {
    return myApps.some(a =>
      a.entityType === entityType &&
      ['pending', 'approved'].includes(a.status)
    );
  };

  // Better: track applied entity IDs
  const appliedEntityIds = new Set(
    myApps
      .filter(a => ['pending', 'approved'].includes(a.status))
      .map(a => `${a.entityType}:${a.entityName}`)
  );

  const isApplied = (entityType: string, entityName: string) =>
    appliedEntityIds.has(`${entityType}:${entityName}`);

  const handleApply = async (entityType: string, entityId: number) => {
    setApplying(entityId);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Application submitted!');
        // Refresh my applications
        const myRes = await fetch('/api/applications/my', { credentials: 'include' });
        const myData = await myRes.json();
        if (myData.success) setMyApps(myData.data || []);
      } else {
        showToast('error', data.error || 'Failed to apply');
      }
    } catch {
      showToast('error', 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Discover</p>
            <h1>Explore</h1>
            <p className="subtitle">Browse clubs, hackathons, and fests. Apply to join the ones that interest you.</p>
          </div>
        </div>

        <div className="tabs">
          <button className={tab === 'club' ? 'active' : ''} onClick={() => setTab('club')}>Clubs</button>
          <button className={tab === 'hackathon' ? 'active' : ''} onClick={() => setTab('hackathon')}>Hackathons</button>
          <button className={tab === 'fest' ? 'active' : ''} onClick={() => setTab('fest')}>Fests</button>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading...</p>
        ) : (
          <div className="entity-list">
            {tab === 'club' && (clubs.length ? clubs.map(c => (
              <div key={c.id} className="entity-card">
                <h3>{c.name}</h3>
                <p>{c.facultyCoordinator && <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Faculty: {c.facultyCoordinator}</span>}</p>
                <p style={{ fontSize: '0.9rem', color: '#334155', minHeight: '40px' }}>{c.description || 'No description'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.memberCount ?? 0} members</span>
                  {isApplied('club', c.name) ? (
                    <span className="badge badge-pending">Applied</span>
                  ) : (
                    <button className="primary btn-small" disabled={applying === c.id} onClick={() => handleApply('club', c.id)}>
                      {applying === c.id ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            )) : <p className="empty-state">No clubs available.</p>)}

            {tab === 'hackathon' && (hackathons.length ? hackathons.map(h => (
              <div key={h.id} className="entity-card">
                <h3>{h.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {h.startDate && `${new Date(h.startDate).toLocaleDateString()} — ${new Date(h.endDate).toLocaleDateString()}`}
                  {h.maxParticipants && ` · Max ${h.maxParticipants} participants`}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#334155', minHeight: '40px' }}>{h.description || 'No description'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{h.participantCount ?? 0} participants</span>
                  {isApplied('hackathon', h.name) ? (
                    <span className="badge badge-pending">Applied</span>
                  ) : (
                    <button className="primary btn-small" disabled={applying === h.id} onClick={() => handleApply('hackathon', h.id)}>
                      {applying === h.id ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            )) : <p className="empty-state">No hackathons available.</p>)}

            {tab === 'fest' && (fests.length ? fests.map(f => (
              <div key={f.id} className="entity-card">
                <h3>{f.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {f.venue && `Venue: ${f.venue}`}
                  {f.startDate && ` · ${new Date(f.startDate).toLocaleDateString()} — ${new Date(f.endDate).toLocaleDateString()}`}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#334155', minHeight: '40px' }}>{f.description || 'No description'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{f.participantCount ?? 0} participants</span>
                  {isApplied('fest', f.name) ? (
                    <span className="badge badge-pending">Applied</span>
                  ) : (
                    <button className="primary btn-small" disabled={applying === f.id} onClick={() => handleApply('fest', f.id)}>
                      {applying === f.id ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            )) : <p className="empty-state">No fests available.</p>)}
          </div>
        )}
      </div>
    </>
  );
}
