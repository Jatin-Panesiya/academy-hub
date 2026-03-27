import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const COLORS = {
  paid: '#2563EB',
  pending: '#F97316',
};

export default function FeeBreakdownBarChart({ paid = 0, pending = 0 }) {
  const data = [
    { name: 'Paid', value: Number(paid) || 0, color: COLORS.paid },
    { name: 'Pending', value: Number(pending) || 0, color: COLORS.pending },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={40}>
            {data.map((d, idx) => (
              <Cell key={d.name ?? idx} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

