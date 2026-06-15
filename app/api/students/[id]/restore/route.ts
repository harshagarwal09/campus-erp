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

type Params = { params: { id: string } };

// ─── PATCH /api/students/[id]/restore ────────────────────────────────────────

export async function PATCH(_req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pool.query(
      'UPDATE students SET is_deleted = false, deleted_at = NULL WHERE id = ?',
      [params.id]
    );
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [params.id]) as any[];
    return NextResponse.json({ success: true, data: rows[0], message: 'Student restored successfully' });
  } catch (err) {
    console.error('PATCH /api/students/[id]/restore error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
