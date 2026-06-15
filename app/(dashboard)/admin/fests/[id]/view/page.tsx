'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Fest {
  id: number;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  createdAt: string;
}

export default function ViewFestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [fest, setFest] = useState<Fest | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/fests/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setFest(data.data);
        else setLoadError(data.error || 'Fest not found');
      })
      .catch(() => setLoadError('Failed to load fest'));
  }, [id]);

  if (loadError) {
    return (
      <div className="page">
        <div className="error-banner">{loadError}</div>
        <button className="secondary" onClick={() => router.push('/admin/fests')}>Back</button>
      </div>
    );
  }

  if (!fest) {
    return (
      <div className="page">
        <p style={{ color: '#64748b' }}>Loading fest...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-breadcrumbs">Admin / Fests / View fest</div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Fests</p>
          <h1>{fest.name}</h1>
        </div>
        <div className="page-header-actions">
          <button className="secondary" onClick={() => router.push('/admin/fests')}>Back</button>
          <button className="secondary" onClick={() => router.push(`/admin/fests/${id}/members`)}>Show members</button>
          <button className="primary" onClick={() => router.push(`/admin/fests/${id}/edit`)}>Edit</button>
        </div>
      </div>

      <div className="page-card">
        <div className="info-grid">
          <div>
            <div className="label">Name</div>
            <p>{fest.name}</p>
          </div>
          <div>
            <div className="label">Venue</div>
            <p>{fest.venue || '—'}</p>
          </div>
          <div>
            <div className="label">Start Date</div>
            <p>{fest.startDate ? new Date(fest.startDate).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <div className="label">End Date</div>
            <p>{fest.endDate ? new Date(fest.endDate).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <div className="label">Participants</div>
            <p>{fest.participantCount ?? 0}</p>
          </div>
          <div>
            <div className="label">Created</div>
            <p>{fest.createdAt ? new Date(fest.createdAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {fest.description && (
          <div style={{ marginTop: 20 }}>
            <div className="label" style={{ marginBottom: 6 }}>Description</div>
            <p style={{ color: '#475569', lineHeight: 1.7 }}>{fest.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
