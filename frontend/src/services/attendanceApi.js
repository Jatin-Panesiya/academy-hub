import { api } from './api.js';

export async function markAttendance(payload) {
  const res = await api.post('/api/attendance', payload);
  return res.data?.attendance ?? res.data;
}

export async function getAttendanceByBatch(batchId) {
  const res = await api.get(`/api/attendance/batch/${batchId}`);
  return res.data?.items ?? [];
}

export async function getAttendanceByStudent(studentId) {
  const res = await api.get(`/api/attendance/student/${studentId}`);
  return res.data?.items ?? [];
}

