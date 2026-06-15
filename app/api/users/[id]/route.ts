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

// ─── GET /api/users/[id] ────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.entityType, u.entityId, u.createdAt,
              s.id AS studentRecordId, s.studentId AS studentCode, s.name AS studentName
       FROM users u
       LEFT JOIN students s ON s.id = u.studentId
       WHERE u.id = ?`,
      [id]
    ) as any[];
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/users/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/users/[id] ────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    const body = await req.json().catch(() => ({}));

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]) as any[];
    if (!existing.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const updateParams: unknown[] = [];

    if (typeof body.username === 'string' && body.username.trim()) {
      const [dup] = await pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [body.username.trim(), id]
      ) as any[];
      if (dup.length) {
        return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 400 });
      }
      updates.push('username = ?');
      updateParams.push(body.username.trim());
    }
    if (typeof body.email === 'string') {
      updates.push('email = ?');
      updateParams.push(body.email.trim());
    }
    if (typeof body.role === 'string' && body.role.trim()) {
      updates.push('role = ?');
      updateParams.push(body.role.trim());
    }
    if (body.entityType !== undefined) {
      updates.push('entityType = ?');
      updateParams.push(body.entityType || null);
    }
    if (body.entityId !== undefined) {
      updates.push('entityId = ?');
      updateParams.push(body.entityId ? Number(body.entityId) : null);
    }

    if (!updates.length) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    updateParams.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, updateParams);

    const [rows] = await pool.query(
      'SELECT id, username, email, role, entityType, entityId, createdAt FROM users WHERE id = ?',
      [id]
    ) as any[];
    return NextResponse.json({ success: true, data: rows[0], message: 'User updated' });
  } catch (err) {
    console.error('PUT /api/users/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── DELETE /api/users/[id] ─────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]) as any[];
    if (!existing.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    await pool.query('DELETE FROM refresh_tokens WHERE userId = ?', [id]);
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('DELETE /api/users/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
