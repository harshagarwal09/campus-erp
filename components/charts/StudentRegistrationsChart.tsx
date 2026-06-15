'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface StudentRegistrationsChartProps {
  data: { month: string; count: number }[];
  loading: boolean;
}

export default function StudentRegistrationsChart({ data, loading }: StudentRegistrationsChartProps) {
  return (
    <div className="chart-card chart-span-full">
      <header>
        <div>
          <h2>Student Registrations (Last 12 Months)</h2>
          <p className="subtitle">New student accounts created per month</p>
        </div>
      </header>
      {loading ? (
        <div className="chart-loading">Loading chart…</div>
      ) : !data?.length ? (
        <div className="chart-empty">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ r: 4, fill: '#4F46E5' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
