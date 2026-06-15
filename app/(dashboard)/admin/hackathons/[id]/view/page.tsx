'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Hackathon {
  id: number;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  participantCount: number;
  createdAt: string;
}

export default function ViewHackathonPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/hackathons/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setHackathon(data.data);
        else setLoadError(data.error || 'Hackathon not found');
      })
      .catch(() => setLoadError('Failed to load hackathon'));
  }, [id]);

  if (loadError) {
    return (
      <div className="page">
        <div className="error-banner">{loadError}</div>
        <button className="secondary" onClick={() => router.push('/admin/hackathons')}>Back</button>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="page">
        <p style={{ color: '#64748b' }}>Loading hackathon...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-breadcrumbs">Admin / Hackathons / View hackathon</div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Hackathons</p>
          <h1>{hackathon.name}</h1>
        </div>
        <div className="page-header-actions">
          <button className="secondary" onClick={() => router.push('/admin/hackathons')}>Back</button>
          <button className="secondary" onClick={() => router.push(`/admin/hackathons/${id}/members`)}>Show members</button>
          <button className="primary" onClick={() => router.push(`/admin/hackathons/${id}/edit`)}>Edit</button>
        </div>
      </div>

      <div className="page-card">
        <div className="info-grid">
          <div>
            <div className="label">Name</div>
            <p>{hackathon.name}</p>
          </div>
          <div>
            <div className="label">Venue</div>
            <p>{hackathon.venue || '—'}</p>
          </div>
          <div>
            <div className="label">Start Date</div>
            <p>{hackathon.startDate ? new Date(hackathon.startDate).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <div className="label">End Date</div>
            <p>{hackathon.endDate ? new Date(hackathon.endDate).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <div className="label">Max Participants</div>
            <p>{hackathon.maxParticipants ?? '—'}</p>
          </div>
          <div>
            <div className="label">Participants</div>
            <p>{hackathon.participantCount ?? 0}</p>
          </div>
          <div>
            <div className="label">Created</div>
            <p>{hackathon.createdAt ? new Date(hackathon.createdAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {hackathon.description && (
          <div style={{ marginTop: 20 }}>
            <div className="label" style={{ marginBottom: 6 }}>Description</div>
            <p style={{ color: '#475569', lineHeight: 1.7 }}>{hackathon.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
