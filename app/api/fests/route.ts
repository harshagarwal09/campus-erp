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

// ─── GET /api/fests ───────────────────────────────────────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT f.*, 
        (SELECT COUNT(*) FROM fest_members fm WHERE fm.festId = f.id) AS participantCount
       FROM fests f 
       ORDER BY f.createdAt DESC`
    ) as any[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/fests error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── POST /api/fests ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const venue = typeof body.venue === 'string' ? body.venue.trim() : '';
    const startDate = body.startDate || null;
    const endDate = body.endDate || null;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Fest name is required', data: { errors: { name: 'Fest name is required' } } },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      'INSERT INTO fests (name, description, venue, startDate, endDate) VALUES (?, ?, ?, ?, ?)',
      [name, description, venue, startDate, endDate]
    ) as any[];

    const [rows] = await pool.query('SELECT * FROM fests WHERE id = ?', [result.insertId]) as any[];
    return NextResponse.json(
      { success: true, data: rows[0], message: 'Fest created successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/fests error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
