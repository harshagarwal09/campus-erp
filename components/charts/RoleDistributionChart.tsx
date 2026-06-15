'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

interface RoleDistributionChartProps {
  data: { role: string; count: number }[];
  loading: boolean;
}

export default function RoleDistributionChart({ data, loading }: RoleDistributionChartProps) {
  return (
    <div className="chart-card">
      <header>
        <div>
          <h2>Role Distribution</h2>
          <p className="subtitle">Users per role in the system</p>
        </div>
      </header>
      {loading ? (
        <div className="chart-loading">Loading chart…</div>
      ) : !data?.length ? (
        <div className="chart-empty">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="role"
              cx="50%"
              cy="45%"
              outerRadius={90}
              label={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${value} users`, name]} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="square"
              wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
