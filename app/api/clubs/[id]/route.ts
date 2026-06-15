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

// ─── GET /api/clubs/[id] ──────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM club_members cm WHERE cm.clubId = c.id) AS memberCount
       FROM clubs c WHERE c.id = ?`,
      [params.id]
    ) as any[];

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 });
    }

    // Also fetch president info
    const [presidentRows] = await pool.query(
      `SELECT cm.role, cm.joinedAt, s.name, s.email, s.roll
       FROM club_members cm
       JOIN students s ON s.id = cm.studentId
       WHERE cm.clubId = ? AND cm.role = 'President'
       LIMIT 1`,
      [params.id]
    ) as any[];

    const club = rows[0];
    club.president = presidentRows.length ? presidentRows[0] : null;

    return NextResponse.json({ success: true, data: club });
  } catch (err) {
    console.error('GET /api/clubs/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/clubs/[id] ──────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const facultyCoordinator = typeof body.facultyCoordinator === 'string' ? body.facultyCoordinator.trim() : '';

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Club name is required', data: { errors: { name: 'Club name is required' } } },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE clubs SET name = ?, description = ?, facultyCoordinator = ? WHERE id = ?',
      [name, description, facultyCoordinator, params.id]
    );

    const [rows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [params.id]) as any[];
    return NextResponse.json({ success: true, data: rows[0], message: 'Club updated successfully' });
  } catch (err) {
    console.error('PUT /api/clubs/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── DELETE /api/clubs/[id] ───────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pool.query('DELETE FROM clubs WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: {}, message: 'Club deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/clubs/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
