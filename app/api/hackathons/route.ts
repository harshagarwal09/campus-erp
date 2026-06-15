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

// ─── GET /api/hackathons ──────────────────────────────────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT h.*, 
        (SELECT COUNT(*) FROM hackathon_members hm WHERE hm.hackathonId = h.id) AS participantCount
       FROM hackathons h 
       ORDER BY h.createdAt DESC`
    ) as any[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/hackathons error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── POST /api/hackathons ─────────────────────────────────────────────────────

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
    const maxParticipants = body.maxParticipants || null;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Hackathon name is required', data: { errors: { name: 'Hackathon name is required' } } },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      'INSERT INTO hackathons (name, description, venue, startDate, endDate, maxParticipants) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, venue, startDate, endDate, maxParticipants]
    ) as any[];

    const [rows] = await pool.query('SELECT * FROM hackathons WHERE id = ?', [result.insertId]) as any[];
    return NextResponse.json(
      { success: true, data: rows[0], message: 'Hackathon created successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/hackathons error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
