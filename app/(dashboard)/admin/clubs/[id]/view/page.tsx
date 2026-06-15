'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Club {
  id: number;
  name: string;
  description: string;
  facultyCoordinator: string;
  memberCount: number;
  president: { name: string; email: string } | null;
  createdAt: string;
}

export default function ViewClubPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [club, setClub] = useState<Club | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/clubs/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setClub(data.data);
        else setLoadError(data.error || 'Club not found');
      })
      .catch(() => setLoadError('Failed to load club'));
  }, [id]);

  if (loadError) {
    return (
      <div className="page">
        <div className="error-banner">{loadError}</div>
        <button className="secondary" onClick={() => router.push('/admin/clubs')}>Back</button>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="page">
        <p style={{ color: '#64748b' }}>Loading club...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-breadcrumbs">Admin / Clubs / View club</div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clubs</p>
          <h1>{club.name}</h1>
        </div>
        <div className="page-header-actions">
          <button className="secondary" onClick={() => router.push('/admin/clubs')}>Back</button>
          <button className="secondary" onClick={() => router.push(`/admin/clubs/${id}/members`)}>Show members</button>
          <button className="primary" onClick={() => router.push(`/admin/clubs/${id}/edit`)}>Edit</button>
        </div>
      </div>

      <div className="page-card">
        <div className="info-grid">
          <div>
            <div className="label">Name</div>
            <p>{club.name}</p>
          </div>
          <div>
            <div className="label">Faculty Coordinator</div>
            <p>{club.facultyCoordinator || '—'}</p>
          </div>
          <div>
            <div className="label">President</div>
            <p>{club.president?.name || '—'}</p>
          </div>
          <div>
            <div className="label">Member Count</div>
            <p>{club.memberCount ?? 0}</p>
          </div>
          <div>
            <div className="label">Created</div>
            <p>{club.createdAt ? new Date(club.createdAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {club.description && (
          <div style={{ marginTop: 20 }}>
            <div className="label" style={{ marginBottom: 6 }}>Description</div>
            <p style={{ color: '#475569', lineHeight: 1.7 }}>{club.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
