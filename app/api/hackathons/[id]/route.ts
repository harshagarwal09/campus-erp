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

// ─── GET /api/hackathons/[id] ─────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT h.*, 
        (SELECT COUNT(*) FROM hackathon_members hm WHERE hm.hackathonId = h.id) AS participantCount
       FROM hackathons h WHERE h.id = ?`,
      [params.id]
    ) as any[];

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Hackathon not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/hackathons/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/hackathons/[id] ─────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'HACKATHON_LEAD')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role === 'HACKATHON_LEAD' && Number(user.entityId) !== Number(params.id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
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

    await pool.query(
      'UPDATE hackathons SET name = ?, description = ?, venue = ?, startDate = ?, endDate = ?, maxParticipants = ? WHERE id = ?',
      [name, description, venue, startDate, endDate, maxParticipants, params.id]
    );

    const [rows] = await pool.query('SELECT * FROM hackathons WHERE id = ?', [params.id]) as any[];
    return NextResponse.json({ success: true, data: rows[0], message: 'Hackathon updated successfully' });
  } catch (err) {
    console.error('PUT /api/hackathons/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── DELETE /api/hackathons/[id] ──────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireAuth();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pool.query('DELETE FROM hackathons WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: {}, message: 'Hackathon deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/hackathons/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
