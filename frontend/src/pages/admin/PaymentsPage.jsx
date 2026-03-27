import { useEffect, useState } from 'react';

import { addPayment, getPaymentHistory } from '../../services/paymentsApi.js';
import { fetchStudents } from '../../services/studentsApi.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';

export default function PaymentsPage() {
  const toast = useToast();
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ paidTotal: 0, pendingFees: 0, student: null });
  const [students, setStudents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    amount: '',
    date: '',
    paymentMethod: 'cash',
  });
  const [historyStudentId, setHistoryStudentId] = useState('');

  async function loadAllPaymentsForStudents(studentList) {
    // Backend only supports history per student, so we fetch each student's history
    // and flatten into a single table.
    const maxConcurrency = 5;
    const pending = [];

    async function runWorker(workerIdx) {
      while (pending.length) {
        const current = pending.pop();
        try {
          const data = await getPaymentHistory(current._id);
          const studentMeta = data?.student ?? current;

          const payments = Array.isArray(data?.payments) ? data.payments : [];
          for (const p of payments) {
            allRows.push({
              ...p,
              studentName: studentMeta?.name ?? current.name,
              studentEmail: studentMeta?.email ?? current.email,
            });
          }

          paidTotalSum += Number(data?.paidTotal ?? 0);
          pendingFeesSum += Number(data?.pendingFees ?? 0);
        } catch (err) {
          // Ignore individual student failures but keep UI responsive.
          // Also surface one toast to avoid silent failures.
          const msg =
            err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load a student payment history';
          toast.error({ title: 'Payments', message: msg });
        }
      }
    }

    let paidTotalSum = 0;
    let pendingFeesSum = 0;
    let allRows = [];

    pending.push(...studentList);

    const workers = Array.from({ length: Math.min(maxConcurrency, studentList.length) }, (_, i) => i);
    await Promise.all(workers.map((idx) => runWorker(idx)));

    allRows.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    setHistory(allRows);
    setSummary({
      paidTotal: paidTotalSum,
      pendingFees: pendingFeesSum,
      student: { id: '', name: 'All students', email: '' },
    });
  }

  useEffect(() => {
    async function loadStudents() {
      setHistoryLoading(true);
      setError('');
      try {
        const data = await fetchStudents({ page: 1, limit: 100 });
        const studentItems = data?.items ?? [];
        setStudents(studentItems);

        if (!studentItems.length) {
          setHistory([]);
          setSummary({ paidTotal: 0, pendingFees: 0, student: null });
          return;
        }

        await loadAllPaymentsForStudents(studentItems);
      } catch (err) {
        const message = err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load payments';
        setError(message);
        toast.error({ title: 'Load failed', message });
      } finally {
        setHistoryLoading(false);
      }
    }
    loadStudents();
  }, []);

  async function onAddPayment(e) {
    e.preventDefault();
    setError('');
    try {
      await addPayment({
        ...paymentForm,
        amount: Number(paymentForm.amount),
        date: new Date(paymentForm.date),
      });
      setPaymentModalOpen(false);
      setPaymentForm({
        studentId: '',
        amount: '',
        date: '',
        paymentMethod: 'cash',
      });
      await onLoadHistory(historyStudentId);
      toast.success({ title: 'Payment added', message: 'The payment was recorded successfully.' });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to add payment');
      toast.error({
        title: 'Payment failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to add payment',
      });
    }
  }

  function onOpenPaymentModal() {
    setPaymentForm((f) => ({
      ...f,
      studentId: f.studentId || historyStudentId,
    }));
    setPaymentModalOpen(true);
  }

  async function onLoadHistory(studentId = historyStudentId) {
    setError('');
    setHistoryLoading(true);
    try {
      if (!studentId) {
        if (!students.length) {
          setHistory([]);
          setSummary({ paidTotal: 0, pendingFees: 0, student: null });
          return;
        }

        await loadAllPaymentsForStudents(students);
      } else {
        const data = await getPaymentHistory(studentId);
        const rows = (Array.isArray(data?.payments) ? data.payments : []).map((p) => ({
          ...p,
          studentName: data?.student?.name ?? '',
          studentEmail: data?.student?.email ?? '',
        }));
        setHistory(rows);
        setSummary({
          paidTotal: data?.paidTotal ?? 0,
          pendingFees: data?.pendingFees ?? 0,
          student: data?.student ?? null,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load payment history');
      toast.error({
        title: 'Load failed',
        message: err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load payment history',
      });
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <Card className="p-5">
        <div className="flex gap-2">
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-blue-500/20 focus:border-blue-500"
            value={historyStudentId}
            onChange={(e) => {
              const selectedStudentId = e.target.value;
              setHistoryStudentId(selectedStudentId);
              onLoadHistory(selectedStudentId);
            }}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <Button variant="primary" type="button" className="text-nowrap" onClick={onOpenPaymentModal}>
            Add Payment
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-slate-500">Student</div>
            <div className="mt-1 font-medium">{summary.student?.name ?? '-'}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-slate-500">Paid Total</div>
            <div className="mt-1 font-medium">{summary.paidTotal}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-slate-500">Pending Fees</div>
            <div className="mt-1 font-medium">{summary.pendingFees}</div>
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="bg-[#F3F4F6]">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Method</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t border-gray-200 text-sm">
                    <td className="px-3 py-2">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  </tr>
                ))
              ) : (history ?? []).map((p) => (
                <tr key={p._id} className="border-t border-gray-200 text-sm hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-gray-900">{p.studentName ?? '—'}</div>
                    {p.studentEmail ? <div className="text-xs text-gray-500">{p.studentEmail}</div> : null}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{p.amount}</td>
                  <td className="px-3 py-2 text-slate-600">{formatDisplayDate(p.date)}</td>
                  <td className="px-3 py-2 text-slate-600">{p.paymentMethod}</td>
                </tr>
              ))}
              {!historyLoading && history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-sm text-slate-600">
                    <EmptyState title="No payments found" message="Select a student or check back when payments are added." />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={paymentModalOpen}
        title="Add payment"
        description="Select student and enter payment details."
        onClose={() => setPaymentModalOpen(false)}
      >
        <form onSubmit={onAddPayment} className="grid gap-3">
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-blue-500/20 focus:border-blue-500"
            value={paymentForm.studentId}
            onChange={(e) => setPaymentForm((f) => ({ ...f, studentId: e.target.value }))}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <Input
            label="Amount"
            type="number"
            placeholder="Amount"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <Input
            label="Date"
            type="date"
            value={paymentForm.date}
            onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))}
          />
          <Input
            label="Payment Method"
            placeholder="Method (cash/upi/card)"
            value={paymentForm.paymentMethod}
            onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!paymentForm.studentId || !paymentForm.amount || !paymentForm.date || !paymentForm.paymentMethod}
              type="submit"
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

