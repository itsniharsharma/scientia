import { api } from './axios';
import type { StudentDto, TeacherDto } from '../types/auth';

export type { StudentDto, TeacherDto };

// The backend now issues the JWT as an httpOnly cookie.
// Login/register responses only return the user object — no token in body.
interface LoginResponse<T> {
  user: T;
}

// The Render free-tier backend sleeps when idle and takes ~55s to wake (measured
// in production). Login/register are usually the first request of a session, so
// they get to outlive a full cold start instead of the default 30s client timeout
// — otherwise a correct password fails before the server has even booted.
const COLD_START_TIMEOUT_MS = 90_000;

// Fire-and-forget request that starts waking the backend the moment an auth page
// opens, so by the time the user has typed their credentials it is already up.
export function warmUpServer(): void {
  api.get('/health', { timeout: COLD_START_TIMEOUT_MS }).catch(() => {
    // Only a wake-up nudge — the real request reports its own errors.
  });
}

export async function registerStudent(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
}): Promise<LoginResponse<StudentDto>> {
  const res = await api.post<LoginResponse<StudentDto>>('/auth/student/register', data, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  return res.data;
}

export async function registerTeacher(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  organisationId: string;
}): Promise<LoginResponse<TeacherDto>> {
  const res = await api.post<LoginResponse<TeacherDto>>('/auth/teacher/register', data, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  return res.data;
}

export async function loginStudent(data: {
  username: string;
  password: string;
}): Promise<LoginResponse<StudentDto>> {
  const res = await api.post<LoginResponse<StudentDto>>('/auth/student/login', data, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  return res.data;
}

export async function loginTeacher(data: {
  username: string;
  password: string;
}): Promise<LoginResponse<TeacherDto>> {
  const res = await api.post<LoginResponse<TeacherDto>>('/auth/teacher/login', data, {
    timeout: COLD_START_TIMEOUT_MS,
  });
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getCurrentUser(): Promise<StudentDto | TeacherDto> {
  const res = await api.get<StudentDto | TeacherDto>('/auth/me');
  return res.data;
}
