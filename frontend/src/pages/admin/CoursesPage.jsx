import { useEffect, useState } from 'react';

import { createCourse, deleteCourse, fetchCourses, updateCourse } from '../../services/coursesApi.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';

export default function CoursesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ id: '', courseName: '', duration: '', fees: '' });
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const isCourseFormValid =
    Boolean(form.courseName?.trim()) &&
    Boolean(form.duration?.toString().trim()) &&
    Boolean(form.fees?.toString().trim());

  async function load(searchTerm = search) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCourses({ page: 1, limit: 100, search: searchTerm });
      setItems(data?.items ?? []);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load courses');
      toast.error({
        title: 'Courses',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load courses',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(search);
  }, [search]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        courseName: form.courseName.trim(),
        duration: Number(form.duration),
        fees: Number(form.fees),
      };
      if (form.id) await updateCourse(form.id, payload);
      else await createCourse(payload);
      setCourseModalOpen(false);
      setForm({ id: '', courseName: '', duration: '', fees: '' });
      await load();
      toast.success({ title: 'Course saved', message: 'Course details updated successfully.' });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to save course');
      toast.error({
        title: 'Save failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to save course',
      });
    }
  }

  async function onDelete(id) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  function onOpenAddCourse() {
    setForm({ id: '', courseName: '', duration: '', fees: '' });
    setCourseModalOpen(true);
  }

  function onOpenEditCourse(course) {
    setForm({
      id: course._id,
      courseName: course.courseName ?? '',
      duration: course.duration ?? '',
      fees: course.fees ?? '',
    });
    setCourseModalOpen(true);
  }

  async function onConfirmDelete() {
    try {
      await deleteCourse(deleteId);
      setDeleteOpen(false);
      setDeleteId('');
      await load();
      toast.success({ title: 'Course deleted', message: 'Course removed successfully.' });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete course');
      toast.error({
        title: 'Delete failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete course',
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Courses</h1>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <div className="mb-3 flex gap-2">
          <Input
            placeholder="Search courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="primary" type="button" className="text-nowrap" onClick={onOpenAddCourse}>
            Add Course
          </Button>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="bg-[#F3F4F6]">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Fees</th>
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
                    <td className="px-3 py-2 text-slate-600">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (items ?? []).map((c) => (
                <tr key={c._id} className="border-t border-gray-200 text-sm hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">{c.courseName}</td>
                  <td className="px-3 py-2 text-slate-600">{c.duration}</td>
                  <td className="px-3 py-2 text-slate-600">{c.fees}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => onOpenEditCourse(c)}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" type="button" onClick={() => onDelete(c._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-sm text-slate-600">
                    <EmptyState title="No courses found" message="Try adding a new course." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={courseModalOpen}
        title={form.id ? 'Edit course' : 'Add course'}
        description={form.id ? 'Update course details and save your changes.' : 'Enter course details to create a new course.'}
        onClose={() => setCourseModalOpen(false)}
      >
        <form onSubmit={onSubmit} className="grid gap-3">
          <Input
            label="Course Name"
            placeholder="Course name"
            value={form.courseName}
            onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
          />
          <Input
            label="Duration"
            type="number"
            placeholder="Duration"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          />
          <Input
            label="Fees"
            type="number"
            placeholder="Fees"
            value={form.fees}
            onChange={(e) => setForm((f) => ({ ...f, fees: e.target.value }))}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setCourseModalOpen(false);
                setForm({ id: '', courseName: '', duration: '', fees: '' });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!isCourseFormValid}>
              {form.id ? 'Update Course' : 'Add Course'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete this course?"
        description="This action cannot be undone."
        onClose={() => setDeleteOpen(false)}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" type="button" onClick={onConfirmDelete}>
            Delete course
          </Button>
        </div>
      </Modal>
    </div>
  );
}

