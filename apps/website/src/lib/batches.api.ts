import { api } from './axios';
import type { BatchDto, BatchDetailDto, BatchStudentDto } from '../types/batch';
import type { TestDto } from '../types/test';

export interface BatchWithTests extends BatchDetailDto {
  tests: TestDto[];
}

export async function listBatches(): Promise<BatchDto[]> {
  const res = await api.get('/teacher/batches');
  return res.data;
}

export async function createBatch(name: string): Promise<BatchDetailDto> {
  const res = await api.post('/teacher/batches', { name });
  return res.data;
}

export async function getBatch(batchId: string): Promise<BatchWithTests> {
  const res = await api.get(`/teacher/batches/${batchId}`);
  return res.data;
}

export async function updateBatch(batchId: string, name: string): Promise<BatchDto> {
  const res = await api.patch(`/teacher/batches/${batchId}`, { name });
  return res.data;
}

export async function addStudentToBatch(batchId: string, username: string): Promise<BatchStudentDto> {
  const res = await api.post(`/teacher/batches/${batchId}/students`, { username });
  return res.data;
}

export async function removeStudentFromBatch(batchId: string, studentId: string): Promise<void> {
  await api.delete(`/teacher/batches/${batchId}/students/${studentId}`);
}
