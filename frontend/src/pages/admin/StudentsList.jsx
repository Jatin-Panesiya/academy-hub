import { useEffect, useMemo, useState } from 'react';

import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { fetchCourses } from '../../services/catalogApi.js';
import { createStudent, deleteStudent, fetchStudents, resetStudentPassword, updateStudent } from '../../services/studentsApi.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';

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

function isValidObjectId(id) {
  if (!id) return false;
  return /^[a-fA-F0-9]{24}$/.test(String(id));
}

function extractId(ref) {
  if (!ref) return '';
  if (typeof ref === 'object') return String(ref._id ?? ref.id ?? '');
  return String(ref);
}

export default function StudentsList() {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [resetInfo, setResetInfo] = useState(null);
  const [resettingId, setResettingId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    courseId: '',
    feesTotal: '',
    feesPaid: '',
    joinDate: '',
  });
  const [addFieldErrors, setAddFieldErrors] = useState({});

  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);
  const courseNameById = useMemo(() => {
    const map = new Map();
    for (const c of courses) {
      if (c?._id) map.set(String(c._id), c.courseName ?? String(c._id));
    }
    return map;
  }, [courses]);

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
        toast.error({
          title: 'Students',
          message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load students',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [page, limit, search, refreshKey]);

  function clearSearch() {
    setPage(1);
    setSearch('');
  }

  useEffect(() => {
    let mounted = true;

    async function loadCoursesCatalog() {
      setCatalogLoading(true);
      try {
        const data = await fetchCourses({ page: 1, limit: 100 });
        if (!mounted) return;
        setCourses(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setCourses([]);
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    }

    loadCoursesCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  function openAddModal() {
    setEditingId('');
    setAddFieldErrors({});
    setAddForm({
      name: '',
      email: '',
      phone: '',
      courseId: '',
      feesTotal: '',
      feesPaid: '',
      joinDate: '',
    });
    setAddOpen(true);
  }

  function validateAddForm() {
    const errors = {};
    if (!addForm.name.trim()) errors.name = 'Name is required.';
    if (!addForm.email.trim()) errors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(addForm.email.trim())) errors.email = 'Enter a valid email address.';
    if (!addForm.phone.trim()) errors.phone = 'Phone is required.';
    if (!isValidObjectId(addForm.courseId)) errors.courseId = 'Select a valid course.';

    const feesTotalNum = Number(addForm.feesTotal);
    const feesPaidNum = Number(addForm.feesPaid);
    if (!Number.isFinite(feesTotalNum) || feesTotalNum < 0) errors.feesTotal = 'Fees total must be >= 0.';
    if (!Number.isFinite(feesPaidNum) || feesPaidNum < 0) errors.feesPaid = 'Fees paid must be >= 0.';
    if (!addForm.joinDate || Number.isNaN(new Date(addForm.joinDate).getTime())) errors.joinDate = 'Join date is required.';
    return errors;
  }

  async function onAddStudent(e) {
    e.preventDefault();
    setError('');
    const errors = validateAddForm();
    if (Object.keys(errors).length) {
      setAddFieldErrors(errors);
      return;
    }
    setAddFieldErrors({});
    setAddSubmitting(true);
    try {
      const payload = {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        courseId: addForm.courseId,
        feesTotal: Number(addForm.feesTotal),
        feesPaid: Number(addForm.feesPaid),
        joinDate: new Date(addForm.joinDate),
      };
      if (editingId) await updateStudent(editingId, payload);
      else await createStudent(payload);
      setAddOpen(false);
      setEditingId('');
      setRefreshKey((k) => k + 1);
      toast.success({
        title: editingId ? 'Student updated' : 'Student created',
        message: editingId ? 'Student updated successfully.' : 'Student added successfully.',
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to save student');
      toast.error({
        title: 'Save failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to save student',
      });
    } finally {
      setAddSubmitting(false);
    }
  }

  function onEdit(student) {
    setEditingId(student._id);
    setAddFieldErrors({});
    setAddForm({
      name: student.name ?? '',
      email: student.email ?? '',
      phone: student.phone ?? '',
      courseId: extractId(student.courseId),
      feesTotal: student.feesTotal ?? '',
      feesPaid: student.feesPaid ?? '',
      joinDate: student.joinDate ? new Date(student.joinDate).toISOString().slice(0, 10) : '',
    });
    setAddOpen(true);
  }

  async function onResetPassword(student) {
    setError('');
    setResetInfo(null);
    setResettingId(student._id);
    try {
      const res = await resetStudentPassword(student._id);
      setResetInfo(res?.onboarding ?? null);
      toast.success({ title: 'Password reset', message: 'Temporary credentials generated successfully.' });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to reset student password');
      toast.error({
        title: 'Reset failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to reset student password',
      });
    } finally {
      setResettingId('');
    }
  }

  function onDelete(student) {
    setDeleteId(student._id);
    setDeleteOpen(true);
  }

  async function onConfirmDelete() {
    setError('');
    setDeleting(true);
    try {
      await deleteStudent(deleteId);
      setDeleteOpen(false);
      setDeleteId('');
      setRefreshKey((k) => k + 1);
      toast.success({ title: 'Student deleted', message: 'Student removed successfully.' });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete student');
      toast.error({
        title: 'Delete failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete student',
      });
    } finally {
      setDeleting(false);
    }
  }

  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(total, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <Input
              placeholder="e.g. john@example.com"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" type="button" className="text-nowrap" onClick={openAddModal}>
              Add Student
            </Button>
          </div>
        </div>

      </Card>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {resetInfo ? (
        <Card className="p-5">
          <div className="font-semibold">Temporary password generated</div>
          <div className="mt-1">Email: {resetInfo.email}</div>
          <div className="mt-1">
            Temp Password: <span className="font-semibold">{resetInfo.temporaryPassword}</span>
          </div>
          <div className="mt-1 text-xs">Share once with the student. They must change password on next login.</div>
        </Card>
      ) : null}

      <Card className="p-0">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse">
            <thead className="bg-[#F3F4F6]">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Fees</th>
                <th className="px-4 py-3 font-medium">Join Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: Math.min(6, limit) }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-28" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-600" colSpan={7}>
                    <EmptyState title="No students found" message="Try adjusting your search or adding a new student." />
                  </td>
                </tr>
              ) : (
                items.map((s) => {
                  const pending = Math.max(0, (Number(s.feesTotal) || 0) - (Number(s.feesPaid) || 0));
                  return (
                    <tr
                      key={s._id}
                      className="border-t border-gray-200 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.email}</td>
                      <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {typeof s.courseId === 'object' && s.courseId?.courseName
                          ? s.courseId.courseName
                          : courseNameById.get(extractId(s.courseId)) ?? shortId(s.courseId)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-600">
                          Paid: {Number(s.feesPaid) || 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          Pending: {pending}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDisplayDate(s.joinDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            type="button"
                            onClick={() => onEdit(s)}
                            className="px-3 py-1.5 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() => onResetPassword(s)}
                            disabled={resettingId === s._id}
                            className="px-3 py-1.5 text-xs"
                          >
                            {resettingId === s._id ? 'Resetting…' : 'Reset Password'}
                          </Button>
                          <Button
                            variant="danger"
                            type="button"
                            onClick={() => onDelete(s)}
                            className="px-3 py-1.5 text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 text-sm"
          >
            Prev
          </Button>

          {pageNumbers.map((p) => (
            <Button
              variant={p === page ? 'primary' : 'secondary'}
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className="px-3 py-1 text-sm"
            >
              {p}
            </Button>
          ))}

          <Button
            variant="secondary"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 text-sm"
          >
            Next
          </Button>
        </div>
      </div>

      <Modal
        open={addOpen}
        title={editingId ? 'Edit student' : 'Add student'}
        description={editingId ? 'Update student details and save changes.' : 'Enter student details to create a new record.'}
        onClose={() => {
          setAddOpen(false);
          setEditingId('');
        }}
      >
        <form onSubmit={onAddStudent} className="grid gap-3">
          <Input
            label="Name"
            placeholder="Name"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
          />
          {addFieldErrors.name ? <div className="text-xs text-red-600">{addFieldErrors.name}</div> : null}
          <Input
            label="Email"
            placeholder="Email"
            value={addForm.email}
            onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
          />
          {addFieldErrors.email ? <div className="text-xs text-red-600">{addFieldErrors.email}</div> : null}
          <Input
            label="Phone"
            placeholder="Phone"
            value={addForm.phone}
            onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
          />
          {addFieldErrors.phone ? <div className="text-xs text-red-600">{addFieldErrors.phone}</div> : null}
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-blue-500/20 focus:border-blue-500"
            value={addForm.courseId}
            onChange={(e) => setAddForm((f) => ({ ...f, courseId: e.target.value }))}
            disabled={catalogLoading}
          >
            <option value="">{catalogLoading ? 'Loading courses…' : 'Select course'}</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.courseName ?? c._id}
              </option>
            ))}
          </select>
          {addFieldErrors.courseId ? <div className="text-xs text-red-600">{addFieldErrors.courseId}</div> : null}
          <Input
            label="Fees Total"
            type="number"
            placeholder="Fees total"
            value={addForm.feesTotal}
            onChange={(e) => setAddForm((f) => ({ ...f, feesTotal: e.target.value }))}
          />
          {addFieldErrors.feesTotal ? <div className="text-xs text-red-600">{addFieldErrors.feesTotal}</div> : null}
          <Input
            label="Fees Paid"
            type="number"
            placeholder="Fees paid"
            value={addForm.feesPaid}
            onChange={(e) => setAddForm((f) => ({ ...f, feesPaid: e.target.value }))}
          />
          {addFieldErrors.feesPaid ? <div className="text-xs text-red-600">{addFieldErrors.feesPaid}</div> : null}
          <Input
            label="Join Date"
            type="date"
            value={addForm.joinDate}
            onChange={(e) => setAddForm((f) => ({ ...f, joinDate: e.target.value }))}
          />
          {addFieldErrors.joinDate ? <div className="text-xs text-red-600">{addFieldErrors.joinDate}</div> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setAddOpen(false);
                setEditingId('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={addSubmitting}>
              {addSubmitting ? 'Saving…' : editingId ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete this student?"
        description="This action cannot be undone."
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            type="button"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button variant="danger" type="button" onClick={onConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Student'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

