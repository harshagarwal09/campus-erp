import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
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

// ─── GET /api/users ────────────────────────────────────────────────────────────

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.entityType, u.entityId, u.createdAt,
              s.id AS studentRecordId, s.studentId AS studentCode, s.name AS studentName
       FROM users u
       LEFT JOIN students s ON s.id = u.studentId
       ORDER BY u.createdAt DESC`
    ) as any[];
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/users error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── POST /api/users — create user ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = typeof body.role === 'string' ? body.role.trim() : '';
    const entityType = body.entityType || null;
    const entityId = body.entityId ? Number(body.entityId) : null;

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Username, password, and role are required' },
        { status: 400 }
      );
    }

    // Check duplicate username
    const [dup] = await pool.query('SELECT id FROM users WHERE username = ?', [username]) as any[];
    if (dup.length) {
      return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role, entityType, entityId) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, entityType, entityId]
    ) as any[];

    const [rows] = await pool.query(
      'SELECT id, username, email, role, entityType, entityId, createdAt FROM users WHERE id = ?',
      [(result as any).insertId]
    ) as any[];

    return NextResponse.json(
      { success: true, data: rows[0], message: 'User created successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/users error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
