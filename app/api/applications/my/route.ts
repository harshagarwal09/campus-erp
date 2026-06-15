import { NextResponse } from 'next/server';
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

// ─── GET /api/applications/my — student's own applications ─────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let studentId = user.studentId ? Number(user.studentId) : null;
    if (!studentId) {
      const [rows] = await pool.query(
        'SELECT studentId FROM users WHERE id = ? AND role = ?',
        [user.id, 'STUDENT']
      ) as any[];
      studentId = rows.length ? Number(rows[0].studentId) : null;
    }
    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Only students can view applications' }, { status: 403 });
    }

    const [rows] = await pool.query(
      `SELECT a.*,
              c.name AS clubName,
              h.name AS hackathonName,
              f.name AS festName
       FROM applications a
       LEFT JOIN clubs c ON a.entity_type = 'club' AND c.id = a.entity_id
       LEFT JOIN hackathons h ON a.entity_type = 'hackathon' AND h.id = a.entity_id
       LEFT JOIN fests f ON a.entity_type = 'fest' AND f.id = a.entity_id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC`,
      [studentId]
    ) as any[];

    const data = rows.map((r: any) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      entityName: r.clubName || r.hackathonName || r.festName || 'Unknown',
      status: r.status,
      appliedAt: r.applied_at,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('GET /api/applications/my error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
