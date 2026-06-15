'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

interface ClubDetail {
  id: number; name: string; description: string; facultyCoordinator: string;
  memberCount: number;
  president?: { name: string; email: string; role: string } | null;
}

interface Member {
  id: number; studentId: number; studentName: string; email: string;
  branch: string; role: string; task: string; joinedAt: string;
}

interface Student { id: number; name: string; studentId: string; }
interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

const ROLE_OPTIONS = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Coordinator', 'Member'];

export default function ClubDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clubId = params.id;

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ studentId: '', role: 'Member', task: '' });
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchClub = useCallback(async () => {
    setLoading(true);
    try {
      const [clubRes, membersRes] = await Promise.all([
        fetch(`/api/clubs/${clubId}`, { credentials: 'include' }),
        fetch(`/api/clubs/${clubId}/members`, { credentials: 'include' }),
      ]);
      const [clubData, membersData] = await Promise.all([clubRes.json(), membersRes.json()]);
      if (clubData.success) setClub(clubData.data);
      if (membersData.success) setMembers(membersData.data || []);
    } catch {
      showToast('error', 'Failed to load club details');
    } finally {
      setLoading(false);
    }
  }, [clubId, showToast]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStudents(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchClub(); fetchStudents(); }, [fetchClub, fetchStudents]);

  const handleAssign = async () => {
    if (!assignForm.studentId || !assignForm.role) {
      showToast('error', 'Student and role are required');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Member assigned');
        setShowAssignModal(false);
        setAssignForm({ studentId: '', role: 'Member', task: '' });
        fetchClub();
      } else {
        showToast('error', data.error || 'Failed to assign');
      }
    } catch { showToast('error', 'Failed to assign member'); }
    finally { setAssigning(false); }
  };

  const handleRemove = async (studentId: number) => {
    setRemoving(studentId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members?userId=${studentId}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.studentId !== studentId));
        showToast('success', 'Member removed');
      } else {
        showToast('error', data.error || 'Failed to remove');
      }
    } catch { showToast('error', 'Failed to remove member'); }
    finally { setRemoving(null); }
  };

  const roleBadgeColor = (role: string) =>
    role === 'President'
      ? { background: '#eff6ff', color: '#2563eb' }
      : { background: '#f0fdf4', color: '#16a34a' };

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading club dashboard…</p>
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
                <p className="eyebrow">Club Dashboard</p>
                <h1>{club.name}</h1>
                <p className="subtitle">{club.description || 'No description available.'}</p>
              </div>
              <div className="page-header-actions">
                <button className="primary" onClick={() => setShowAssignModal(true)}>+ Assign member</button>
              </div>
            </div>

            <div className="page-card">
              <header><h2>Club Information</h2></header>
              <div className="info-grid">
                <div><div className="label">Faculty Coordinator</div><p>{club.facultyCoordinator || '—'}</p></div>
                <div><div className="label">President</div><p>{club.president?.name || '—'}</p></div>
                <div><div className="label">Total Members</div><p>{club.memberCount ?? members.length}</p></div>
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
                      <tr><th>Name</th><th>Email</th><th>Branch</th><th>Role</th><th>Task</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id}>
                          <td>{m.studentName}</td>
                          <td>{m.email || '—'}</td>
                          <td>{m.branch || '—'}</td>
                          <td><span className="badge" style={roleBadgeColor(m.role)}>{m.role}</span></td>
                          <td>{m.task || '—'}</td>
                          <td>{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}</td>
                          <td className="actions">
                            <button className="btn-small btn-danger" onClick={() => handleRemove(m.studentId)} disabled={removing === m.studentId}>
                              {removing === m.studentId ? 'Removing…' : 'Remove'}
                            </button>
                          </td>
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

      {showAssignModal && (
        <div className="overlay">
          <div className="modal">
            <h2>Assign member</h2>
            <p className="muted">Select a student and assign a role in this club.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <div>
                <label>Student *</label>
                <select value={assignForm.studentId} onChange={(e) => setAssignForm((p) => ({ ...p, studentId: e.target.value }))}>
                  <option value="">Select a student…</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>)}
                </select>
              </div>
              <div>
                <label>Role *</label>
                <select value={assignForm.role} onChange={(e) => setAssignForm((p) => ({ ...p, role: e.target.value }))}>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label>Task <span className="optional-meta">(optional)</span></label>
                <input value={assignForm.task} onChange={(e) => setAssignForm((p) => ({ ...p, task: e.target.value }))} placeholder="Optional task description" />
              </div>
            </div>
            <div className="form-actions">
              <button className="secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="primary" onClick={handleAssign} disabled={assigning}>
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
