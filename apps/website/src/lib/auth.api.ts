import { api } from './axios';
import type { StudentDto, TeacherDto, AuthResponse } from '../types/auth';

export type { StudentDto, TeacherDto, AuthResponse };

export async function registerStudent(data: {
  fullName: string;
  phone: string;
  username: string;
  password: string;
}): Promise<AuthResponse<StudentDto>> {
  const res = await api.post<AuthResponse<StudentDto>>('/auth/student/register', data);
  return res.data;
}

export async function loginStudent(data: {
  username: string;
  password: string;
}): Promise<AuthResponse<StudentDto>> {
  const res = await api.post<AuthResponse<StudentDto>>('/auth/student/login', data);
  return res.data;
}

export async function loginTeacher(data: {
  username: string;
  password: string;
}): Promise<AuthResponse<TeacherDto>> {
  const res = await api.post<AuthResponse<TeacherDto>>('/auth/teacher/login', data);
  return res.data;
}

export async function getCurrentUser(): Promise<StudentDto | TeacherDto> {
  const res = await api.get<StudentDto | TeacherDto>('/auth/me');
  return res.data;
}
