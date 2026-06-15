'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface ClubDetail {
  id: number; name: string; description: string; facultyCoordinator: string;
  memberCount: number; president?: { name: string; email: string; role: string } | null;
}
interface Member { id: number; studentName: string; email: string; role: string; }
interface MyApp { id: number; entityType: string; entityName: string; status: string; }
interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

export default function ClubDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myApps, setMyApps] = useState<MyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchClub = useCallback(async () => {
    setLoading(true);
    try {
      const [clubRes, membersRes, myRes] = await Promise.all([
        fetch(`/api/clubs/${clubId}`, { credentials: 'include' }),
        fetch(`/api/clubs/${clubId}/members`, { credentials: 'include' }),
        fetch('/api/applications/my', { credentials: 'include' }),
      ]);
      const [clubData, membersData, myData] = await Promise.all([
        clubRes.json(), membersRes.json(), myRes.json(),
      ]);
      if (clubData.success) setClub(clubData.data);
      if (membersData.success) setMembers(membersData.data || []);
      if (myData.success) setMyApps(myData.data || []);
    } catch {
      showToast('error', 'Failed to load club details');
    } finally {
      setLoading(false);
    }
  }, [clubId, showToast]);

  useEffect(() => { fetchClub(); }, [fetchClub]);

  const isMember = members.some(m => String(m.studentName) === String(user?.username));
  const hasApplied = myApps.some(a => a.entityType === 'club' && ['pending', 'approved'].includes(a.status) && club && a.entityName === club.name);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'club', entityId: Number(clubId) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Application submitted!');
        const myRes = await fetch('/api/applications/my', { credentials: 'include' });
        const myData = await myRes.json();
        if (myData.success) setMyApps(myData.data || []);
      } else {
        showToast('error', data.error || 'Failed to apply');
      }
    } catch {
      showToast('error', 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading...</p>
        ) : !club ? (
          <div className="page-card"><p className="empty-state">Club not found.</p></div>
        ) : (
          <>
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem', marginBottom: '1rem' }}
            >
              ← Back
            </button>
            <div className="page-header">
              <div>
                <p className="eyebrow">Club</p>
                <h1>{club.name}</h1>
                <p className="subtitle">{club.description || 'No description available.'}</p>
              </div>
              <div className="page-header-actions">
                {isMember ? (
                  <span className="badge badge-approved">Member</span>
                ) : hasApplied ? (
                  <span className="badge badge-pending">Applied</span>
                ) : (
                  <button className="primary" disabled={applying} onClick={handleApply}>
                    {applying ? 'Applying...' : 'Apply to Join'}
                  </button>
                )}
              </div>
            </div>

            <div className="page-card">
              <header><h2>Club Information</h2></header>
              <div className="info-grid">
                <div>
                  <div className="label">Faculty Coordinator</div>
                  <p>{club.facultyCoordinator || '—'}</p>
                </div>
                <div>
                  <div className="label">President</div>
                  <p>{club.president?.name || '—'}</p>
                </div>
                <div>
                  <div className="label">Total Members</div>
                  <p>{club.memberCount ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="page-card">
              <header><h2>Members</h2></header>
              {!members.length ? (
                <p className="empty-state">No members yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th></tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td>{m.studentName}</td>
                          <td>{m.email || '—'}</td>
                          <td><span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>{m.role}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
