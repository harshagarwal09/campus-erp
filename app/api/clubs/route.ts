import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

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

// ─── GET /api/clubs ───────────────────────────────────────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM club_members cm WHERE cm.clubId = c.id) AS memberCount,
        (SELECT u.id FROM users u WHERE u.entityType = 'CLUB' AND u.entityId = c.id AND u.role = 'CLUB_HEAD' LIMIT 1) AS presidentUserId
       FROM clubs c 
       ORDER BY c.createdAt DESC`
    ) as any[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/clubs error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── POST /api/clubs ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

    const [result] = await pool.query(
      'INSERT INTO clubs (name, description, facultyCoordinator) VALUES (?, ?, ?)',
      [name, description, facultyCoordinator]
    ) as any[];

    const [rows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [result.insertId]) as any[];
    return NextResponse.json(
      { success: true, data: rows[0], message: 'Club created successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/clubs error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
