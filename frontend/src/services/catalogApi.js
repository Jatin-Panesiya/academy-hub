import { api } from './api.js';

export async function fetchCourses({ page = 1, limit = 100, search = '' } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  const res = await api.get('/api/courses', { params });
  return res.data.items ?? [];
}

