'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StudentFormPage from '@/components/StudentFormPage';
import Toast from '@/components/Toast';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/students/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          // Normalise dob to YYYY-MM-DD
          const s = { ...data.data };
          if (s.dob && typeof s.dob === 'string') s.dob = s.dob.slice(0, 10);
          setStudent(s);
        } else {
          setLoadError(data.error || 'Student not found');
        }
      })
      .catch(() => setLoadError('Failed to load student'));
  }, [id]);

  const handleSave = async (formData: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Student updated successfully');
        setTimeout(() => router.push('/students'), 900);
      } else {
        const firstErr = data.data?.errors
          ? Object.values(data.data.errors as Record<string, string>)[0]
          : data.error;
        showToast('error', firstErr || 'Failed to update student');
      }
    } catch {
      showToast('error', 'Failed to update student');
    }
  };

  if (loadError) {
    return (
      <div className="page">
        <div className="error-banner">{loadError}</div>
        <button className="secondary" onClick={() => router.push('/students')}>Back</button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page">
        <p style={{ color: '#64748b' }}>Loading student…</p>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} />
      <StudentFormPage
        editingStudent={student}
        onSave={handleSave}
        onClose={() => router.push('/students')}
      />
    </>
  );
}
