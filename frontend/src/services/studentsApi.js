import { api } from './api.js';

export async function fetchStudents({ page = 1, limit = 10, search = '' } = {}) {
  const params = { page, limit };
  if (search) params.search = search;

  const res = await api.get('/api/students', { params });
  return res.data;
}

export async function createStudent(payload) {
  const res = await api.post('/api/students', payload);
  return res.data;
}

export async function updateStudent(id, payload) {
  const res = await api.put(`/api/students/${id}`, payload);
  return res.data.student ?? res.data;
}

export async function resetStudentPassword(id) {
  const res = await api.post(`/api/students/${id}/reset-password`);
  return res.data;
}

export async function deleteStudent(id) {
  const res = await api.delete(`/api/students/${id}`);
  return res.data;
}

