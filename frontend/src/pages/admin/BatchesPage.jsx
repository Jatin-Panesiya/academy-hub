import { useEffect, useState } from 'react';

import { assignStudentsToBatch, createBatch, fetchBatches } from '../../services/batchesApi.js';
import { fetchCourses } from '../../services/coursesApi.js';
import { fetchStudents } from '../../services/studentsApi.js';

export default function BatchesPage() {
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ batchName: '', courseId: '', schedule: '', startDate: '' });
  const [assignForm, setAssignForm] = useState({ batchId: '', studentIds: [] });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [batchesData, coursesData, studentsData] = await Promise.all([
        fetchBatches({ page: 1, limit: 100, search: '' }),
        fetchCourses({ page: 1, limit: 100, search: '' }),
        fetchStudents({ page: 1, limit: 100, search: '' }),
      ]);
      setItems(batchesData?.items ?? []);
      setCourses(coursesData?.items ?? []);
      setStudents(studentsData?.items ?? []);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createBatch({
        batchName: form.batchName.trim(),
        courseId: form.courseId,
        schedule: form.schedule.trim(),
        startDate: new Date(form.startDate),
      });
      setForm({ batchName: '', courseId: '', schedule: '', startDate: '' });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to create batch');
    }
  }

  async function onAssignStudents(e) {
    e.preventDefault();
    setError('');
    try {
      const studentIds = assignForm.studentIds;
      await assignStudentsToBatch(assignForm.batchId, studentIds);
      setAssignForm({ batchId: '', studentIds: [] });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to assign students');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Batches</h1>
        <p className="mt-1 text-sm text-slate-600">Create batches and assign students.</p>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={onCreate} className="rounded border border-slate-200 bg-white/70 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Create Batch</h2>
          <input
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            placeholder="Batch name"
            value={form.batchName}
            onChange={(e) => setForm((f) => ({ ...f, batchName: e.target.value }))}
          />
          <select
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            value={form.courseId}
            onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
          >
            <option value="">Select course</option>
            {(courses ?? []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.courseName}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            placeholder="Schedule"
            value={form.schedule}
            onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
          />
          <input
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
          <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Add Batch
          </button>
        </form>

        <form onSubmit={onAssignStudents} className="rounded border border-slate-200 bg-white/70 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Assign Students to Batch</h2>
          <select
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            value={assignForm.batchId}
            onChange={(e) => setAssignForm((f) => ({ ...f, batchId: e.target.value }))}
          >
            <option value="">Select batch</option>
            {(items ?? []).map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName}
              </option>
            ))}
          </select>
          <select
            multiple
            className="min-h-[128px] w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            value={assignForm.studentIds}
            onChange={(e) => {
              const values = [...e.target.selectedOptions].map((opt) => opt.value);
              setAssignForm((f) => ({ ...f, studentIds: values }));
            }}
          >
            {(students ?? []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-500">Tip: Hold Ctrl (Cmd on Mac) to select multiple students.</div>
          <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Assign Students
          </button>
        </form>
      </div>

      <div className="rounded border border-slate-200 bg-white/70 p-4">
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="bg-slate-100/70">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2">Batch</th>
                <th className="px-3 py-2">Course</th>
                <th className="px-3 py-2">Schedule</th>
                <th className="px-3 py-2">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((b) => (
                <tr key={b._id} className="border-t border-slate-200 text-sm">
                  <td className="px-3 py-2">{b.batchName}</td>
                  <td className="px-3 py-2 text-slate-600">{b.courseId?.courseName ?? b.courseId ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-600">{b.schedule}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {b.startDate ? new Date(b.startDate).toLocaleDateString() : ''}
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-sm text-slate-600" colSpan={4}>
                    No batches found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

