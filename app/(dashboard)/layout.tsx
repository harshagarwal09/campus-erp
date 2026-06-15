'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="app-header">
          <div>
            <p className="eyebrow">Campus ERP</p>
            <h1>Welcome back, {user.username}</h1>
          </div>
          <div className="header-actions">
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(37,99,235,0.08)',
                color: '#2563eb',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {user.role}
            </span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
