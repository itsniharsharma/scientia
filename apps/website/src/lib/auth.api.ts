import { api } from './axios';
import type { StudentDto, TeacherDto } from '../types/auth';

export type { StudentDto, TeacherDto };

// The backend now issues the JWT as an httpOnly cookie.
// Login/register responses only return the user object — no token in body.
interface LoginResponse<T> {
  user: T;
}

export async function registerStudent(data: {
  fullName: string;
  phone: string;
  username: string;
  password: string;
}): Promise<LoginResponse<StudentDto>> {
  const res = await api.post<LoginResponse<StudentDto>>('/auth/student/register', data);
  return res.data;
}

export async function loginStudent(data: {
  username: string;
  password: string;
}): Promise<LoginResponse<StudentDto>> {
  const res = await api.post<LoginResponse<StudentDto>>('/auth/student/login', data);
  return res.data;
}

export async function loginTeacher(data: {
  username: string;
  password: string;
}): Promise<LoginResponse<TeacherDto>> {
  const res = await api.post<LoginResponse<TeacherDto>>('/auth/teacher/login', data);
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getCurrentUser(): Promise<StudentDto | TeacherDto> {
  const res = await api.get<StudentDto | TeacherDto>('/auth/me');
  return res.data;
}
