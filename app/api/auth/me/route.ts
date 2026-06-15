import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAccessToken, buildUserPayload, ACCESS_TOKEN_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);

    const [rows] = await pool.query(
      'SELECT id, username, email, role, entityType, entityId, studentId, isFirstLogin FROM users WHERE id = ?',
      [decoded.id]
    ) as any[];

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = buildUserPayload(rows[0]);
    return NextResponse.json({ success: true, data: { user }, message: 'User fetched successfully' });
  } catch (err) {
    console.error('Auth /me error', err);
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
}
