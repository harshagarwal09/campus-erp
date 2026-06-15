'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Toast from '@/components/Toast';

interface Member {
  id: number;
  studentId: number;
  studentName: string;
  email: string;
  branch: string;
  role: string;
  task: string;
}

interface Student {
  id: number;
  name: string;
  studentId: string;
}

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

const ROLE_OPTIONS = ['Lead', 'Coordinator', 'Volunteer', 'Participant'];

export default function ViewHackathonMembersPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ studentId: '', role: 'Participant', task: '' });
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${id}/members`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setMembers(data.data || []);
    } catch {
      showToast('error', 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStudents(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchMembers(); fetchStudents(); }, [fetchMembers, fetchStudents]);

  const handleAssign = async () => {
    if (!assignForm.studentId || !assignForm.role) {
      showToast('error', 'Student and role are required');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/hackathons/${id}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Participant assigned');
        setShowAssignModal(false);
        setAssignForm({ studentId: '', role: 'Participant', task: '' });
        fetchMembers();
      } else {
        showToast('error', data.error || 'Failed to assign participant');
      }
    } catch {
      showToast('error', 'Failed to assign participant');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (studentId: number) => {
    setRemoving(studentId);
    try {
      const res = await fetch(`/api/hackathons/${id}/members?userId=${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.studentId !== studentId));
        showToast('success', 'Member removed');
      } else {
        showToast('error', data.error || 'Failed to remove member');
      }
    } catch {
      showToast('error', 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const roleBadgeColor = (role: string) => {
    if (role === 'Lead') return { background: '#eff6ff', color: '#2563eb' };
    return { background: '#f0fdf4', color: '#16a34a' };
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Hackathons</p>
            <h1>Hackathon Participants</h1>
            <p className="subtitle">Manage participants of this hackathon.</p>
          </div>
          <div className="page-header-actions">
            <button className="secondary" onClick={() => router.push(`/admin/hackathons/${id}/view`)}>Back</button>
            <button className="primary" onClick={() => setShowAssignModal(true)}>+ Assign participant</button>
          </div>
        </div>

        <div className="page-card">
          {loading ? (
            <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading participants...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>Role</th>
                    <th>Task</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length ? (
                    members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.studentName}</td>
                        <td>{member.email}</td>
                        <td>{member.branch || '—'}</td>
                        <td>
                          <span className="badge" style={roleBadgeColor(member.role)}>{member.role}</span>
                        </td>
                        <td>{member.task || '—'}</td>
                        <td className="actions">
                          <button className="btn-small btn-danger" onClick={() => handleRemove(member.studentId)} disabled={removing === member.studentId}>
                            {removing === member.studentId ? 'Removing...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="empty-state">No participants found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && (
        <div className="overlay">
          <div className="modal">
            <h2>Assign participant</h2>
            <p className="muted">Select a student and assign a role in this hackathon.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <div>
                <label>Student *</label>
                <select value={assignForm.studentId} onChange={(e) => setAssignForm((p) => ({ ...p, studentId: e.target.value }))}>
                  <option value="">Select a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                  ))}
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
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
