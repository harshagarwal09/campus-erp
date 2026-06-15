'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DashboardChartsProps {
  studentsByBranch: { branch: string; count: number }[];
  cgpaDistribution: { range: string; count: number }[];
  loading: boolean;
}

export default function DashboardCharts({ studentsByBranch, cgpaDistribution, loading }: DashboardChartsProps) {
  if (loading) {
    return (
      <div className="chart-grid">
        <div className="chart-card">
          <header><h2>Students by Branch</h2></header>
          <div className="chart-loading">Loading chart…</div>
        </div>
        <div className="chart-card">
          <header><h2>CGPA Distribution</h2></header>
          <div className="chart-loading">Loading chart…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-grid">
      {/* Students by Branch */}
      <div className="chart-card">
        <header>
          <div>
            <h2>Students by Branch</h2>
            <p className="subtitle">Number of students in each branch</p>
          </div>
        </header>
        {!studentsByBranch?.length ? (
          <div className="chart-empty">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentsByBranch}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* CGPA Distribution */}
      <div className="chart-card">
        <header>
          <div>
            <h2>CGPA Distribution</h2>
            <p className="subtitle">Students grouped by CGPA range</p>
          </div>
        </header>
        {!cgpaDistribution?.length ? (
          <div className="chart-empty">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cgpaDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="count" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
