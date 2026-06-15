import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  verifyRefreshToken,
  signAccessToken,
  buildUserPayload,
  cookieOptions,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, error: 'Refresh token required' }, { status: 400 });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);

    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND userId = ? AND expiresAt > NOW()',
      [refreshToken, decoded.id]
    ) as any[];

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]) as any[];
    if (!users.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const payload = buildUserPayload(user);
    const newAccessToken = await signAccessToken(payload);

    const response = NextResponse.json({ success: true, user: payload });
    response.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, cookieOptions(15 * 60));
    return response;
  } catch (err) {
    console.error('Refresh token error', err);
    return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
  }
}
