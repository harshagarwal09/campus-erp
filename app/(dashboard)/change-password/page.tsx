'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword) {
      showToast('error', 'All fields are required');
      return;
    }
    if (form.newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Password changed successfully');
        setTimeout(() => router.push('/settings'), 1500);
      } else {
        showToast('error', data.error || 'Failed to change password');
      }
    } catch {
      showToast('error', 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-breadcrumbs">
          <button className="secondary" onClick={() => router.push('/settings')}>
            &larr; Back to Settings
          </button>
        </div>

        <div className="page-header">
          <div>
            <p className="eyebrow">Security</p>
            <h1>Change Password</h1>
            <p className="subtitle">Update your account password. Make sure it&apos;s at least 8 characters.</p>
          </div>
        </div>

        <div className="page-card" style={{ maxWidth: '640px' }}>
          <header><h2>New Password</h2></header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>Current Password</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min 8 characters"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="secondary" onClick={() => router.push('/settings')}>Cancel</button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
