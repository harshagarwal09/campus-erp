'use client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatWithInitials(name: string): string {
  const initials = getInitials(name);
  return initials ? `[${initials}] ${name}` : name || '';
}

function formatDob(d: unknown): string {
  if (!d) return '';
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentRow {
  id: number;
  studentId: string;
  name: string;
  email: string;
  roll: string;
  branch: string;
  phone: string;
  gender: string;
  semester: number | null;
  batch: string;
  availability: string;
  dob: string;
  city: string;
  state: string;
  cgpa: string | number;
  enrollmentYear: string | number;
  guardianPhone: string;
  [key: string]: unknown;
}

interface Props {
  students: StudentRow[];
  onEdit: (student: StudentRow) => void;
  onDelete: (student: StudentRow) => void;
  /** Show a role badge column — pass false to hide */
  showRoleBadge?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentTable({ students, onEdit, onDelete, showRoleBadge = false }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Roll No.</th>
            <th>Branch</th>
            <th>Phone</th>
            <th>Gender</th>
            <th>Semester</th>
            <th>Batch</th>
            <th>Availability</th>
            <th>DOB</th>
            <th>City</th>
            <th>State</th>
            <th>CGPA</th>
            <th>Enrollment Year</th>
            <th>Guardian Phone</th>
            {showRoleBadge && <th>Role</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length ? (
            students.map((student) => (
              <tr key={student.id}>
                <td>{student.studentId}</td>
                <td>{formatWithInitials(student.name)}</td>
                <td>{student.email}</td>
                <td>{student.roll}</td>
                <td>{student.branch}</td>
                <td>{student.phone}</td>
                <td>{student.gender || '—'}</td>
                <td>{student.semester ?? '—'}</td>
                <td>{student.batch || '—'}</td>
                <td>{student.availability || '—'}</td>
                <td>{formatDob(student.dob)}</td>
                <td>{student.city}</td>
                <td>{student.state}</td>
                <td>{student.cgpa}</td>
                <td>{student.enrollmentYear}</td>
                <td>{student.guardianPhone || '—'}</td>
                {showRoleBadge && (
                  <td>
                    <span className="badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      {String(student.role || '')}
                    </span>
                  </td>
                )}
                <td className="actions">
                  <button className="btn-small" onClick={() => onEdit(student)}>Edit</button>
                  <button className="btn-small btn-danger" onClick={() => onDelete(student)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showRoleBadge ? 18 : 17} className="empty-state">
                No students match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
