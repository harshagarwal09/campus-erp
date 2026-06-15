'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Toast from '@/components/Toast';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function EditFestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [form, setForm] = useState({
    name: '', description: '', venue: '', startDate: '', endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/fests/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const d = data.data;
          setForm({
            name: d.name || '',
            description: d.description || '',
            venue: d.venue || '',
            startDate: d.startDate ? String(d.startDate).slice(0, 10) : '',
            endDate: d.endDate ? String(d.endDate).slice(0, 10) : '',
          });
        } else {
          setLoadError(data.error || 'Fest not found');
        }
      })
      .catch(() => setLoadError('Failed to load fest'));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Fest name is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/fests/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Fest updated successfully');
        setTimeout(() => router.push('/admin/fests'), 900);
      } else {
        const firstErr = data.data?.errors
          ? Object.values(data.data.errors as Record<string, string>)[0]
          : data.error;
        showToast('error', firstErr || 'Failed to update fest');
      }
    } catch {
      showToast('error', 'Failed to update fest');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="page">
        <div className="error-banner">{loadError}</div>
        <button className="secondary" onClick={() => router.push('/admin/fests')}>Back</button>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="page">
        <div className="page-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Fests</p>
            <h1>Edit fest</h1>
            <p className="subtitle">Update the fest details below.</p>
          </div>
          <button className="secondary" onClick={() => router.push('/admin/fests')}>Back</button>
        </div>

        <div className="page-card full-width">
          <div className="form-section">
            <h3 className="section-title">Fest Details</h3>
            <div className="form-grid full-width">
              <div className="form-field">
                <label>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter fest name" />
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
              <div className="form-field full-width">
                <label>Description</label>
                <textarea name="description" rows={4} value={form.description} onChange={handleChange} placeholder="Describe the fest..." />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" className="secondary" onClick={() => router.push('/admin/fests')}>Cancel</button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
