import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Skeleton, SkeletonLine } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import TopCoursesBarChart from '../../components/charts/TopCoursesBarChart.jsx';
import FeeBreakdownBarChart from '../../components/charts/FeeBreakdownBarChart.jsx';
import { fetchCourses } from '../../services/coursesApi.js';
import { fetchStudents } from '../../services/studentsApi.js';

function formatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num);
}

export default function AdminDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    totalPending: 0,
    activeCourses: 0,
    topCourses: [],
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        // Use first page with max 100 to power charts.
        const [studentsData, coursesData] = await Promise.all([
          fetchStudents({ page: 1, limit: 100, search: '' }),
          fetchCourses({ page: 1, limit: 100, search: '' }),
        ]);
        if (!mounted) return;

        const items = Array.isArray(studentsData?.items) ? studentsData.items : [];
        const totalStudents = Number(studentsData?.total ?? items.length);

        const totalRevenue = items.reduce((sum, s) => sum + (Number(s.feesPaid) || 0), 0);
        const totalPending = items.reduce(
          (sum, s) => sum + Math.max(0, (Number(s.feesTotal) || 0) - (Number(s.feesPaid) || 0)),
          0
        );

        const courseCount = new Map();
        const coursesList = Array.isArray(coursesData?.items) ? coursesData.items : [];
        const courseNameByCatalogId = new Map(
          coursesList.map((c) => [String(c?._id ?? ''), c?.courseName ?? ''])
        );
        const courseNameById = new Map();
        for (const s of items) {
          const cid = s.courseId
            ? typeof s.courseId === 'object'
              ? String(s.courseId._id ?? s.courseId.id ?? s.courseId)
              : String(s.courseId)
            : 'unknown';

          if (typeof s.courseId === 'object' && s.courseId?.courseName) {
            courseNameById.set(cid, s.courseId.courseName);
          }

          courseCount.set(cid, (courseCount.get(cid) ?? 0) + 1);
        }

        const topCourses = [...courseCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([courseId, value]) => ({
            key: courseId,
            label: courseNameById.get(courseId) ?? courseNameByCatalogId.get(courseId) ?? 'Unknown course',
            value,
          }));

        const activeCourses = Number(coursesData?.total ?? coursesData?.items?.length ?? 0);

        setStats({ totalStudents, totalRevenue, totalPending, activeCourses, topCourses });
      } catch (err) {
        const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load dashboard';
        setError(msg);
        toast.error({ title: 'Dashboard error', message: msg });
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
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/students">
            <Button variant="primary">Manage Students</Button>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-sm text-gray-500">Total Students</div>
          {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <div className="mt-3 text-2xl font-semibold">{formatNumber(stats.totalStudents)}</div>}
        </Card>

        <Card className="p-5">
          <div className="text-sm text-gray-500">Total Revenue</div>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <div className="mt-3 text-2xl font-semibold">{formatNumber(stats.totalRevenue)}</div>
          )}
        </Card>

        <Card className="p-5">
          <div className="text-sm text-gray-500">Pending Fees</div>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <div className="mt-3 text-2xl font-semibold">{formatNumber(stats.totalPending)}</div>
          )}
        </Card>

        <Card className="p-5">
          <div className="text-sm text-gray-500">Active Courses</div>
          {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <div className="mt-3 text-2xl font-semibold">{formatNumber(stats.activeCourses)}</div>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-gray-900">Top Courses</div>
            </div>
            {loading ? <SkeletonLine className="w-24" /> : null}
          </div>

          {loading ? (
            <div className="mt-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : stats.topCourses.length ? (
            <div className="mt-4">
              <TopCoursesBarChart data={stats.topCourses} />
            </div>
          ) : (
            <EmptyState title="No course data" />
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="text-base font-semibold text-gray-900">Fees Breakdown</div>

          {loading ? (
            <div className="mt-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="mt-4">
              <FeeBreakdownBarChart paid={stats.totalRevenue} pending={stats.totalPending} />
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}

