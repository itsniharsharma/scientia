import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

// Unique prefix per test run so parallel runs don't collide
export const RUN_ID = `it_${Date.now()}_`;
let counter = 0;
function uniqueSuffix(): string {
  counter += 1;
  return `${counter}${Math.floor(Math.random() * 1000)}`;
}

export const agent = request.agent(app);

export async function cleanupTestUsers(): Promise<void> {
  // Children first. Batch.teacherId has no cascade (a real teacher's
  // batches must never vanish just because the teacher row changes), so
  // test-created batches must be removed before their owning test teacher
  // can be deleted, or the delete hits a foreign key violation.
  await prisma.studentOrganisation.deleteMany({
    where: { student: { username: { startsWith: RUN_ID } } },
  });
  await prisma.teacherOrganisation.deleteMany({
    where: { teacher: { username: { startsWith: RUN_ID } } },
  });
  await prisma.batch.deleteMany({ where: { teacher: { username: { startsWith: RUN_ID } } } });
  await prisma.username.deleteMany({ where: { username: { startsWith: RUN_ID } } });
  await prisma.student.deleteMany({ where: { username: { startsWith: RUN_ID } } });
  await prisma.teacher.deleteMany({ where: { username: { startsWith: RUN_ID } } });
  await prisma.organisation.deleteMany({ where: { normalizedName: { startsWith: RUN_ID } } });
}

export async function registerTestStudent(suffix = uniqueSuffix()): Promise<{
  username: string;
  password: string;
  cookie: string;
}> {
  const username = `${RUN_ID}${suffix}`;
  const password = 'TestPass123!';
  const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  const res = await request(app)
    .post('/auth/student/register')
    .send({
      firstName: 'Test',
      lastName: 'User',
      phone,
      email: `${username}@example.test`,
      username,
      password,
    });

  if (res.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
  }

  const cookie: string = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0] ?? '';
  return { username, password, cookie };
}

export async function registerTestOrganisation(suffix = ''): Promise<{
  id: string;
  name: string;
}> {
  const name = `${RUN_ID}org${suffix || uniqueSuffix()}`;
  const res = await request(app).post('/organisations/register').send({ name });

  if (res.status !== 201) {
    throw new Error(`Organisation registration failed: ${JSON.stringify(res.body)}`);
  }

  return { id: res.body.id, name: res.body.name };
}

export async function registerTestTeacher(
  organisationId: string,
  suffix = uniqueSuffix(),
): Promise<{
  id: string;
  username: string;
  password: string;
  cookie: string;
}> {
  const username = `${RUN_ID}tch${suffix}`;
  const password = 'TestPass123!';
  const phone = `8${Math.floor(100000000 + Math.random() * 900000000)}`;

  const res = await request(app)
    .post('/auth/teacher/register')
    .send({
      firstName: 'Test',
      lastName: 'Teacher',
      phone,
      email: `${username}@example.test`,
      username,
      password,
      organisationId,
    });

  if (res.status !== 201) {
    throw new Error(`Teacher registration failed: ${JSON.stringify(res.body)}`);
  }

  const cookie: string = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0] ?? '';
  return { id: res.body.user.id, username, password, cookie };
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
