import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const COLORS = {
  blue: '#2563EB',
  orange: '#F97316',
};

export default function TopCoursesBarChart({ data = [] }) {
  const normalized = Array.isArray(data) ? data : [];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={normalized} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip
            formatter={(value, name) => [`${value}`, name]}
            labelFormatter={(label) => `Course: ${label}`}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={40}>
            {normalized.map((entry, idx) => (
              <Cell
                key={entry.key ?? entry.label ?? idx}
                fill={idx % 2 === 0 ? COLORS.blue : COLORS.orange}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

