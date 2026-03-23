import { useEffect, useState } from 'react';

import { createAssignment, getAssignmentsByBatch } from '../../services/assignmentsApi.js';
import { fetchBatches } from '../../services/batchesApi.js';

export default function AssignmentsPage() {
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    batchId: '',
    deadline: '',
  });
  const [batchIdForList, setBatchIdForList] = useState('');

  useEffect(() => {
    async function loadBatches() {
      try {
        const data = await fetchBatches({ page: 1, limit: 100 });
        setBatches(data?.items ?? []);
      } catch {
        // no-op
      }
    }
    loadBatches();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createAssignment({
        title: form.title.trim(),
        description: form.description.trim(),
        batchId: form.batchId,
        deadline: new Date(form.deadline),
      });
      setForm({ title: '', description: '', batchId: '', deadline: '' });
      alert('Assignment created');
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to create assignment');
    }
  }

  async function onLoad() {
    setError('');
    try {
      const data = await getAssignmentsByBatch(batchIdForList);
      setItems(data);
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load assignments');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="mt-1 text-sm text-slate-600">Create assignments and view by batch.</p>
      </div>
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={onCreate} className="rounded border border-slate-200 bg-white/70 p-4 grid gap-3 md:grid-cols-2">
        <input
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <select
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          value={form.batchId}
          onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
        >
          <option value="">Select batch</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.batchName}
            </option>
          ))}
        </select>
        <textarea
          className="md:col-span-2 min-h-[90px] rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <input
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          type="date"
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Add Assignment
        </button>
      </form>

      <div className="rounded border border-slate-200 bg-white/70 p-4">
        <div className="flex gap-2">
          <select
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            value={batchIdForList}
            onChange={(e) => setBatchIdForList(e.target.value)}
          >
            <option value="">Select batch</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName}
              </option>
            ))}
          </select>
          <button onClick={onLoad} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Load
          </button>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="bg-slate-100/70">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((a) => (
                <tr key={a._id} className="border-t border-slate-200 text-sm">
                  <td className="px-3 py-2">{a.title}</td>
                  <td className="px-3 py-2 text-slate-600">{a.description}</td>
                  <td className="px-3 py-2 text-slate-600">{a.deadline ? new Date(a.deadline).toLocaleDateString() : ''}</td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-sm text-slate-600">
                    No assignments found.
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

