'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/Toast';

interface ToastState { visible: boolean; type: 'success' | 'error' | 'info'; message: string }

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setProfile(data.data);
    } catch {
      showToast('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return (
    <>
      <Toast toast={toast} />
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1>Settings</h1>
            <p className="subtitle">View your account information and manage your password.</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading...</p>
        ) : (
          <>
            <div className="page-card">
              <header><h2>Account Information</h2></header>
              <div className="info-grid">
                <div>
                  <div className="label">Username</div>
                  <p>{profile?.username || user?.username || '—'}</p>
                </div>
                <div>
                  <div className="label">Email</div>
                  <p>{profile?.email || user?.email || '—'}</p>
                </div>
                <div>
                  <div className="label">Role</div>
                  <p><span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>{profile?.role || user?.role}</span></p>
                </div>
                <div>
                  <div className="label">Entity</div>
                  <p>{profile?.entityType ? `${profile.entityType} #${profile.entityId ?? ''}` : '—'}</p>
                </div>
                <div>
                  <div className="label">Member Since</div>
                  <p>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>

            <div className="page-card">
              <header><h2>Security</h2></header>
              <p style={{ color: '#475569', marginBottom: '16px' }}>
                Change your password regularly to keep your account secure.
              </p>
              <button className="primary" onClick={() => router.push('/change-password')}>
                Change Password
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
