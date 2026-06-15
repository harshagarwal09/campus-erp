'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', color: '#0f172a', margin: 0 }}>403 — Unauthorized</h1>
      <p style={{ color: '#64748b', margin: 0 }}>
        You don&apos;t have permission to access this page.
      </p>
      <Link
        href="/login"
        style={{
          color: '#2563eb',
          fontWeight: 600,
          textDecoration: 'underline',
        }}
      >
        Back to login
      </Link>
    </div>
  );
}
