import { useEffect, useState } from 'react';

import { getAttendanceByStudent, markAttendance } from '../../services/attendanceApi.js';
import { fetchStudents } from '../../services/studentsApi.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';

export default function AttendancePage() {
  const toast = useToast();
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [markModalOpen, setMarkModalOpen] = useState(false);

  const [markForm, setMarkForm] = useState({
    studentId: '',
    date: '',
    status: 'present',
  });

  const [queryStudentId, setQueryStudentId] = useState('');

  async function loadAllAttendanceForStudents(studentList) {
    const maxConcurrency = 5;
    const pending = [...studentList];
    const allRows = [];

    async function runWorker() {
      while (pending.length) {
        const current = pending.pop();
        try {
          const data = await getAttendanceByStudent(current._id);
          const rows = Array.isArray(data) ? data : [];
          for (const row of rows) {
            allRows.push({
              ...row,
              studentId: row?.studentId ?? { _id: current._id, name: current.name, email: current.email },
            });
          }
        } catch (err) {
          const msg =
            err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load a student attendance history';
          toast.error({ title: 'Attendance', message: msg });
        }
      }
    }

    const workers = Array.from({ length: Math.min(maxConcurrency, studentList.length) }, () => runWorker());
    await Promise.all(workers);

    allRows.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    setItems(allRows);
  }

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError('');
      try {
        const studentData = await fetchStudents({ page: 1, limit: 100 });
        const studentItems = studentData?.items ?? [];
        setStudents(studentItems);

        if (!studentItems.length) {
          setItems([]);
          return;
        }

        await loadAllAttendanceForStudents(studentItems);
      } catch (err) {
        const message = err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load attendance';
        setError(message);
        toast.error({ title: 'Load failed', message });
      } finally {
        setLoading(false);
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
      setMarkModalOpen(false);
      setMarkForm({
        studentId: '',
        date: '',
        status: 'present',
      });
      await loadByStudent(queryStudentId);
      toast.success({ title: 'Attendance updated', message: 'Attendance marked successfully.' });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to mark attendance');
      toast.error({
        title: 'Attendance failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to mark attendance',
      });
    }
  }

  function onOpenMarkModal() {
    setMarkForm((f) => ({
      ...f,
      studentId: f.studentId || queryStudentId,
    }));
    setMarkModalOpen(true);
  }

  async function loadByStudent(studentId = queryStudentId) {
    setLoading(true);
    setError('');
    try {
      if (!studentId) {
        if (!students.length) {
          setItems([]);
          return;
        }
        await loadAllAttendanceForStudents(students);
      } else {
        const data = await getAttendanceByStudent(studentId);
        setItems(data);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load attendance by student');
      toast.error({
        title: 'Load failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load attendance by student',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <div className="flex justify-between w-full gap-3">
        <div className="flex gap-2 w-full">
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-blue-500/20 focus:border-blue-500"
            value={queryStudentId}
            onChange={(e) => {
              const selectedStudentId = e.target.value;
              setQueryStudentId(selectedStudentId);
              loadByStudent(selectedStudentId);
            }}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
        </div>
        <Button variant="primary" type="button" className="text-nowrap" onClick={onOpenMarkModal}>
          Add Attendance
        </Button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="p-5">
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="bg-[#F3F4F6]">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-t border-gray-200 text-sm">
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    <Skeleton className="h-4 w-28" />
                  </td>
                </tr>
              ))
            ) : (items ?? []).map((x) => (
              <tr key={x._id} className="border-t border-gray-200 text-sm hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2">{x.studentId?.name ?? x.studentId?._id ?? '-'}</td>
                <td className="px-3 py-2 text-slate-600">{x.status}</td>
                <td className="px-3 py-2 text-slate-600">{formatDisplayDate(x.date)}</td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-sm text-slate-600" colSpan={3}>
                  <EmptyState title="No attendance records" message="Mark attendance and then select a student timeline." />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </div>
      </Card>

      <Modal
        open={markModalOpen}
        title="Add attendance"
        description="Select student, date, and status to mark attendance."
        onClose={() => setMarkModalOpen(false)}
      >
        <form onSubmit={onMark} className="grid gap-3">
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-blue-500/20 focus:border-blue-500"
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
          <Input
            label="Date"
            type="date"
            value={markForm.date}
            onChange={(e) => setMarkForm((f) => ({ ...f, date: e.target.value }))}
          />
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-blue-500/20 focus:border-blue-500"
            value={markForm.status}
            onChange={(e) => setMarkForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="present">present</option>
            <option value="absent">absent</option>
            <option value="late">late</option>
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setMarkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={loading || !markForm.studentId || !markForm.date || !markForm.status} type="submit">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

