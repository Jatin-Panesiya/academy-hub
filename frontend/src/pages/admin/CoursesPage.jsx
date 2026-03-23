import { useEffect, useState } from 'react';

import { createCourse, deleteCourse, fetchCourses, updateCourse } from '../../services/coursesApi.js';

export default function CoursesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ id: '', courseName: '', duration: '', fees: '' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCourses({ page: 1, limit: 100, search });
      setItems(data?.items ?? []);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setForm({ id: '', courseName: '', duration: '', fees: '' });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to save course');
    }
  }

  async function onDelete(id) {
    if (!confirm('Delete this course?')) return;
    try {
      await deleteCourse(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete course');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Courses</h1>
          <p className="mt-1 text-sm text-slate-600">Create, update, and delete courses.</p>
        </div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded border border-slate-200 bg-white/70 p-4">
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            placeholder="Course name"
            value={form.courseName}
            onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
          />
          <input
            className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            type="number"
            placeholder="Duration"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          />
          <input
            className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            type="number"
            placeholder="Fees"
            value={form.fees}
            onChange={(e) => setForm((f) => ({ ...f, fees: e.target.value }))}
          />
          <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            {form.id ? 'Update Course' : 'Add Course'}
          </button>
        </form>
      </div>

      <div className="rounded border border-slate-200 bg-white/70 p-4">
        <div className="mb-3 flex gap-2">
          <input
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            placeholder="Search courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={load} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Search
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="bg-slate-100/70">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Fees</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((c) => (
                <tr key={c._id} className="border-t border-slate-200 text-sm">
                  <td className="px-3 py-2">{c.courseName}</td>
                  <td className="px-3 py-2 text-slate-600">{c.duration}</td>
                  <td className="px-3 py-2 text-slate-600">{c.fees}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      onClick={() =>
                        setForm({
                          id: c._id,
                          courseName: c.courseName ?? '',
                          duration: c.duration ?? '',
                          fees: c.fees ?? '',
                        })
                      }
                      className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(c._id)}
                      className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-sm text-slate-600">
                    No courses found.
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

