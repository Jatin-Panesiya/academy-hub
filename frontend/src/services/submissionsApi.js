import { api } from './api.js';

export async function submitAssignment(payload) {
  const res = await api.post('/api/submissions', payload);
  return res.data?.submission ?? res.data;
}

