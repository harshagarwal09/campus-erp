'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardCharts from '@/components/charts/DashboardCharts';
import MembersPerClubChart from '@/components/charts/MembersPerClubChart';
import HackathonParticipationChart from '@/components/charts/HackathonParticipationChart';
import RoleDistributionChart from '@/components/charts/RoleDistributionChart';
import StudentRegistrationsChart from '@/components/charts/StudentRegistrationsChart';

interface AnalyticsData {
  studentsByBranch: { branch: string; count: number }[];
  cgpaDistribution: { range: string; count: number }[];
  membersPerClub: { clubName: string; memberCount: number }[];
  hackathonParticipation: { hackathonName: string; participantCount: number }[];
  roleDistribution: { role: string; count: number }[];
  studentRegistrationsByMonth: { month: string; count: number }[];
  totalStudents: number;
  totalBranches: number;
  averageCgpa: number;
  thisYearAdmissions: number;
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', { credentials: 'include' });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch {
      setError('Failed to connect to analytics API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Students', value: data?.totalStudents ?? '—', color: '#2563EB' },
    { label: 'Branches', value: data?.totalBranches ?? '—', color: '#22C55E' },
    { label: 'Average CGPA', value: data?.averageCgpa ?? '—', color: '#F59E0B' },
    { label: 'This Year Admissions', value: data?.thisYearAdmissions ?? '—', color: '#8B5CF6' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Analytics Overview</h1>
          <p className="subtitle">Real-time insights into student data, clubs, and campus activity.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="card-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <h3>{s.label}</h3>
            <p style={{ color: s.color }}>{loading ? '…' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        studentsByBranch={data?.studentsByBranch ?? []}
        cgpaDistribution={data?.cgpaDistribution ?? []}
        loading={loading}
      />

      <div className="chart-grid" style={{ marginTop: 20 }}>
        <MembersPerClubChart data={data?.membersPerClub ?? []} loading={loading} />
        <HackathonParticipationChart data={data?.hackathonParticipation ?? []} loading={loading} />
      </div>

      <div className="chart-grid" style={{ marginTop: 20 }}>
        <RoleDistributionChart data={data?.roleDistribution ?? []} loading={loading} />
      </div>

      <div className="chart-grid" style={{ marginTop: 20 }}>
        <StudentRegistrationsChart data={data?.studentRegistrationsByMonth ?? []} loading={loading} />
      </div>
    </div>
  );
}
