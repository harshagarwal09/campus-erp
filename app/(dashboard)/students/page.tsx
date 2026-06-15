'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import StudentTable from '@/components/StudentTable';
import Toast from '@/components/Toast';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  roll: string;
  branch: string;
  city: string;
  state: string;
  cgpa: string | number;
  enrollmentYear: string | number;
  phone: string;
  gender: string;
  semester: number | null;
  batch: string;
  availability: string;
  dob: string;
  guardianPhone: string;
  [key: string]: unknown;
}

interface Toast {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ studentId: '', branch: '', city: '', year: '' });
  const [sortBy, setSortBy] = useState({ field: 'name', direction: 'asc' });
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast>({ visible: false, type: 'info', message: '' });

  const showToast = useCallback((type: Toast['type'], message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3500);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStudents(data.data || []);
    } catch {
      showToast('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const updateFilter = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSortDirection = (field: string) => {
    setSortBy((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  };

  // ── Derived filter options ─────────────────────────────────────────────────
  const branchOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.branch).filter(Boolean))).sort(),
    [students]
  );
  const cityOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.city).filter(Boolean))).sort(),
    [students]
  );
  const yearOptions = useMemo(
    () => Array.from(new Set(students.map((s) => String(s.enrollmentYear)).filter((v) => v && v !== 'null'))).sort(),
    [students]
  );

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filteredSorted = useMemo(() => {
    let list = students.filter((s) => {
      const q = filters.studentId.trim().toLowerCase();
      const matchId = !q || s.studentId?.toLowerCase().includes(q);
      const matchBranch = !filters.branch || s.branch === filters.branch;
      const matchCity = !filters.city || s.city === filters.city;
      const matchYear = !filters.year || String(s.enrollmentYear) === filters.year;
      return matchId && matchBranch && matchCity && matchYear;
    });

    const dir = sortBy.direction === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortBy.field === 'name') return dir * ((a.name || '').localeCompare(b.name || ''));
      if (sortBy.field === 'cgpa') return dir * ((parseFloat(String(a.cgpa)) || 0) - (parseFloat(String(b.cgpa)) || 0));
      if (sortBy.field === 'year') return dir * ((Number(a.enrollmentYear) || 0) - (Number(b.enrollmentYear) || 0));
      return 0;
    });
    return list;
  }, [students, filters, sortBy]);

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDelete = (student: Student) => setDeleteTarget(student);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        showToast('success', 'Student deleted');
      } else {
        showToast('error', data.error || 'Delete failed');
      }
    } catch {
      showToast('error', 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Student records</p>
            <h1>Manage student profiles</h1>
            <p className="subtitle">
              Quickly add, edit, and review student details with a clean dashboard experience.
            </p>
          </div>
          {user?.role === 'ADMIN' && (
            <button className="primary" onClick={() => router.push('/students/new')}>
              + Add Student
            </button>
          )}
        </div>

        <div className="page-card">
          <header>
            <div>
              <h2>Student list</h2>
              <p className="subtitle">
                Search and filter student profiles with exact ID search plus branch, city, and year filters.
              </p>
            </div>
          </header>

          {/* Filters */}
          <div className="filter-grid">
            <div className="filter-field">
              <label>Student ID</label>
              <input
                type="search"
                placeholder="Search by student ID"
                value={filters.studentId}
                onChange={(e) => updateFilter('studentId', e.target.value)}
              />
            </div>
            <div className="filter-field">
              <label>Branch</label>
              <select value={filters.branch} onChange={(e) => updateFilter('branch', e.target.value)}>
                <option value="">All branches</option>
                {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>City</label>
              <select value={filters.city} onChange={(e) => updateFilter('city', e.target.value)}>
                <option value="">All cities</option>
                {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Enrollment Year</label>
              <select value={filters.year} onChange={(e) => updateFilter('year', e.target.value)}>
                <option value="">All years</option>
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Sort controls */}
          <div className="sort-row">
            <div className="sort-actions">
              <span>Sort by:</span>
              <select value={sortBy.field} onChange={(e) => toggleSortDirection(e.target.value)}>
                <option value="name">Name</option>
                <option value="cgpa">CGPA</option>
                <option value="year">Enrollment Year</option>
              </select>
              <button type="button" className="secondary" onClick={() => toggleSortDirection(sortBy.field)}>
                {sortBy.direction === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>Loading students…</p>
          ) : (
            <StudentTable
              students={filteredSorted}
              onEdit={(s) => router.push(`/students/${s.id}/edit`)}
              onDelete={handleDelete}
              showRoleBadge={false}
            />
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="overlay">
          <div className="modal">
            <h2>Confirm delete</h2>
            <p>Delete <strong>{deleteTarget.name}</strong>? The student will be moved to trash.</p>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
