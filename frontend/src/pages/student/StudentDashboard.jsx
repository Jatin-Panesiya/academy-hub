import { useEffect, useState } from 'react';

import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../services/api.js';
import { submitAssignment } from '../../services/submissionsApi.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const studentId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [feeSummary, setFeeSummary] = useState({
    paidTotal: 0,
    pendingFees: 0,
    student: null,
  });

  const [attendance, setAttendance] = useState([]);

  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({ assignmentId: '', fileUrl: '' });
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

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
      if (!studentId) return;
      setAssignmentsError('');
      setAssignmentsLoading(true);
      setAssignments([]);

      try {
        const res = await api.get('/api/assignments');
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
  }, [studentId]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">Loading…</div>
      ) : (
        <>
          <section className="rounded border border-slate-200 bg-white/70 p-4">
            <h2 className="text-base font-semibold">Fee Status</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded border border-slate-200 bg-slate-100/60 p-4">
                <div className="text-xs text-slate-500">Paid</div>
                <div className="mt-2 text-2xl font-semibold">{feeSummary.paidTotal}</div>
              </div>
              <div className="rounded border border-slate-200 bg-slate-100/60 p-4">
                <div className="text-xs text-slate-500">Pending</div>
                <div className="mt-2 text-2xl font-semibold">{feeSummary.pendingFees}</div>
              </div>
              <div className="rounded border border-slate-200 bg-slate-100/60 p-4">
                <div className="text-xs text-slate-500">Course Details</div>
                <div className="mt-2 font-medium">{feeSummary.student?.course?.courseName ?? '—'}</div>
                <div className="text-sm text-slate-600">
                  Duration: {feeSummary.student?.course?.duration ?? '—'} months
                </div>
                <div className="text-sm text-slate-600">
                  Course Fees: {feeSummary.student?.course?.fees ?? '—'}
                </div>
              </div>
            </div>
          </section>

          <Card className="p-5">
            <h2 className="text-base font-semibold">Attendance</h2>


            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-[720px] w-full border-collapse">
                  <thead className="bg-[#F3F4F6]">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-sm text-slate-600">
                          <EmptyState title="No attendance records" message="Once attendance is marked, it will appear here." />
                        </td>
                      </tr>
                    ) : (
                      attendance.map((a) => (
                        <tr key={a._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-900">{a.status}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDisplayDate(a.date)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Assignments</h2>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setSubmissionError('');
                  setIsSubmitModalOpen(true);
                }}
              >
                Submit Assignment
              </Button>
            </div>

            {assignmentsError ? (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {assignmentsError}
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <div className="max-h-[320px] overflow-auto">
                <table className="min-w-[720px] w-full border-collapse">
                  <thead className="bg-[#F3F4F6]">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`sk-${i}`} className="border-t border-gray-200 text-sm">
                          <td className="px-4 py-3">
                            <Skeleton className="h-4 w-44" />
                            <div className="mt-2">
                              <Skeleton className="h-3 w-56" />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-4 w-28" />
                          </td>
                        </tr>
                      ))
                    ) : assignments.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-sm text-slate-600">
                          <EmptyState title="No assignments found" message="Check back later when assignments are published." />
                        </td>
                      </tr>
                    ) : (
                      assignments.map((a) => (
                        <tr key={a._id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-900">
                            <div className="font-medium">{a.title}</div>
                            <div className="text-xs text-slate-500">{a.description}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDisplayDate(a.deadline)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {isSubmitModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">Submit Assignment</h3>
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="rounded-md text-2xl text-slate-600 hover:bg-slate-100"
                    aria-label="Close submit assignment modal"
                  >
                    &times;
                  </button>
                </div>

                <form
                  className="mt-4 grid gap-3"
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
                      setIsSubmitModalOpen(false);
                      toast.success({ title: 'Submitted', message: 'Assignment submitted successfully.' });
                    } catch (err) {
                      const msg =
                        err?.response?.data?.error?.message ?? err?.message ?? 'Failed to submit assignment';
                      setSubmissionError(msg);
                      toast.error({ title: 'Submit failed', message: msg });
                    } finally {
                      setSubmissionLoading(false);
                    }
                  }}
                >
                  <select
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
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
                  <Input
                    placeholder="File URL"
                    value={submissionForm.fileUrl}
                    onChange={(e) => setSubmissionForm((f) => ({ ...f, fileUrl: e.target.value }))}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submissionLoading || !submissionForm.assignmentId || !submissionForm.fileUrl} variant="primary">
                      {submissionLoading ? 'Submitting…' : 'Submit'}
                    </Button>
                  </div>
                </form>
                {submissionError ? (
                  <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {submissionError}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

