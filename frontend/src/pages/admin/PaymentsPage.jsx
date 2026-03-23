import { useEffect, useState } from 'react';

import { addPayment, getPaymentHistory } from '../../services/paymentsApi.js';
import { fetchStudents } from '../../services/studentsApi.js';

export default function PaymentsPage() {
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ paidTotal: 0, pendingFees: 0, student: null });
  const [students, setStudents] = useState([]);

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    amount: '',
    date: '',
    paymentMethod: 'cash',
  });
  const [historyStudentId, setHistoryStudentId] = useState('');

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await fetchStudents({ page: 1, limit: 100 });
        setStudents(data?.items ?? []);
      } catch {
        // no-op
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
      alert('Payment added');
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to add payment');
    }
  }

  async function onLoadHistory() {
    setError('');
    try {
      const data = await getPaymentHistory(historyStudentId);
      setHistory(data?.payments ?? []);
      setSummary({
        paidTotal: data?.paidTotal ?? 0,
        pendingFees: data?.pendingFees ?? 0,
        student: data?.student ?? null,
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load payment history');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="mt-1 text-sm text-slate-600">Add student payments and view fee history.</p>
      </div>
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={onAddPayment} className="rounded border border-slate-200 bg-white/70 p-4 grid gap-3 md:grid-cols-5">
        <select
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
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
        <input
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          type="number"
          placeholder="Amount"
          value={paymentForm.amount}
          onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
        />
        <input
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          type="date"
          value={paymentForm.date}
          onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))}
        />
        <input
          className="rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
          placeholder="Method (cash/upi/card)"
          value={paymentForm.paymentMethod}
          onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Add Payment
        </button>
      </form>

      <div className="rounded border border-slate-200 bg-white/70 p-4">
        <div className="flex gap-2">
          <select
            className="w-full rounded bg-white px-3 py-2 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-500"
            value={historyStudentId}
            onChange={(e) => setHistoryStudentId(e.target.value)}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <button onClick={onLoadHistory} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Load
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Student</div>
            <div className="mt-1 font-medium">{summary.student?.name ?? '-'}</div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Paid Total</div>
            <div className="mt-1 font-medium">{summary.paidTotal}</div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Pending Fees</div>
            <div className="mt-1 font-medium">{summary.pendingFees}</div>
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="bg-slate-100/70">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Method</th>
              </tr>
            </thead>
            <tbody>
              {(history ?? []).map((p) => (
                <tr key={p._id} className="border-t border-slate-200 text-sm">
                  <td className="px-3 py-2">{p.amount}</td>
                  <td className="px-3 py-2 text-slate-600">{p.date ? new Date(p.date).toLocaleDateString() : ''}</td>
                  <td className="px-3 py-2 text-slate-600">{p.paymentMethod}</td>
                </tr>
              ))}
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-sm text-slate-600">
                    No payment records.
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

