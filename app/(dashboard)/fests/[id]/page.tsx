'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

interface FestDetail {
  id: number; name: string; description: string; venue: string;
  startDate: string; endDate: string; participantCount: number;
}

interface Member {
  id: number; studentId: number; studentName: string; email: string;
  branch: string; role: string; task: string;
}

interface Student { id: number; name: string; studentId: string; }
interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

const ROLE_OPTIONS = ['Overall Coordinator', 'Technical Lead', 'Cultural Lead', 'Marketing Lead', 'Volunteer'];

export default function FestDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const festId = params.id;

  const [fest, setFest] = useState<FestDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ studentId: '', role: 'Volunteer', task: '' });
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, mRes] = await Promise.all([
        fetch(`/api/fests/${festId}`, { credentials: 'include' }),
        fetch(`/api/fests/${festId}/members`, { credentials: 'include' }),
      ]);
      const [fData, mData] = await Promise.all([fRes.json(), mRes.json()]);
      if (fData.success) setFest(fData.data);
      if (mData.success) setMembers(mData.data || []);
    } catch {
      showToast('error', 'Failed to load fest details');
    } finally {
      setLoading(false);
    }
  }, [festId, showToast]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStudents(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData(); fetchStudents(); }, [fetchData, fetchStudents]);

  const handleAssign = async () => {
    if (!assignForm.studentId || !assignForm.role) {
      showToast('error', 'Student and role are required');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/fests/${festId}/members`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Participant assigned');
        setShowAssignModal(false);
        setAssignForm({ studentId: '', role: 'Volunteer', task: '' });
        fetchData();
      } else {
        showToast('error', data.error || 'Failed to assign');
      }
    } catch { showToast('error', 'Failed to assign participant'); }
    finally { setAssigning(false); }
  };

  const handleRemove = async (studentId: number) => {
    setRemoving(studentId);
    try {
      const res = await fetch(`/api/fests/${festId}/members?userId=${studentId}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.studentId !== studentId));
        showToast('success', 'Participant removed');
      } else {
        showToast('error', data.error || 'Failed to remove');
      }
    } catch { showToast('error', 'Failed to remove participant'); }
    finally { setRemoving(null); }
  };

  const roleBadgeColor = (role: string) =>
    role === 'Overall Coordinator'
      ? { background: '#eff6ff', color: '#2563eb' }
      : { background: '#fef3c7', color: '#b45309' };

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading fest dashboard…</p>
        ) : !fest ? (
          <div className="page-card"><p className="empty-state">Fest not found.</p></div>
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
                <p className="eyebrow">Fest Dashboard</p>
                <h1>{fest.name}</h1>
                <p className="subtitle">{fest.description || 'No description available.'}</p>
              </div>
              <div className="page-header-actions">
                <button className="primary" onClick={() => setShowAssignModal(true)}>+ Assign participant</button>
              </div>
            </div>

            <div className="page-card">
              <header><h2>Fest Information</h2></header>
              <div className="info-grid">
                <div><div className="label">Venue</div><p>{fest.venue || '—'}</p></div>
                <div><div className="label">Start Date</div><p>{fest.startDate ? new Date(fest.startDate).toLocaleDateString() : '—'}</p></div>
                <div><div className="label">End Date</div><p>{fest.endDate ? new Date(fest.endDate).toLocaleDateString() : '—'}</p></div>
                <div><div className="label">Current Participants</div><p>{fest.participantCount ?? members.length}</p></div>
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
                      <tr><th>Name</th><th>Email</th><th>Branch</th><th>Role</th><th>Task</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id}>
                          <td>{m.studentName}</td>
                          <td>{m.email || '—'}</td>
                          <td>{m.branch || '—'}</td>
                          <td><span className="badge" style={roleBadgeColor(m.role)}>{m.role}</span></td>
                          <td>{m.task || '—'}</td>
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
            <h2>Assign participant</h2>
            <p className="muted">Select a student and assign a role in this fest.</p>
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
