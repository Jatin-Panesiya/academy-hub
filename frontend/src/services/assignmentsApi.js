import { api } from './api.js';

export async function createAssignment(payload) {
  const res = await api.post('/api/assignments', payload);
  return res.data?.assignment ?? res.data;
}

export async function getAssignmentsByBatch(batchId) {
  const res = await api.get(`/api/assignments/batch/${batchId}`);
  return res.data?.items ?? [];
}

