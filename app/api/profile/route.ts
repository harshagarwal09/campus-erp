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

// ─── GET /api/profile ──────────────────────────────────────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, role, entityType, entityId, isFirstLogin, createdAt FROM users WHERE id = ?',
      [user.id]
    ) as any[];
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/profile error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/profile ──────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const updates: string[] = [];
    const params: unknown[] = [];

    if (typeof body.email === 'string') {
      updates.push('email = ?');
      params.push(body.email.trim());
    }
    if (typeof body.username === 'string' && body.username.trim()) {
      const [dup] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [body.username.trim(), user.id]
      ) as any[];
      if (dup.length) {
        return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
      }
      updates.push('username = ?');
      params.push(body.username.trim());
    }

    if (!updates.length) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    params.push(user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      'SELECT id, username, email, role, entityType, entityId, isFirstLogin, createdAt FROM users WHERE id = ?',
      [user.id]
    ) as any[];
    return NextResponse.json({ success: true, data: rows[0], message: 'Profile updated' });
  } catch (err) {
    console.error('PUT /api/profile error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
