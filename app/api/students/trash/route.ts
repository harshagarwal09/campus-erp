import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

async function requireAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const user = await verifyAccessToken(token);
    return user.role === 'ADMIN' ? user : null;
  } catch {
    return null;
  }
}

// ─── GET /api/students/trash ──────────────────────────────────────────────────

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE is_deleted = true ORDER BY deleted_at DESC'
    ) as any[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/students/trash error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── DELETE /api/students/trash — permanent delete by ?id= ───────────────────
// Used as DELETE /api/students/trash?id=123

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  try {
    await pool.query('DELETE FROM students WHERE id = ? AND is_deleted = true', [id]);
    return NextResponse.json({ success: true, data: {}, message: 'Student permanently deleted' });
  } catch (err) {
    console.error('DELETE /api/students/trash error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
