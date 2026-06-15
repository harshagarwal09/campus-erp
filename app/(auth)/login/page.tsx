'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const { login, isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to proper home
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const dest = user.role === 'STUDENT' ? '/student/profile' : '/dashboard';
      router.replace(dest);
    }
  }, [loading, isAuthenticated, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedUser = await login(username, password);
      if (loggedUser.requiresPasswordChange) {
        router.push('/change-password');
      } else {
        const dest = loggedUser.role === 'STUDENT' ? '/student/profile' : '/dashboard';
        router.push(dest);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <p style={{ textAlign: 'center', color: '#64748b' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <h1>Campus ERP</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={submitting}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={submitting}
            />
          </div>

          <button type="submit" disabled={submitting} className={styles.loginBtn}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
