'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface MembersPerClubChartProps {
  data: { clubName: string; memberCount: number }[];
  loading: boolean;
}

export default function MembersPerClubChart({ data, loading }: MembersPerClubChartProps) {
  return (
    <div className="chart-card">
      <header>
        <div>
          <h2>Members per Club</h2>
          <p className="subtitle">Total members assigned to each club</p>
        </div>
      </header>
      {loading ? (
        <div className="chart-loading">Loading chart…</div>
      ) : !data?.length ? (
        <div className="chart-empty">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="clubName" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="memberCount" fill="#6366F1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
