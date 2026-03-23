import { useEffect, useState } from 'react';

import { getAttendanceByBatch, getAttendanceByStudent, markAttendance } from '../../services/attendanceApi.js';
import { fetchBatches } from '../../services/batchesApi.js';
import { fetchStudents } from '../../services/studentsApi.js';

export default function AttendancePage() {
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);

  const [markForm, setMarkForm] = useState({
    studentId: '',
    batchId: '',
    date: '',
    status: 'present',
  });

  const [queryBatchId, setQueryBatchId] = useState('');
  const [queryStudentId, setQueryStudentId] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [batchData, studentData] = await Promise.all([
          fetchBatches({ page: 1, limit: 100 }),
          fetchStudents({ page: 1, limit: 100 }),
        ]);
        setBatches(batchData?.items ?? []);
        setStudents(studentData?.items ?? []);
      } catch {
        // no-op; page can still work with existing selections
      }
    }
    loadCatalog();
  }, []);

  async function onMark(e) {
    e.preventDefault();
    setError('');
    try {
      await markAttendance({
        ...markForm,
        date: new Date(markForm.date),
      });
      alert('Attendance marked');
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to mark attendance');
    }
  }

  async function loadByBatch() {
    setLoading(true);
    setError('');
    try {
      const data = await getAttendanceByBatch(queryBatchId);
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load attendance by batch');
    } finally {
      setLoading(false);
    }
  }

  async function loadByStudent() {
    setLoading(true);
    setError('');
    try {
      const data = await getAttendanceByStudent(queryStudentId);
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load attendance by student');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">Mark attendance and view records by batch or student.</p>
      </div>
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={onMark} className="rounded border border-slate-200 bg-white/70 p-4 grid gap-3 md:grid-cols-5">
        <select
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          value={markForm.studentId}
          onChange={(e) => setMarkForm((f) => ({ ...f, studentId: e.target.value }))}
        >
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
        <select
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          value={markForm.batchId}
          onChange={(e) => setMarkForm((f) => ({ ...f, batchId: e.target.value }))}
        >
          <option value="">Select batch</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.batchName}
            </option>
          ))}
        </select>
        <input
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          type="date"
          value={markForm.date}
          onChange={(e) => setMarkForm((f) => ({ ...f, date: e.target.value }))}
        />
        <select
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          value={markForm.status}
          onChange={(e) => setMarkForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="present">present</option>
          <option value="absent">absent</option>
          <option value="late">late</option>
        </select>
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Mark
        </button>
      </form>

      <div className="rounded border border-slate-200 bg-white/70 p-4 grid gap-3 md:grid-cols-2">
        <div className="flex gap-2">
          <select
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            value={queryBatchId}
            onChange={(e) => setQueryBatchId(e.target.value)}
          >
            <option value="">Select batch</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName}
              </option>
            ))}
          </select>
          <button onClick={loadByBatch} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            By Batch
          </button>
        </div>
        <div className="flex gap-2">
          <select
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            value={queryStudentId}
            onChange={(e) => setQueryStudentId(e.target.value)}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <button onClick={loadByStudent} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            By Student
          </button>
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-white/70 p-4 overflow-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="bg-slate-100/70">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((x) => (
              <tr key={x._id} className="border-t border-slate-200 text-sm">
                <td className="px-3 py-2">{x.studentId?.name ?? x.studentId?._id ?? '-'}</td>
                <td className="px-3 py-2 text-slate-600">{x.batchId?.batchName ?? x.batchId?._id ?? '-'}</td>
                <td className="px-3 py-2 text-slate-600">{x.status}</td>
                <td className="px-3 py-2 text-slate-600">{x.date ? new Date(x.date).toLocaleDateString() : ''}</td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-sm text-slate-600" colSpan={4}>
                  No attendance data.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

