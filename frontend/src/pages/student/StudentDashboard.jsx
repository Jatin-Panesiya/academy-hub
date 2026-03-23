import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../services/api.js';
import { submitAssignment } from '../../services/submissionsApi.js';

function uniq(arr) {
  return [...new Set(arr)];
}

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(String(id ?? '').trim());
}

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function getBatchLabel(batchRef) {
  if (!batchRef) return '';
  if (typeof batchRef === 'object') {
    if (batchRef.batchName) return batchRef.batchName;
    if (batchRef.courseId?.courseName) return batchRef.courseId.courseName;
    if (batchRef._id) return String(batchRef._id);
  }
  return String(batchRef);
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [feeSummary, setFeeSummary] = useState({
    paidTotal: 0,
    pendingFees: 0,
    student: null,
  });

  const [attendance, setAttendance] = useState([]);

  const availableBatches = useMemo(() => {
    const list = attendance.map((a) => ({
      id: String(a.batchId?._id ?? a.batchId ?? ''),
      label: getBatchLabel(a.batchId),
    }));
    const uniqueIds = uniq(list.map((x) => x.id).filter(Boolean));
    return uniqueIds.map((id) => list.find((x) => x.id === id) ?? { id, label: id });
  }, [attendance]);

  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({ assignmentId: '', fileUrl: '' });

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!studentId) {
        setError('Authenticated student id is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [feeResult, attResult] = await Promise.allSettled([
          api.get(`/api/payments/student/${studentId}`),
          api.get(`/api/attendance/student/${studentId}`),
        ]);

        if (!mounted) return;

        let combinedError = '';
        if (feeResult.status === 'fulfilled') {
          const feeRes = feeResult.value;
          setFeeSummary({
            paidTotal: feeRes.data?.paidTotal ?? 0,
            pendingFees: feeRes.data?.pendingFees ?? 0,
            student: feeRes.data?.student ?? null,
          });
        } else {
          combinedError = feeResult.reason?.response?.data?.error?.message ?? feeResult.reason?.message ?? 'Failed to load fee summary';
        }

        if (attResult.status === 'fulfilled') {
          const attRes = attResult.value;
          const items = Array.isArray(attRes.data?.items) ? attRes.data.items : [];
          setAttendance(items);

          const batchIdFromAttendance =
            items
              .map((a) => String(a.batchId?._id ?? a.batchId ?? ''))
              .filter(Boolean)[0] ?? '';

          setSelectedBatchId((prev) => prev || batchIdFromAttendance);
        } else {
          const attendanceError =
            attResult.reason?.response?.data?.error?.message ?? attResult.reason?.message ?? 'Failed to load attendance';
          combinedError = combinedError ? `${combinedError} | ${attendanceError}` : attendanceError;
          setAttendance([]);
        }

        if (combinedError) setError(combinedError);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  useEffect(() => {
    let mounted = true;
    async function loadAssignments() {
      setAssignmentsError('');
      setAssignmentsLoading(true);
      setAssignments([]);

      if (!selectedBatchId || !isValidObjectId(selectedBatchId)) {
        setAssignmentsLoading(false);
        return;
      }

      try {
        const res = await api.get(`/api/assignments/batch/${selectedBatchId}`);
        if (!mounted) return;
        setAssignments(res.data?.items ?? []);
      } catch (err) {
        if (!mounted) return;
        setAssignmentsError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load assignments');
      } finally {
        if (mounted) setAssignmentsLoading(false);
      }
    }

    loadAssignments();
    return () => {
      mounted = false;
    };
  }, [selectedBatchId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">View attendance, assignments, and fee status.</p>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">Loading…</div>
      ) : (
        <>
          <section className="rounded border border-slate-200 bg-white/70 p-4">
            <h2 className="text-base font-semibold">Fee Status</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-slate-200 bg-slate-100/60 p-4">
                <div className="text-xs text-slate-500">Paid</div>
                <div className="mt-2 text-2xl font-semibold">{feeSummary.paidTotal}</div>
              </div>
              <div className="rounded border border-slate-200 bg-slate-100/60 p-4">
                <div className="text-xs text-slate-500">Pending</div>
                <div className="mt-2 text-2xl font-semibold">{feeSummary.pendingFees}</div>
              </div>
              <div className="sm:col-span-2 rounded border border-slate-200 bg-slate-100/60 p-4">
                <div className="text-xs text-slate-500">Student</div>
                <div className="mt-2 font-medium">{feeSummary.student?.name ?? user?.name ?? '—'}</div>
                <div className="text-sm text-slate-600">{feeSummary.student?.email ?? user?.email ?? ''}</div>
              </div>
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white/70 p-4">
            <h2 className="text-base font-semibold">Attendance</h2>

            <div className="mt-3">
              <div className="text-xs text-slate-500">
                Showing latest records {attendance.length ? `(${attendance.length})` : ''}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded border border-slate-200">
              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-[720px] w-full border-collapse">
                  <thead className="bg-slate-100/70">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3 font-medium">Batch</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-sm text-slate-600">
                          No attendance records yet.
                        </td>
                      </tr>
                    ) : (
                      attendance.map((a) => (
                        <tr key={a._id} className="border-t border-slate-200">
                          <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-900">
                            {a.batchId?.batchName ?? a.batchId?.courseId ?? a.batchId?._id ?? '—'}
                          </td>
                          <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-900">{a.status}</td>
                          <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                            {formatDate(a.date)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold">Submit Assignment</h3>
              <div className="mt-1 text-xs text-slate-500">Student-only submission endpoint.</div>

              <form
                className="mt-3 grid gap-3 md:grid-cols-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmissionError('');
                  setSubmissionLoading(true);
                  try {
                    await submitAssignment({
                      assignmentId: submissionForm.assignmentId.trim(),
                      fileUrl: submissionForm.fileUrl.trim(),
                    });
                    setSubmissionForm({ assignmentId: '', fileUrl: '' });
                    alert('Assignment submitted');
                  } catch (err) {
                    setSubmissionError(
                      err?.response?.data?.error?.message ?? err?.message ?? 'Failed to submit assignment'
                    );
                  } finally {
                    setSubmissionLoading(false);
                  }
                }}
              >
                <select
                  className="rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  value={submissionForm.assignmentId}
                  onChange={(e) => setSubmissionForm((f) => ({ ...f, assignmentId: e.target.value }))}
                >
                  <option value="">Select assignment</option>
                  {assignments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.title}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500 md:col-span-2"
                  placeholder="File URL"
                  value={submissionForm.fileUrl}
                  onChange={(e) => setSubmissionForm((f) => ({ ...f, fileUrl: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={submissionLoading}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {submissionLoading ? 'Submitting…' : 'Submit'}
                </button>
              </form>
              {submissionError ? (
                <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submissionError}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded border border-slate-200 bg-white/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Assignments</h2>
                <p className="mt-1 text-sm text-slate-600">Loaded for your selected batch.</p>
              </div>
              <div className="space-y-1 sm:min-w-[320px]">
                <label className="text-xs text-slate-500">Batch</label>
                <select
                  className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  disabled={availableBatches.length === 0}
                >
                  {availableBatches.length === 0 ? <option value="">No batches found in attendance</option> : null}
                  {availableBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {assignmentsError ? (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {assignmentsError}
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded border border-slate-200">
              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-[720px] w-full border-collapse">
                  <thead className="bg-slate-100/70">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentsLoading ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-sm text-slate-600">
                          Loading…
                        </td>
                      </tr>
                    ) : assignments.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-sm text-slate-600">
                          {availableBatches.length === 0 ? 'No batch context found for this student yet.' : 'No assignments found for this batch.'}
                        </td>
                      </tr>
                    ) : (
                      assignments.map((a) => (
                        <tr key={a._id} className="border-t border-slate-200">
                          <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-900">
                            <div className="font-medium">{a.title}</div>
                            <div className="text-xs text-slate-500">{a.description}</div>
                          </td>
                          <td className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                            {formatDate(a.deadline)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

