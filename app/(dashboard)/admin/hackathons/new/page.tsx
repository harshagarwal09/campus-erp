'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function CreateHackathonPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });
  const [form, setForm] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Hackathon name is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const res = await fetch('/api/hackathons', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Hackathon created successfully');
        setTimeout(() => router.push('/admin/hackathons'), 900);
      } else {
        const firstErr = data.data?.errors
          ? Object.values(data.data.errors as Record<string, string>)[0]
          : data.error;
        showToast('error', firstErr || 'Failed to create hackathon');
      }
    } catch {
      showToast('error', 'Failed to create hackathon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="page">
        <div className="page-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Hackathons</p>
            <h1>Create a new hackathon</h1>
            <p className="subtitle">Fill in the details to register a new hackathon.</p>
          </div>
          <button className="secondary" onClick={() => router.push('/admin/hackathons')}>Back</button>
        </div>

        <div className="page-card full-width">
          <div className="form-section">
            <h3 className="section-title">Hackathon Details</h3>
            <div className="form-grid full-width">
              <div className="form-field">
                <label>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter hackathon name" />
                {errors.name && <div className="field-error">{errors.name}</div>}
              </div>
              <div className="form-field">
                <label>Venue</label>
                <input name="venue" value={form.venue} onChange={handleChange} placeholder="Enter venue" />
              </div>
              <div className="form-field">
                <label>Start Date</label>
                <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>End Date</label>
                <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Max Participants</label>
                <input name="maxParticipants" type="number" value={form.maxParticipants} onChange={handleChange} placeholder="e.g., 100" />
              </div>
              <div className="form-field full-width">
                <label>Description</label>
                <textarea name="description" rows={4} value={form.description} onChange={handleChange} placeholder="Describe the hackathon..." />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" className="secondary" onClick={() => router.push('/admin/hackathons')}>Cancel</button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Hackathon'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
