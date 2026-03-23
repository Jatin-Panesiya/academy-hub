import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import StatCard from '../../components/StatCard.jsx';
import SimpleBarChart from '../../components/SimpleBarChart.jsx';
import { fetchStudents } from '../../services/studentsApi.js';

function shortId(id) {
  if (!id) return '';
  const s = String(id);
  return s.length <= 6 ? s : `${s.slice(0, 4)}…${s.slice(-2)}`;
}

function formatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPaid: 0,
    totalPending: 0,
    topBatches: [],
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        // Use the first page with max 100 to power dashboard cards/charts.
        const data = await fetchStudents({ page: 1, limit: 100, search: '' });
        if (!mounted) return;

        const items = Array.isArray(data?.items) ? data.items : [];
        const totalStudents = Number(data?.total ?? items.length);

        const totalPaid = items.reduce((sum, s) => sum + (Number(s.feesPaid) || 0), 0);
        const totalPending = items.reduce((sum, s) => sum + Math.max(0, (Number(s.feesTotal) || 0) - (Number(s.feesPaid) || 0)), 0);

        const batchCount = new Map();
        for (const s of items) {
          const bid = s.batchId ? String(s.batchId) : 'unknown';
          batchCount.set(bid, (batchCount.get(bid) ?? 0) + 1);
        }

        const topBatches = [...batchCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([batchId, value]) => ({
            key: batchId,
            label: shortId(batchId),
            value,
          }));

        setStats({ totalStudents, totalPaid, totalPending, topBatches });
      } catch (err) {
        setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load stats');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const pendingPerStudent = useMemo(() => {
    if (!stats.totalStudents) return 0;
    return stats.totalPending / stats.totalStudents;
  }, [stats.totalPending, stats.totalStudents]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Overview of students and fee status.</p>
        </div>
        <div>
          <Link
            to="/admin/students"
            className="inline-flex items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Manage Students
          </Link>
        </div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={formatNumber(stats.totalStudents)} hint="From API (search: none)" />
        <StatCard title="Total Fees Paid" value={formatNumber(stats.totalPaid)} hint="Sum of `feesPaid` (first 100)" />
        <StatCard title="Pending Fees" value={formatNumber(stats.totalPending)} hint="Sum of max(0, feesTotal - feesPaid)" />
        <StatCard
          title="Pending / Student"
          value={formatNumber(pendingPerStudent)}
          hint="Total pending divided by total students"
        />
      </div>

      <div className="rounded border border-slate-200 bg-white/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Top Batches (Student Count)</h2>
          {loading ? <div className="text-xs text-slate-500">Loading…</div> : null}
        </div>
        <div className="mt-4">
          <SimpleBarChart data={stats.topBatches} heightClassName="h-44" />
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Chart uses batch IDs and is based on the first 100 students (API pagination limits).
        </div>
      </div>
    </div>
  );
}

