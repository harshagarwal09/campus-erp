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

type Params = { params: { id: string } };

// ─── GET /api/hackathons/[id]/members ─────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.hackathonId, m.studentId, m.role, m.task,
              s.name AS studentName, s.email, s.branch, s.roll
       FROM hackathon_members m
       JOIN students s ON s.id = m.studentId
       WHERE m.hackathonId = ?
       ORDER BY m.id DESC`,
      [params.id]
    ) as any[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/hackathons/[id]/members error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── POST /api/hackathons/[id]/members ────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'HACKATHON_LEAD')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role === 'HACKATHON_LEAD' && Number(user.entityId) !== Number(params.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const studentId = body.studentId;
    const role = typeof body.role === 'string' ? body.role.trim() : '';
    const task = typeof body.task === 'string' ? body.task.trim() : '';

    if (!studentId || !role) {
      return NextResponse.json(
        { success: false, error: 'Student and role are required' },
        { status: 400 }
      );
    }

    const [studentRows] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]) as any[];
    if (!studentRows.length) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const [existing] = await pool.query(
      'SELECT id FROM hackathon_members WHERE hackathonId = ? AND studentId = ?',
      [params.id, studentId]
    ) as any[];
    if (existing.length) {
      return NextResponse.json(
        { success: false, error: 'Student is already assigned' },
        { status: 400 }
      );
    }

    await pool.query(
      'INSERT INTO hackathon_members (hackathonId, studentId, role, task) VALUES (?, ?, ?, ?)',
      [params.id, studentId, role, task || '']
    );

    const [rows] = await pool.query(
      `SELECT m.id, m.hackathonId, m.studentId, m.role, m.task,
              s.name AS studentName, s.email, s.branch, s.roll
       FROM hackathon_members m
       JOIN students s ON s.id = m.studentId
       WHERE m.hackathonId = ? AND m.studentId = ?`,
      [params.id, studentId]
    ) as any[];

    return NextResponse.json(
      { success: true, data: rows[0], message: 'Participant added' },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/hackathons/[id]/members error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── DELETE /api/hackathons/[id]/members?userId= ──────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'HACKATHON_LEAD')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role === 'HACKATHON_LEAD' && Number(user.entityId) !== Number(params.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId query param is required' }, { status: 400 });
    }

    const [members] = await pool.query(
      'SELECT * FROM hackathon_members WHERE hackathonId = ? AND studentId = ?',
      [params.id, userId]
    ) as any[];

    if (!members.length) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const member = members[0];
    await pool.query('DELETE FROM hackathon_members WHERE hackathonId = ? AND studentId = ?', [params.id, userId]);

    // Clean up user account for Lead role
    if (member.role === 'Lead') {
      await pool.query(
        'DELETE FROM users WHERE studentId = ? AND entityType = ? AND entityId = ?',
        [member.studentId, 'HACKATHON', member.hackathonId]
      );
    }

    return NextResponse.json({ success: true, data: {}, message: 'Member removed' });
  } catch (err) {
    console.error('DELETE /api/hackathons/[id]/members error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
