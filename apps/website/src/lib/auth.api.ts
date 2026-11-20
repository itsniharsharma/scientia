import { api } from './axios';
import { wakeBackend } from './backend-wake';
import { withBackendWake } from './api-error';
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

// Starts waking the backend the moment an auth page opens, so by the time the
// user has typed their credentials it is usually already up.
export function warmUpServer(): void {
  void wakeBackend();
}

function postAuth<T>(url: string, data: unknown, retryOnNoResponse: boolean): Promise<T> {
  return withBackendWake(
    async () => (await api.post<T>(url, data, { timeout: COLD_START_TIMEOUT_MS })).data,
    wakeBackend,
    { retryOnNoResponse },
  );
}

// Registration is not repeated after a lost response — a retry could hit
// "username already taken" for the account the first attempt just created.
export function registerStudent(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
}): Promise<LoginResponse<StudentDto>> {
  return postAuth('/auth/student/register', data, false);
}

export function registerTeacher(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  organisationId: string;
}): Promise<LoginResponse<TeacherDto>> {
  return postAuth('/auth/teacher/register', data, false);
}

// Logging in has no side effects, so it is always safe to repeat.
export function loginStudent(data: {
  username: string;
  password: string;
}): Promise<LoginResponse<StudentDto>> {
  return postAuth('/auth/student/login', data, true);
}

export function loginTeacher(data: {
  username: string;
  password: string;
}): Promise<LoginResponse<TeacherDto>> {
  return postAuth('/auth/teacher/login', data, true);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getCurrentUser(): Promise<StudentDto | TeacherDto> {
  const res = await api.get<StudentDto | TeacherDto>('/auth/me');
  return res.data;
}
