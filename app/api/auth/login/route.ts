import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import {
  signAccessToken,
  signRefreshToken,
  buildUserPayload,
  cookieOptions,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string };

    if (!username?.trim()) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 422 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 422 });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username.trim()]) as any[];
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 });
    }

    const userPayload = buildUserPayload(user);
    const accessToken = await signAccessToken(userPayload);
    const refreshToken = await signRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (userId, token, expiresAt) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    const response = NextResponse.json({
      success: true,
      requiresPasswordChange: (userPayload as any).requiresPasswordChange,
      user: userPayload,
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(15 * 60));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(7 * 24 * 60 * 60));

    return response;
  } catch (err) {
    console.error('Login error', err);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
