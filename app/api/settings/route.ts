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

// ─── GET /api/settings ─────────────────────────────────────────────────────────

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT applicationName, supportEmail, statusMessage, maintenanceMode, securityPolicy, passwordAgeDays, updatedAt FROM settings WHERE id = 1'
    ) as any[];

    if (!rows.length) {
      return NextResponse.json({
        success: true,
        data: {
          applicationName: 'Campus ERP',
          supportEmail: 'support@campus.local',
          statusMessage: 'All systems operational',
          maintenanceMode: false,
          securityPolicy: 'Please follow the security policy and report suspicious activity to support.',
          passwordAgeDays: 90,
          updatedAt: new Date(),
        },
      });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/settings error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/settings ─────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fields: string[] = [];
    const params: unknown[] = [];

    if (body.applicationName !== undefined) { fields.push('applicationName = ?'); params.push(body.applicationName); }
    if (body.supportEmail !== undefined) { fields.push('supportEmail = ?'); params.push(body.supportEmail); }
    if (body.statusMessage !== undefined) { fields.push('statusMessage = ?'); params.push(body.statusMessage); }
    if (body.maintenanceMode !== undefined) { fields.push('maintenanceMode = ?'); params.push(!!body.maintenanceMode); }
    if (body.securityPolicy !== undefined) { fields.push('securityPolicy = ?'); params.push(body.securityPolicy); }
    if (body.passwordAgeDays !== undefined) { fields.push('passwordAgeDays = ?'); params.push(Number(body.passwordAgeDays)); }

    if (!fields.length) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');

    await pool.query(
      `INSERT INTO settings (id, ${fields.map(f => f.split(' = ')[0]).join(', ')})
       VALUES (1, ${fields.map(() => '?').join(', ')})
       ON DUPLICATE KEY UPDATE ${fields.join(', ')}`,
      [...params, ...params]
    );

    const [rows] = await pool.query(
      'SELECT applicationName, supportEmail, statusMessage, maintenanceMode, securityPolicy, passwordAgeDays, updatedAt FROM settings WHERE id = 1'
    ) as any[];

    return NextResponse.json({ success: true, data: rows[0], message: 'Settings updated' });
  } catch (err) {
    console.error('PUT /api/settings error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
