'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface HackathonDetail {
  id: number; name: string; description: string; startDate: string; endDate: string;
  maxParticipants: number; participantCount: number; venue?: string;
}
interface Member { id: number; studentName: string; email: string; role: string; }
interface MyApp { id: number; entityType: string; entityName: string; status: string; }
interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

export default function HackathonDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [hackathon, setHackathon] = useState<HackathonDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myApps, setMyApps] = useState<MyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchHackathon = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, mRes, myRes] = await Promise.all([
        fetch(`/api/hackathons/${hackathonId}`, { credentials: 'include' }),
        fetch(`/api/hackathons/${hackathonId}/members`, { credentials: 'include' }),
        fetch('/api/applications/my', { credentials: 'include' }),
      ]);
      const [hData, mData, myData] = await Promise.all([hRes.json(), mRes.json(), myRes.json()]);
      if (hData.success) setHackathon(hData.data);
      if (mData.success) setMembers(mData.data || []);
      if (myData.success) setMyApps(myData.data || []);
    } catch {
      showToast('error', 'Failed to load hackathon details');
    } finally {
      setLoading(false);
    }
  }, [hackathonId, showToast]);

  useEffect(() => { fetchHackathon(); }, [fetchHackathon]);

  const isMember = members.some(m => String(m.studentName) === String(user?.username));
  const hasApplied = myApps.some(a => a.entityType === 'hackathon' && ['pending', 'approved'].includes(a.status) && hackathon && a.entityName === hackathon.name);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'hackathon', entityId: Number(hackathonId) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Registration submitted!');
        const myRes = await fetch('/api/applications/my', { credentials: 'include' });
        const myData = await myRes.json();
        if (myData.success) setMyApps(myData.data || []);
      } else {
        showToast('error', data.error || 'Failed to register');
      }
    } catch {
      showToast('error', 'Failed to register');
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
        ) : !hackathon ? (
          <div className="page-card"><p className="empty-state">Hackathon not found.</p></div>
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
                <p className="eyebrow">Hackathon</p>
                <h1>{hackathon.name}</h1>
                <p className="subtitle">{hackathon.description || 'No description available.'}</p>
              </div>
              <div className="page-header-actions">
                {isMember ? (
                  <span className="badge badge-approved">Registered</span>
                ) : hasApplied ? (
                  <span className="badge badge-pending">Applied</span>
                ) : (
                  <button className="primary" disabled={applying} onClick={handleApply}>
                    {applying ? 'Registering...' : 'Register'}
                  </button>
                )}
              </div>
            </div>

            <div className="page-card">
              <header><h2>Hackathon Information</h2></header>
              <div className="info-grid">
                <div>
                  <div className="label">Start Date</div>
                  <p>{hackathon.startDate ? new Date(hackathon.startDate).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <div className="label">End Date</div>
                  <p>{hackathon.endDate ? new Date(hackathon.endDate).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <div className="label">Max Participants</div>
                  <p>{hackathon.maxParticipants || 'Unlimited'}</p>
                </div>
                <div>
                  <div className="label">Current Participants</div>
                  <p>{hackathon.participantCount ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="page-card">
              <header><h2>Participants</h2></header>
              {!members.length ? (
                <p className="empty-state">No participants yet.</p>
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
