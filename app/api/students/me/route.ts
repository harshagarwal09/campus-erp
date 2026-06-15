import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

async function requireAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

const EDITABLE_FIELDS = [
  'email', 'phone', 'dob', 'address', 'city', 'state',
  'skills', 'interests', 'linkedinUrl', 'githubUrl',
  'bloodGroup', 'availability', 'lookingForTeam',
];

// ─── GET /api/students/me ─────────────────────────────────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let sid = user.studentId ? Number(user.studentId) : null;
    if (!sid) {
      const [urows] = await pool.query(
        'SELECT studentId FROM users WHERE id = ? AND role = ?',
        [user.id, 'STUDENT']
      ) as any[];
      sid = urows.length && urows[0].studentId ? Number(urows[0].studentId) : null;
    }
    if (!sid) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }

    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [sid]) as any[];
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/students/me error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/students/me ─────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const user = await requireAuth();
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ success: false, error: 'Only students can edit their profile' }, { status: 403 });
  }

  try {
    let sid = user.studentId ? Number(user.studentId) : null;
    if (!sid) {
      const [urows] = await pool.query(
        'SELECT studentId FROM users WHERE id = ? AND role = ?',
        [user.id, 'STUDENT']
      ) as any[];
      sid = urows.length && urows[0].studentId ? Number(urows[0].studentId) : null;
    }
    if (!sid) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const updates: string[] = [];
    const params: unknown[] = [];

    // Fetch current values for audit
    const [current] = await pool.query('SELECT * FROM students WHERE id = ?', [sid]) as any[];
    if (!current.length) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    const currentData = current[0];

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const newValue = body[field];
        const oldValue = currentData[field];
        if (String(newValue) !== String(oldValue)) {
          updates.push(`${field} = ?`);
          params.push(newValue || null);
          // Audit log
          try {
            await pool.query(
              'INSERT INTO audit_logs (student_id, field_name, old_value, new_value) VALUES (?, ?, ?, ?)',
              [sid, field, String(oldValue ?? ''), String(newValue ?? '')]
            );
          } catch {
            // audit_logs may not exist, ignore
          }
        }
      }
    }

    if (!updates.length) {
      return NextResponse.json({ success: false, error: 'No changes made' }, { status: 400 });
    }

    params.push(sid);
    await pool.query(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.query('SELECT * FROM students WHERE id = ?', [sid]) as any[];
    return NextResponse.json({ success: true, data: updated[0], message: 'Profile updated successfully' });
  } catch (err) {
    console.error('PUT /api/students/me error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
