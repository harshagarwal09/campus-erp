'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StudentFormPage from '@/components/StudentFormPage';
import Toast from '@/components/Toast';

interface ToastState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' });

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Student created successfully');
        setTimeout(() => router.push('/students'), 900);
      } else {
        const firstErr = data.data?.errors
          ? Object.values(data.data.errors as Record<string, string>)[0]
          : data.error;
        showToast('error', firstErr || 'Failed to create student');
      }
    } catch {
      showToast('error', 'Failed to create student');
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <StudentFormPage
        editingStudent={null}
        onSave={handleSave}
        onClose={() => router.push('/students')}
      />
    </>
  );
}
