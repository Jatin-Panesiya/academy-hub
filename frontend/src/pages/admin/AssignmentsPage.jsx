import { useEffect, useState } from 'react';

import { createAssignment, deleteAssignment, getAssignments } from '../../services/assignmentsApi.js';
import { fetchCourses } from '../../services/coursesApi.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Input from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';

export default function AssignmentsPage() {
  const toast = useToast();
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    courseId: '',
  });

  useEffect(() => {
    let mounted = true;
    async function loadAssignments() {
      setError('');
      setLoading(true);
      try {
        const data = await getAssignments();
        if (!mounted) return;
        setItems(data);
        const coursesRes = await fetchCourses({ page: 1, limit: 99 });
        if (!mounted) return;
        setCourses(coursesRes?.items ?? []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load assignments');
        toast.error({
          title: 'Assignments',
          message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load assignments',
        });
      }
      finally {
        if (mounted) setLoading(false);
      }
    }
    loadAssignments();
    return () => {
      mounted = false;
    };
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createAssignment({
        title: form.title.trim(),
        description: form.description.trim(),
        deadline: new Date(form.deadline),
        courseId: form.courseId,
      });
      setAssignmentModalOpen(false);
      setForm({ title: '', description: '', deadline: '', courseId: '' });
      toast.success({ title: 'Assignment created', message: 'New assignment added successfully.' });

      const data = await getAssignments();
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to create assignment');
      toast.error({
        title: 'Create failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to create assignment',
      });
    }
  }

  function onOpenAssignmentModal() {
    setAssignmentModalOpen(true);
  }

  async function onDeleteAssignment(id) {
    if (!id) return;
    const ok = window.confirm('Delete this assignment?');
    if (!ok) return;

    setError('');
    try {
      await deleteAssignment(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success({ title: 'Deleted', message: 'Assignment deleted successfully.' });
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete assignment';
      setError(msg);
      toast.error({ title: 'Delete failed', message: msg });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Assignments</h1>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <div className="flex justify-end">
          <Button variant="primary" type="button" onClick={onOpenAssignmentModal}>
            Add Assignment
          </Button>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="bg-[#F3F4F6]">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Course</th>
                <th className="px-3 py-2">Deadline</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t border-gray-200 text-sm">
                    <td className="px-3 py-2">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <Skeleton className="h-4 w-64" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <Skeleton className="h-8 w-20" />
                    </td>
                  </tr>
                ))
              ) : (items ?? []).map((a) => (
                <tr key={a._id} className="border-t border-gray-200 text-sm hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">{a.title}</td>
                  <td className="px-3 py-2 text-slate-600">{a.description}</td>
                  <td className="px-3 py-2 text-slate-600">{a.courseId?.courseName ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{formatDisplayDate(a.deadline)}</td>
                  <td className="px-3 py-2">
                    <Button variant="danger" type="button" onClick={() => onDeleteAssignment(a._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-sm text-slate-600">
                    <EmptyState title="No assignments found" message="Create a new assignment to get started." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={assignmentModalOpen}
        title="Add assignment"
        description="Enter assignment details to create a new record."
        onClose={() => setAssignmentModalOpen(false)}
      >
        <form onSubmit={onCreate} className="grid gap-3">
          <Input
            label="Title"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          />
          <div className="space-y-1">
            <label className="text-sm text-slate-700" htmlFor="assignment-course">
              Course
            </label>
            <select
              id="assignment-course"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              required
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAssignmentModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.title.trim() || !form.description.trim() || !form.deadline || !form.courseId} variant="primary" type="submit">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

