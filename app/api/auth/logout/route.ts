import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

    if (token) {
      try {
        const user = await verifyAccessToken(token);
        await pool.query('DELETE FROM refresh_tokens WHERE userId = ?', [user.id]);
      } catch {
        // Token expired — still clear cookies
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    response.cookies.set(REFRESH_TOKEN_COOKIE, '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Logout error', err);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
