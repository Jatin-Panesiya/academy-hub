import { api } from './api.js';

export async function fetchCourses({ page = 1, limit = 20, search = '' } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  const res = await api.get('/api/courses', { params });
  return res.data;
}

export async function createCourse(payload) {
  const res = await api.post('/api/courses', payload);
  return res.data?.course ?? res.data;
}

export async function updateCourse(id, payload) {
  const res = await api.put(`/api/courses/${id}`, payload);
  return res.data?.course ?? res.data;
}

export async function deleteCourse(id) {
  const res = await api.delete(`/api/courses/${id}`);
  return res.data;
}

