import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #eef4fb 0%, #f8fafc 100%)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '6rem', fontWeight: 800, color: '#2563EB', margin: 0, lineHeight: 1 }}>
        404
      </h1>
      <p style={{ fontSize: '1.4rem', color: '#475569', margin: '1rem 0 2rem' }}>
        Page not found — the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-block',
          padding: '14px 28px',
          background: '#2563EB',
          color: '#fff',
          borderRadius: 14,
          fontWeight: 600,
          fontSize: '1rem',
          textDecoration: 'none',
          boxShadow: '0 10px 24px rgba(37,99,235,0.18)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        Go back home
      </Link>
    </div>
  );
}
