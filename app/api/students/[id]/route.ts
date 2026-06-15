import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { validateStudent } from '@/lib/validations';

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

// ─── GET /api/students/[id] ───────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE id = ? AND is_deleted = false',
      [params.id]
    ) as any[];

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /api/students/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/students/[id] ───────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { errors, normalized } = validateStudent(body);

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, error: 'Invalid student payload', data: { errors } },
        { status: 400 }
      );
    }

    // Check uniqueness excluding current record
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE studentId = ? AND id != ?',
      [normalized.studentId, params.id]
    ) as any[];
    if (existing.length) {
      return NextResponse.json(
        { success: false, error: 'Student ID must be unique', data: { errors: { studentId: 'Student ID must be unique' } } },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE students SET
        studentId=?,name=?,email=?,roll=?,branch=?,phone=?,dob=?,address=?,city=?,state=?,
        cgpa=?,enrollmentYear=?,guardianPhone=?,gender=?,bloodGroup=?,category=?,semester=?,
        section=?,specialization=?,batch=?,backlogs=?,attendancePercentage=?,
        tenthPercentage=?,twelfthPercentage=?,hostelDayScholar=?,skills=?,interests=?,
        linkedinUrl=?,githubUrl=?,lookingForTeam=?,availability=?,domain=?
       WHERE id=?`,
      [
        normalized.studentId, normalized.name, normalized.email, normalized.roll,
        normalized.branch, normalized.phone, normalized.dob || null,
        normalized.address, normalized.city, normalized.state,
        normalized.cgpa || null, normalized.enrollmentYear || null,
        normalized.guardianPhone, normalized.gender, normalized.bloodGroup,
        normalized.category, normalized.semester, normalized.section,
        normalized.specialization, normalized.batch,
        normalized.backlogs, normalized.attendancePercentage,
        normalized.tenthPercentage, normalized.twelfthPercentage,
        normalized.hostelDayScholar, normalized.skills, normalized.interests,
        normalized.linkedinUrl, normalized.githubUrl,
        normalized.lookingForTeam || false,
        normalized.availability, normalized.domain,
        params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [params.id]) as any[];
    return NextResponse.json({ success: true, data: rows[0], message: 'Student updated successfully' });
  } catch (err) {
    console.error('PUT /api/students/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── DELETE /api/students/[id] — soft delete ──────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pool.query(
      'UPDATE students SET is_deleted = true, deleted_at = NOW() WHERE id = ?',
      [params.id]
    );
    return NextResponse.json({ success: true, data: {}, message: 'Student soft deleted' });
  } catch (err) {
    console.error('DELETE /api/students/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
