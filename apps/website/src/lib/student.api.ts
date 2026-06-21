import { api } from './axios';
import type { AttemptSummaryDto } from '../types/attempt';

export interface StudentBatchDto {
  id: string;
  name: string;
  teacherUsername: string;
  studentCount: number;
  testCount: number;
  joinedAt: string;
}

export interface StudentBatchDetailDto extends StudentBatchDto {}

export interface StudentProfileDto {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  role: 'STUDENT';
  createdAt: string;
  updatedAt: string;
}

export async function listStudentBatches(): Promise<StudentBatchDto[]> {
  const res = await api.get<StudentBatchDto[]>('/student/batches');
  return res.data;
}

export async function getStudentBatch(batchId: string): Promise<StudentBatchDetailDto> {
  const res = await api.get<StudentBatchDetailDto>(`/student/batches/${batchId}`);
  return res.data;
}

export async function getStudentProfile(): Promise<StudentProfileDto> {
  const res = await api.get<StudentProfileDto>('/student/profile');
  return res.data;
}

export async function listStudentAttempts(): Promise<AttemptSummaryDto[]> {
  const res = await api.get<AttemptSummaryDto[]>('/student/attempts');
  return res.data;
}
