'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface HackathonParticipationChartProps {
  data: { hackathonName: string; participantCount: number }[];
  loading: boolean;
}

export default function HackathonParticipationChart({ data, loading }: HackathonParticipationChartProps) {
  return (
    <div className="chart-card">
      <header>
        <div>
          <h2>Hackathon Participation</h2>
          <p className="subtitle">Total participants per hackathon</p>
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
            <XAxis dataKey="hackathonName" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="participantCount" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
