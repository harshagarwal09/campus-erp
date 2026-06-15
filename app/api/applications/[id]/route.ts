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

// ─── GET /api/applications/[id] ────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    const [rows] = await pool.query(
      `SELECT a.*,
              COALESCE(s.name, s2.name) AS studentName,
              COALESCE(s.roll, s2.roll) AS studentRoll,
              COALESCE(s.skills, s2.skills) AS skills,
              COALESCE(s.githubUrl, s2.githubUrl) AS githubUrl,
              COALESCE(s.email, s2.email) AS studentEmail,
              c.name AS clubName,
              h.name AS hackathonName,
              f.name AS festName
       FROM applications a
       LEFT JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = a.student_id AND u.role = 'STUDENT'
       LEFT JOIN students s2 ON s2.id = u.studentId
       LEFT JOIN clubs c ON a.entity_type = 'club' AND c.id = a.entity_id
       LEFT JOIN hackathons h ON a.entity_type = 'hackathon' AND h.id = a.entity_id
       LEFT JOIN fests f ON a.entity_type = 'fest' AND f.id = a.entity_id
       WHERE a.id = ?`,
      [id]
    ) as any[];

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const row = rows[0];
    const entityName = row.clubName || row.hackathonName || row.festName || 'Unknown';

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        entityType: row.entity_type,
        entityName,
        status: row.status,
        appliedAt: row.applied_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        studentName: row.studentName,
        studentRoll: row.studentRoll,
        studentEmail: row.studentEmail,
        skills: row.skills,
        githubUrl: row.githubUrl,
      },
    });
  } catch (err) {
    console.error('GET /api/applications/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

// ─── PUT /api/applications/[id] — approve or reject (ADMIN) ────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action.trim().toLowerCase() : '';

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Action must be approve or reject' }, { status: 400 });
    }

    const [apps] = await pool.query('SELECT * FROM applications WHERE id = ?', [id]) as any[];
    if (!apps.length) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    const app = apps[0];

    if (action === 'approve') {
      if (app.status === 'approved') {
        return NextResponse.json({ success: false, error: 'Already approved' }, { status: 400 });
      }

      // Resolve actual studentId
      let actualStudentId = app.student_id;
      const [checkStudent] = await pool.query('SELECT id FROM students WHERE id = ?', [actualStudentId]) as any[];
      if (!checkStudent.length) {
        const [userRow] = await pool.query('SELECT studentId FROM users WHERE id = ?', [actualStudentId]) as any[];
        if (!userRow.length) {
          return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
        }
        actualStudentId = Number(userRow[0].studentId);
      }

      // Insert member record
      if (app.entity_type === 'club') {
        const [exists] = await pool.query(
          'SELECT id FROM club_members WHERE clubId = ? AND studentId = ?',
          [app.entity_id, actualStudentId]
        ) as any[];
        if (!exists.length) {
          await pool.query(
            'INSERT INTO club_members (clubId, studentId, role, task, joinedAt) VALUES (?, ?, ?, ?, NOW())',
            [app.entity_id, actualStudentId, 'Member', '']
          );
        }
      } else if (app.entity_type === 'hackathon') {
        const [exists] = await pool.query(
          'SELECT id FROM hackathon_members WHERE hackathonId = ? AND studentId = ?',
          [app.entity_id, actualStudentId]
        ) as any[];
        if (!exists.length) {
          await pool.query(
            'INSERT INTO hackathon_members (hackathonId, studentId, role, task) VALUES (?, ?, ?, ?)',
            [app.entity_id, actualStudentId, 'Participant', '']
          );
        }
      } else if (app.entity_type === 'fest') {
        const [exists] = await pool.query(
          'SELECT id FROM fest_members WHERE festId = ? AND studentId = ?',
          [app.entity_id, actualStudentId]
        ) as any[];
        if (!exists.length) {
          await pool.query(
            'INSERT INTO fest_members (festId, studentId, role, task) VALUES (?, ?, ?, ?)',
            [app.entity_id, actualStudentId, 'Volunteer', '']
          );
        }
      }

      await pool.query(
        'UPDATE applications SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?',
        ['approved', user.id, id]
      );
      return NextResponse.json({ success: true, message: 'Application approved' });
    } else {
      await pool.query(
        'UPDATE applications SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?',
        ['rejected', user.id, id]
      );
      return NextResponse.json({ success: true, message: 'Application rejected' });
    }
  } catch (err) {
    console.error('PUT /api/applications/[id] error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
