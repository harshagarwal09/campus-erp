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

async function resolveStudentId(userId: number, studentIdFromToken: string | null): Promise<number | null> {
  if (studentIdFromToken) return Number(studentIdFromToken);
  const [rows] = await pool.query(
    'SELECT studentId FROM users WHERE id = ? AND role = ?',
    [userId, 'STUDENT']
  ) as any[];
  return rows.length ? Number(rows[0].studentId) : null;
}

// ─── GET /api/applications — admin: all applications ──────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT a.*,
              COALESCE(s.name, s2.name) AS studentName,
              COALESCE(s.roll, s2.roll) AS studentRoll,
              COALESCE(s.skills, s2.skills) AS skills,
              COALESCE(s.githubUrl, s2.githubUrl) AS githubUrl,
              c.name AS clubName, c.description AS clubDescription,
              h.name AS hackathonName, h.description AS hackathonDescription,
              f.name AS festName, f.description AS festDescription
       FROM applications a
       LEFT JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.student_id AND u.role = 'STUDENT'
       LEFT JOIN students s2 ON s2.id = u.studentId
       LEFT JOIN clubs c ON a.entity_type = 'club' AND c.id = a.entity_id
       LEFT JOIN hackathons h ON a.entity_type = 'hackathon' AND h.id = a.entity_id
       LEFT JOIN fests f ON a.entity_type = 'fest' AND f.id = a.entity_id
       ORDER BY FIELD(a.status, 'pending', 'approved', 'rejected'), a.applied_at DESC`
    ) as any[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/applications error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── POST /api/applications — student submits application ─────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const entityType = typeof body.entityType === 'string' ? body.entityType.trim().toLowerCase() : '';
    const entityId = body.entityId ? Number(body.entityId) : null;

    if (!['club', 'hackathon', 'fest'].includes(entityType)) {
      return NextResponse.json({ success: false, error: 'Invalid entity type' }, { status: 400 });
    }
    if (!entityId) {
      return NextResponse.json({ success: false, error: 'Entity ID is required' }, { status: 400 });
    }

    const studentId = await resolveStudentId(user.id, user.studentId);
    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Only students can submit applications' }, { status: 403 });
    }

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT id, status FROM applications WHERE student_id = ? AND entity_type = ? AND entity_id = ?',
      [studentId, entityType, entityId]
    ) as any[];
    if (existing.length && ['pending', 'approved'].includes(existing[0].status)) {
      return NextResponse.json({ success: false, error: 'Application already exists' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO applications (student_id, entity_type, entity_id, status, applied_at) VALUES (?, ?, ?, ?, NOW())',
      [studentId, entityType, entityId, 'pending']
    ) as any[];

    const [rows] = await pool.query(
      'SELECT a.*, s.name AS studentName FROM applications a JOIN students s ON s.id = a.student_id WHERE a.id = ?',
      [result.insertId]
    ) as any[];

    return NextResponse.json({ success: true, data: rows[0], message: 'Application submitted' }, { status: 201 });
  } catch (err) {
    console.error('POST /api/applications error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
