import { api } from './api.js';

export async function createAssignment(payload) {
  const res = await api.post('/api/assignments', payload);
  return res.data?.assignment ?? res.data;
}

export async function getAssignments() {
  const res = await api.get('/api/assignments');
  return res.data?.items ?? [];
}

export async function deleteAssignment(id) {
  const res = await api.delete(`/api/assignments/${id}`);
  return res.data;
}

