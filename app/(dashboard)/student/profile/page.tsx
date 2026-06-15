'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

const READ_ONLY_FIELDS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'name', label: 'Full Name' },
  { key: 'roll', label: 'Roll Number' },
  { key: 'branch', label: 'Branch' },
  { key: 'enrollmentYear', label: 'Enrollment Year' },
  { key: 'cgpa', label: 'CGPA' },
  { key: 'backlogs', label: 'Backlogs' },
  { key: 'attendancePercentage', label: 'Attendance %' },
  { key: 'semester', label: 'Semester' },
  { key: 'batch', label: 'Batch' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'section', label: 'Section' },
];

const EDITABLE_FIELDS = [
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'dob', label: 'Date of Birth', type: 'date' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', type: 'url' },
  { key: 'githubUrl', label: 'GitHub URL', type: 'url' },
  { key: 'skills', label: 'Skills', type: 'text' },
  { key: 'interests', label: 'Interests', type: 'text' },
  { key: 'bloodGroup', label: 'Blood Group', type: 'text' },
  { key: 'availability', label: 'Availability', type: 'text' },
  { key: 'lookingForTeam', label: 'Looking for Team', type: 'select', options: ['true', 'false'] },
];

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students/me', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setStudent(data.data);
        const f: Record<string, any> = {};
        EDITABLE_FIELDS.forEach(ef => { f[ef.key] = data.data[ef.key] ?? ''; });
        setForm(f);
      } else {
        showToast('error', data.error || 'Failed to load profile');
      }
    } catch {
      showToast('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      EDITABLE_FIELDS.forEach(ef => { payload[ef.key] = form[ef.key] || null; });
      if (payload.lookingForTeam !== undefined) {
        payload.lookingForTeam = payload.lookingForTeam === 'true' || payload.lookingForTeam === true;
      }

      const res = await fetch('/api/students/me', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Profile updated');
        setEditing(false);
        fetchProfile();
      } else {
        showToast('error', data.error || 'Update failed');
      }
    } catch {
      showToast('error', 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h1>My Profile</h1>
            <p className="subtitle">View and manage your student information.</p>
          </div>
          {!editing && (
            <button className="primary" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading profile...</p>
        ) : !student ? (
          <div className="page-card"><p className="empty-state">Student profile not found.</p></div>
        ) : (
          <>
            {/* Read-Only Section */}
            <div className="page-card profile-card">
              <header><h2>Student Information (Read-Only)</h2></header>
              <div className="profile-grid">
                {READ_ONLY_FIELDS.map(f => (
                  <div key={f.key}>
                    <h3>{f.label}</h3>
                    <p>{student[f.key] != null ? String(student[f.key]) : '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Section */}
            <div className="page-card profile-card">
              <header>
                <h2>{editing ? 'Edit Your Information' : 'Your Information'}</h2>
              </header>
              {editing ? (
                <>
                  <div className="form-grid">
                    {EDITABLE_FIELDS.map(ef => (
                      <div key={ef.key} className="form-field">
                        <label>{ef.label}</label>
                        {ef.type === 'select' ? (
                          <select
                            value={String(form[ef.key] ?? '')}
                            onChange={e => setForm(p => ({ ...p, [ef.key]: e.target.value }))}
                          >
                            <option value="">—</option>
                            {ef.options?.map(opt => (
                              <option key={opt} value={opt}>{opt === 'true' ? 'Yes' : 'No'}</option>
                            ))}
                          </select>
                        ) : ef.key === 'skills' || ef.key === 'interests' || ef.key === 'address' ? (
                          <textarea
                            value={form[ef.key] ?? ''}
                            onChange={e => setForm(p => ({ ...p, [ef.key]: e.target.value }))}
                            rows={2}
                          />
                        ) : (
                          <input
                            type={ef.type}
                            value={form[ef.key] ?? ''}
                            onChange={e => setForm(p => ({ ...p, [ef.key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button type="button" className="secondary" onClick={() => { setEditing(false); fetchProfile(); }}>
                      Cancel
                    </button>
                    <button type="button" className="primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="profile-grid">
                  {EDITABLE_FIELDS.map(ef => (
                    <div key={ef.key}>
                      <h3>{ef.label}</h3>
                      <p>{ef.key === 'lookingForTeam'
                        ? (student[ef.key] ? 'Yes' : 'No')
                        : (student[ef.key] || '—')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
