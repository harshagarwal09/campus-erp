import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

async function requireAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const user = await verifyAccessToken(token);
    if (user.role !== 'ADMIN') return null;
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run all queries in parallel
    const [
      [studentsByBranchRows],
      [membersPerClubRows],
      [hackathonParticipationRows],
      [roleDistributionRows],
      [totalStudentsRows],
      [totalBranchesRows],
      [avgCgpaRows],
      [thisYearRows],
      [registrationRows],
    ] = await Promise.all([
      // studentsByBranch
      pool.query(
        `SELECT branch, COUNT(*) AS count
         FROM students WHERE is_deleted = false
         GROUP BY branch ORDER BY count DESC`
      ),
      // membersPerClub
      pool.query(
        `SELECT c.name AS clubName, COUNT(cm.id) AS memberCount
         FROM clubs c
         LEFT JOIN club_members cm ON c.id = cm.clubId
         GROUP BY c.id, c.name
         ORDER BY memberCount DESC`
      ),
      // hackathonParticipation
      pool.query(
        `SELECT h.name AS hackathonName, COUNT(hm.id) AS participantCount
         FROM hackathons h
         LEFT JOIN hackathon_members hm ON h.id = hm.hackathonId
         GROUP BY h.id, h.name
         ORDER BY participantCount DESC`
      ),
      // roleDistribution
      pool.query(
        `SELECT role, COUNT(*) AS count
         FROM users GROUP BY role ORDER BY count DESC`
      ),
      // totalStudents
      pool.query(`SELECT COUNT(*) AS total FROM students WHERE is_deleted = false`),
      // totalBranches
      pool.query(`SELECT COUNT(DISTINCT branch) AS total FROM students WHERE is_deleted = false AND branch IS NOT NULL AND branch != ''`),
      // averageCgpa
      pool.query(`SELECT AVG(cgpa) AS avg FROM students WHERE is_deleted = false AND cgpa IS NOT NULL`),
      // thisYearAdmissions
      pool.query(`SELECT COUNT(*) AS total FROM students WHERE is_deleted = false AND YEAR(createdAt) = YEAR(CURDATE())`),
      // studentRegistrations last 12 months
      pool.query(
        `SELECT DATE_FORMAT(createdAt, '%Y-%m') AS monthKey,
                DATE_FORMAT(createdAt, '%b %Y') AS month,
                COUNT(*) AS count
         FROM students
         WHERE is_deleted = false AND createdAt >= DATE_SUB(NOW(), INTERVAL 11 MONTH)
         GROUP BY monthKey, month
         ORDER BY monthKey ASC`
      ),
    ]) as any[];

    // Build CGPA distribution
    const cgpaRanges = [
      { label: '6.1-6.9', min: 6.1, max: 6.9 },
      { label: '6.9-7.6', min: 6.9, max: 7.6 },
      { label: '7.6-8.4', min: 7.6, max: 8.4 },
      { label: '8.4-9.1', min: 8.4, max: 9.1 },
      { label: '9.1-9.9', min: 9.1, max: 9.9 },
    ];

    const [cgpaRows] = await pool.query(
      `SELECT cgpa FROM students WHERE is_deleted = false AND cgpa IS NOT NULL`
    ) as any[];

    const cgpaDistribution = cgpaRanges.map((r) => ({
      range: r.label,
      count: cgpaRows.filter((row: any) => {
        const val = Number(row.cgpa);
        return val >= r.min && val < r.max;
      }).length,
    }));
    // include 9.9 upper bound
    if (cgpaDistribution.length) {
      const last = cgpaDistribution[cgpaDistribution.length - 1];
      last.count += cgpaRows.filter((row: any) => Number(row.cgpa) === 9.9).length;
    }

    // Build full 12-month registration data (fill missing months with 0)
    const months: { monthKey: string; month: string }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7);
      const month = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      months.push({ monthKey, month });
    }
    const regMap: Record<string, number> = {};
    registrationRows.forEach((row: any) => { regMap[row.monthKey] = Number(row.count); });
    const studentRegistrationsByMonth = months.map((m) => ({
      month: m.month,
      count: regMap[m.monthKey] || 0,
    }));

    const totalStudents = Number(totalStudentsRows[0]?.total || 0);
    const totalBranches = Number(totalBranchesRows[0]?.total || 0);
    const averageCgpa = avgCgpaRows[0]?.avg
      ? Number(Number(avgCgpaRows[0].avg).toFixed(2))
      : 0;
    const thisYearAdmissions = Number(thisYearRows[0]?.total || 0);

    return NextResponse.json({
      success: true,
      data: {
        studentsByBranch: studentsByBranchRows,
        cgpaDistribution,
        membersPerClub: membersPerClubRows,
        hackathonParticipation: hackathonParticipationRows,
        roleDistribution: roleDistributionRows,
        studentRegistrationsByMonth,
        totalStudents,
        totalBranches,
        averageCgpa,
        thisYearAdmissions,
      },
    });
  } catch (err) {
    console.error('GET /api/analytics error', err);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}
