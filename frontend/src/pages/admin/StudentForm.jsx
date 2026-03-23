import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import StatCard from '../../components/StatCard.jsx';
import { fetchBatches, fetchCourses } from '../../services/catalogApi.js';
import { createStudent, updateStudent } from '../../services/studentsApi.js';

function formatDateInput(dateRaw) {
  const d = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);
  if (Number.isNaN(d.getTime())) return '';
  // yyyy-mm-dd
  return d.toISOString().slice(0, 10);
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

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isEdit = Boolean(id);

  const passedStudent = location.state?.student ?? null;

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [onboardingCredentials, setOnboardingCredentials] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    courseId: '',
    batchId: '',
    feesTotal: '',
    feesPaid: '',
    joinDate: '',
  });

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      setLoadingCatalog(true);
      setCatalogError('');
      try {
        const [coursesRes, batchesRes] = await Promise.all([fetchCourses({ page: 1, limit: 100 }), fetchBatches({ page: 1, limit: 100 })]);
        if (!mounted) return;
        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
        setBatches(Array.isArray(batchesRes) ? batchesRes : []);
      } catch (err) {
        setCatalogError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load catalog');
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    if (!passedStudent) return;

    setForm({
      name: passedStudent.name ?? '',
      email: passedStudent.email ?? '',
      phone: passedStudent.phone ?? '',
      courseId: extractId(passedStudent.courseId),
      batchId: extractId(passedStudent.batchId),
      feesTotal: passedStudent.feesTotal ?? '',
      feesPaid: passedStudent.feesPaid ?? '',
      joinDate: formatDateInput(passedStudent.joinDate),
    });
  }, [isEdit, passedStudent]);

  const availableBatches = useMemo(() => {
    const selectedCourseId = form.courseId;
    if (!selectedCourseId) return batches;

    return batches.filter((b) => {
      const batchCourseId = b.courseId?._id ?? b.courseId?.id ?? b.courseId;
      return String(batchCourseId) === String(selectedCourseId);
    });
  }, [batches, form.courseId]);

  useEffect(() => {
    // If course changes and current batch no longer belongs to it, clear batch selection.
    if (loadingCatalog) return;
    if (!batches.length) return;
    if (!form.batchId) return;
    const stillValid = availableBatches.some((b) => String(b._id) === String(form.batchId));
    if (!stillValid) setForm((f) => ({ ...f, batchId: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableBatches, loadingCatalog, batches.length]);

  function validate() {
    const errors = {};

    if (!form.name.trim()) errors.name = 'Name is required.';
    else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';

    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';

    if (!form.phone.trim()) errors.phone = 'Phone is required.';

    if (!isValidObjectId(form.courseId)) errors.courseId = 'Select a valid course.';
    if (!isValidObjectId(form.batchId)) errors.batchId = 'Select a valid batch.';

    const feesTotalNum = Number(form.feesTotal);
    const feesPaidNum = Number(form.feesPaid);
    if (!Number.isFinite(feesTotalNum) || feesTotalNum < 0) errors.feesTotal = 'Fees total must be >= 0.';
    if (!Number.isFinite(feesPaidNum) || feesPaidNum < 0) errors.feesPaid = 'Fees paid must be >= 0.';

    if (!form.joinDate) errors.joinDate = 'Join date is required.';
    else if (Number.isNaN(new Date(form.joinDate).getTime())) errors.joinDate = 'Enter a valid date.';

    return errors;
  }

  const [fieldErrors, setFieldErrors] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        courseId: form.courseId,
        batchId: form.batchId,
        feesTotal: Number(form.feesTotal),
        feesPaid: Number(form.feesPaid),
        joinDate: new Date(form.joinDate),
      };

      if (isEdit) {
        await updateStudent(id, payload);
        setSubmitSuccess('Student updated successfully.');
        navigate('/admin/students');
      } else {
        const created = await createStudent(payload);
        const onboarding = created?.onboarding ?? null;
        setOnboardingCredentials(onboarding);
        if (!onboarding) {
          setSubmitSuccess('Student created successfully.');
        } else {
          setSubmitSuccess('Student created. Share temporary credentials below.');
        }
        setForm({
          name: '',
          email: '',
          phone: '',
          courseId: '',
          batchId: '',
          feesTotal: '',
          feesPaid: '',
          joinDate: '',
        });
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  }

  const headerTitle = isEdit ? 'Edit Student' : 'Add Student';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{headerTitle}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {isEdit ? 'Update student details (admin only).' : 'Create a new student record (admin only).'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/students')}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to list
        </button>
      </div>

      {isEdit && !passedStudent ? (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Edit page expects student data from the Students list (open the form via “Edit”).
        </div>
      ) : null}

      {catalogError ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{catalogError}</div>
      ) : null}
      {submitError ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
      ) : null}
      {submitSuccess ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{submitSuccess}</div>
      ) : null}
      {onboardingCredentials ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="font-semibold">Student login created</div>
          <div className="mt-2">Email: {onboardingCredentials.email}</div>
          <div className="mt-1">
            Temporary Password: <span className="font-semibold">{onboardingCredentials.temporaryPassword}</span>
          </div>
          <div className="mt-1 text-xs">Share this once. Student will be asked to change password on first login.</div>
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="mt-3 rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Back to list
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-slate-700">Name</label>
                <input
                  className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                {fieldErrors.name ? <div className="text-xs text-red-600">{fieldErrors.name}</div> : null}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-700">Email</label>
                <input
                  className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                {fieldErrors.email ? <div className="text-xs text-red-600">{fieldErrors.email}</div> : null}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-700">Phone</label>
              <input
                className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              {fieldErrors.phone ? <div className="text-xs text-red-600">{fieldErrors.phone}</div> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-slate-700">Course</label>
                <select
                  className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  value={form.courseId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, courseId: e.target.value, batchId: '' }));
                  }}
                  disabled={loadingCatalog}
                >
                  <option value="">{loadingCatalog ? 'Loading…' : 'Select course'}</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseName ?? c._id}
                    </option>
                  ))}
                </select>
                {fieldErrors.courseId ? <div className="text-xs text-red-600">{fieldErrors.courseId}</div> : null}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-700">Batch</label>
                <select
                  className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  value={form.batchId}
                  onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                  disabled={loadingCatalog || !form.courseId}
                >
                  <option value="">
                    {loadingCatalog ? 'Loading…' : !form.courseId ? 'Select course first' : 'Select batch'}
                  </option>
                  {availableBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.batchName ?? b._id}
                    </option>
                  ))}
                </select>
                {fieldErrors.batchId ? <div className="text-xs text-red-600">{fieldErrors.batchId}</div> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-slate-700">Fees Total</label>
                <input
                  className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  type="number"
                  step="0.01"
                  value={form.feesTotal}
                  onChange={(e) => setForm((f) => ({ ...f, feesTotal: e.target.value }))}
                />
                {fieldErrors.feesTotal ? <div className="text-xs text-red-600">{fieldErrors.feesTotal}</div> : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-700">Fees Paid</label>
                <input
                  className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                  type="number"
                  step="0.01"
                  value={form.feesPaid}
                  onChange={(e) => setForm((f) => ({ ...f, feesPaid: e.target.value }))}
                />
                {fieldErrors.feesPaid ? <div className="text-xs text-red-600">{fieldErrors.feesPaid}</div> : null}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-700">Join Date</label>
              <input
                className="w-full rounded bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-500"
                type="date"
                value={form.joinDate}
                onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))}
              />
              {fieldErrors.joinDate ? <div className="text-xs text-red-600">{fieldErrors.joinDate}</div> : null}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || (isEdit && !passedStudent)}
                className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-slate-200 bg-white/70 p-4">
            <h2 className="text-base font-semibold">Preview</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>
                <span className="text-slate-500">Name: </span>
                {form.name || '—'}
              </div>
              <div>
                <span className="text-slate-500">Email: </span>
                {form.email || '—'}
              </div>
              <div>
                <span className="text-slate-500">Batch: </span>
                {form.batchId ? `…${String(form.batchId).slice(-6)}` : '—'}
              </div>
              <div>
                <span className="text-slate-500">Pending Fees: </span>
                {(() => {
                  const totalNum = Number(form.feesTotal);
                  const paidNum = Number(form.feesPaid);
                  if (!Number.isFinite(totalNum) || !Number.isFinite(paidNum)) return '—';
                  return Math.max(0, totalNum - paidNum);
                })()}
              </div>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white/70 p-4">
            <div className="text-xs text-slate-500">Tip</div>
            <div className="mt-1 text-sm text-slate-600">
              You must pick a Course and Batch. The form filters batches based on the selected course.
            </div>
          </div>

          <div className="hidden lg:block">
            <StatCard title="Admin Form" value={isEdit ? 'Edit' : 'Create'} hint="Role protected in backend and UI" />
          </div>
        </div>
      </div>
    </div>
  );
}

