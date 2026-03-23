import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchStudents, resetStudentPassword } from '../../services/studentsApi.js';

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function shortId(id) {
  if (!id) return '';
  const s = String(id);
  return s.length <= 6 ? s : `${s.slice(0, 4)}…${s.slice(-2)}`;
}

function buildPageNumbers(current, total) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const cur = Math.max(1, Math.min(Number(current) || 1, safeTotal));

  // Show at most 7 page numbers: [1] … [near current] … [last]
  const windowSize = 7;
  if (safeTotal <= windowSize) return Array.from({ length: safeTotal }, (_, i) => i + 1);

  const start = Math.max(1, cur - 2);
  const end = Math.min(safeTotal, cur + 2);

  const pages = new Set([1, safeTotal]);
  for (let p = start; p <= end; p++) pages.add(p);

  return [...pages].sort((a, b) => a - b);
}

export default function StudentsList() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [resetInfo, setResetInfo] = useState(null);
  const [resettingId, setResettingId] = useState('');

  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchStudents({ page, limit, search });
        if (!mounted) return;

        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total ?? 0));
        setTotalPages(Number(data?.totalPages ?? 1));
      } catch (err) {
        setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load students');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [page, limit, search]);

  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput('');
    setPage(1);
    setSearch('');
  }

  function onEdit(student) {
    navigate(`/admin/students/${student._id}/edit`, { state: { student } });
  }

  async function onResetPassword(student) {
    setError('');
    setResetInfo(null);
    setResettingId(student._id);
    try {
      const res = await resetStudentPassword(student._id);
      setResetInfo(res?.onboarding ?? null);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to reset student password');
    } finally {
      setResettingId('');
    }
  }

  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(total, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="mt-1 text-sm text-slate-600">Search, filter, and manage student records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/students/new')}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add Student
          </button>
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-white/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-slate-500">Search (name/email)</label>
            <input
              className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
              placeholder="e.g. john@example.com"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch();
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Limit</label>
              <select
                className="rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={applySearch}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearSearch}
              className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500">
          {loading ? 'Loading…' : total ? `Showing ${from}-${to} of ${total}` : 'No results'}
        </div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {resetInfo ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <div className="font-semibold">Temporary password generated</div>
          <div className="mt-1">Email: {resetInfo.email}</div>
          <div className="mt-1">
            Temp Password: <span className="font-semibold">{resetInfo.temporaryPassword}</span>
          </div>
          <div className="mt-1 text-xs">Share once with the student. They must change password on next login.</div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded border border-slate-200 bg-white/70">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse">
            <thead className="bg-slate-100/70">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Fees</th>
                <th className="px-4 py-3 font-medium">Join Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-600" colSpan={8}>
                    {loading ? 'Loading…' : 'No students found.'}
                  </td>
                </tr>
              ) : (
                items.map((s) => {
                  const pending = Math.max(0, (Number(s.feesTotal) || 0) - (Number(s.feesPaid) || 0));
                  return (
                    <tr key={s._id} className="border-t border-slate-200 text-sm text-slate-900">
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.email}</td>
                      <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                      <td className="px-4 py-3 text-slate-600">{shortId(s.courseId)}</td>
                      <td className="px-4 py-3 text-slate-600">{shortId(s.batchId)}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-600">
                          Paid: {Number(s.feesPaid) || 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          Pending: {pending}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(s.joinDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(s)}
                            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onResetPassword(s)}
                            disabled={resettingId === s._id}
                            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          >
                            {resettingId === s._id ? 'Resetting…' : 'Reset Password'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Prev
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`rounded px-3 py-1 text-sm ${
                p === page
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

