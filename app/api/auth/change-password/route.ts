import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
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

// ─── POST /api/auth/change-password ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [user.id]) as any[];
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const validPassword = await bcrypt.compare(currentPassword, rows[0].password);
    if (!validPassword) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, tempPassword = NULL, isFirstLogin = false WHERE id = ?',
      [hashedPassword, user.id]
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('POST /api/auth/change-password error', err);
    return NextResponse.json({ success: false, error: 'Unable to change password' }, { status: 500 });
  }
}
