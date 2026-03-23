import { api } from './api.js';

export async function addPayment(payload) {
  const res = await api.post('/api/payments', payload);
  return res.data;
}

export async function getPaymentHistory(studentId) {
  const res = await api.get(`/api/payments/student/${studentId}`);
  return res.data;
}

