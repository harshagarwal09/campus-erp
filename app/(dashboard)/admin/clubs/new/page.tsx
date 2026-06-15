'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function CreateClubPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });
  const [form, setForm] = useState({ name: '', description: '', facultyCoordinator: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Club name is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Club created successfully');
        setTimeout(() => router.push('/admin/clubs'), 900);
      } else {
        const firstErr = data.data?.errors
          ? Object.values(data.data.errors as Record<string, string>)[0]
          : data.error;
        showToast('error', firstErr || 'Failed to create club');
      }
    } catch {
      showToast('error', 'Failed to create club');
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
            <p className="eyebrow">Clubs</p>
            <h1>Create a new club</h1>
            <p className="subtitle">Fill in the details to register a new campus club.</p>
          </div>
          <button className="secondary" onClick={() => router.push('/admin/clubs')}>Back</button>
        </div>

        <div className="page-card full-width">
          <div className="form-section">
            <h3 className="section-title">Club Details</h3>
            <div className="form-grid full-width">
              <div className="form-field">
                <label>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter club name" />
                {errors.name && <div className="field-error">{errors.name}</div>}
              </div>
              <div className="form-field">
                <label>Faculty Coordinator</label>
                <input name="facultyCoordinator" value={form.facultyCoordinator} onChange={handleChange} placeholder="Enter faculty coordinator name" />
              </div>
              <div className="form-field full-width">
                <label>Description</label>
                <textarea name="description" rows={4} value={form.description} onChange={handleChange} placeholder="Describe the club..." />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" className="secondary" onClick={() => router.push('/admin/clubs')}>Cancel</button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
