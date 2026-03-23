import { api } from './api.js';

export async function fetchBatches({ page = 1, limit = 20, search = '' } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  const res = await api.get('/api/batches', { params });
  return res.data;
}

export async function createBatch(payload) {
  const res = await api.post('/api/batches', payload);
  return res.data?.batch ?? res.data;
}

export async function assignStudentsToBatch(batchId, studentIds) {
  const res = await api.post(`/api/batches/${batchId}/students`, { studentIds });
  return res.data?.batch ?? res.data;
}

