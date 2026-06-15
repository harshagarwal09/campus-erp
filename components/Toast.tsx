'use client';

export interface ToastProps {
  toast: {
    visible: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  };
}

export default function Toast({ toast }: ToastProps) {
  if (!toast?.visible) return null;
  return (
    <div className={`toast ${toast.type || 'info'}`} role="alert">
      {toast.message}
    </div>
  );
}
