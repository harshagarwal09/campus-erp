import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { validateStudent } from '@/lib/validations';

// ─── Auth helper ─────────────────────────────────────────────────────────────

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

// ─── GET /api/students ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get('studentId')?.trim() ?? '';
    const branch = searchParams.get('branch')?.trim() ?? '';
    const city = searchParams.get('city')?.trim() ?? '';
    const enrollmentYear = searchParams.get('enrollmentYear')?.trim() ?? '';

    // Build dynamic WHERE clauses
    const conditions: string[] = ['is_deleted = false'];
    const params: unknown[] = [];

    if (studentId) {
      conditions.push('LOWER(studentId) LIKE ?');
      params.push(`%${studentId.toLowerCase()}%`);
    }
    if (branch) {
      conditions.push('branch = ?');
      params.push(branch);
    }
    if (city) {
      conditions.push('city = ?');
      params.push(city);
    }
    if (enrollmentYear) {
      conditions.push('enrollmentYear = ?');
      params.push(enrollmentYear);
    }

    const where = conditions.join(' AND ');
    const [rows] = await pool.query(
      `SELECT * FROM students WHERE ${where} ORDER BY id DESC`,
      params
    ) as any[];

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/students error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── POST /api/students ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

    // Check uniqueness of studentId
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE studentId = ?',
      [normalized.studentId]
    ) as any[];
    if (existing.length) {
      return NextResponse.json(
        { success: false, error: 'Student ID must be unique', data: { errors: { studentId: 'Student ID must be unique' } } },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO students
        (studentId,name,email,roll,branch,phone,dob,address,city,state,cgpa,enrollmentYear,
         guardianPhone,gender,bloodGroup,category,semester,section,specialization,batch,
         backlogs,attendancePercentage,tenthPercentage,twelfthPercentage,hostelDayScholar,
         skills,interests,linkedinUrl,githubUrl,lookingForTeam,availability,domain)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      ]
    ) as any[];

    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [(result as any).insertId]) as any[];
    return NextResponse.json(
      { success: true, data: rows[0], message: 'Student created successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/students error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
