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
  joinedAt: string;
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

const ROLE_OPTIONS = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Coordinator', 'Member'];

export default function ViewClubMembersPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

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

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${id}/members`, { credentials: 'include' });
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
    } catch {
      // Silent fail — students dropdown optional
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchStudents();
  }, [fetchMembers, fetchStudents]);

  const handleAssign = async () => {
    if (!assignForm.studentId || !assignForm.role) {
      showToast('error', 'Student and role are required');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/clubs/${id}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Member assigned');
        setShowAssignModal(false);
        setAssignForm({ studentId: '', role: 'Member', task: '' });
        fetchMembers();
      } else {
        showToast('error', data.error || 'Failed to assign member');
      }
    } catch {
      showToast('error', 'Failed to assign member');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (studentId: number) => {
    setRemoving(studentId);
    try {
      const res = await fetch(`/api/clubs/${id}/members?userId=${studentId}`, {
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
    if (role === 'President') return { background: '#eff6ff', color: '#2563eb' };
    return { background: '#f0fdf4', color: '#16a34a' };
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Clubs</p>
            <h1>Club Members</h1>
            <p className="subtitle">Manage members of this club.</p>
          </div>
          <div className="page-header-actions">
            <button className="secondary" onClick={() => router.push(`/admin/clubs/${id}/view`)}>Back</button>
            <button className="primary" onClick={() => setShowAssignModal(true)}>+ Assign member</button>
          </div>
        </div>

        <div className="page-card">
          {loading ? (
            <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading members...</p>
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
                    <th>Joined</th>
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
                          <span className="badge" style={roleBadgeColor(member.role)}>
                            {member.role}
                          </span>
                        </td>
                        <td>{member.task || '—'}</td>
                        <td>{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}</td>
                        <td className="actions">
                          <button
                            className="btn-small btn-danger"
                            onClick={() => handleRemove(member.studentId)}
                            disabled={removing === member.studentId}
                          >
                            {removing === member.studentId ? 'Removing...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="empty-state">No members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign member modal */}
      {showAssignModal && (
        <div className="overlay">
          <div className="modal">
            <h2>Assign member</h2>
            <p className="muted">Select a student and assign a role in this club.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <div>
                <label>Student *</label>
                <select
                  value={assignForm.studentId}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, studentId: e.target.value }))}
                >
                  <option value="">Select a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Role *</label>
                <select
                  value={assignForm.role}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Task <span className="optional-meta">(optional)</span></label>
                <input
                  value={assignForm.task}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, task: e.target.value }))}
                  placeholder="Optional task description"
                />
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
