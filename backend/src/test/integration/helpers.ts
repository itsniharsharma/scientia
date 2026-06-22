import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

// Unique prefix per test run so parallel runs don't collide
export const RUN_ID = `it_${Date.now()}_`;

export const agent = request.agent(app);

export async function cleanupTestUsers(): Promise<void> {
  await prisma.student.deleteMany({ where: { username: { startsWith: RUN_ID } } });
}

export async function registerTestStudent(suffix = 'a'): Promise<{
  username: string;
  password: string;
  cookie: string;
}> {
  const username = `${RUN_ID}${suffix}`;
  const password = 'TestPass123!';
  const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  const res = await request(app)
    .post('/auth/student/register')
    .send({ fullName: 'Test User', phone, username, password });

  if (res.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
  }

  const cookie: string = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0] ?? '';
  return { username, password, cookie };
}

export async function loginTestStudent(username: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/auth/student/login')
    .send({ username, password });

  if (res.status !== 200) throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
  const cookie: string = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0] ?? '';
  return cookie;
}

export async function loginTeacher(): Promise<string> {
  const res = await request(app)
    .post('/auth/teacher/login')
    .send({ username: process.env.TEST_TEACHER_USERNAME!, password: process.env.TEST_TEACHER_PASSWORD! });

  if (res.status !== 200) throw new Error(`Teacher login failed: ${JSON.stringify(res.body)}`);
  const cookie: string = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0] ?? '';
  return cookie;
}

export function withCookie(cookie: string) {
  return request(app).set('Cookie', cookie);
}
