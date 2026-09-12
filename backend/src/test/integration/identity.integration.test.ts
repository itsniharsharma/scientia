import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { RUN_ID, cleanupTestUsers, registerTestOrganisation } from './helpers';

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;

// Proves the global username registry actually gates BOTH tables — the
// core requirement that a username can never be claimed by both a student
// and a teacher.
describe('Global Username Uniqueness', () => {
  afterAll(async () => {
    await cleanupTestUsers();
    await prisma.$disconnect();
  });

  skipIfNoDb('a teacher cannot register with a username an existing student already holds', async () => {
    const username = `${RUN_ID}shared1`;
    const studentRes = await request(app)
      .post('/auth/student/register')
      .send({
        firstName: 'Student',
        lastName: 'One',
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}s@example.test`,
        username,
        password: 'pass1234',
      });
    expect(studentRes.status).toBe(201);

    const org = await registerTestOrganisation();
    const teacherRes = await request(app)
      .post('/auth/teacher/register')
      .send({
        firstName: 'Teacher',
        lastName: 'One',
        phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}t@example.test`,
        username,
        password: 'pass1234',
        organisationId: org.id,
      });

    expect(teacherRes.status).toBe(409);
  });

  skipIfNoDb('a student cannot register with a username an existing teacher already holds', async () => {
    const username = `${RUN_ID}shared2`;
    const org = await registerTestOrganisation();
    const teacherRes = await request(app)
      .post('/auth/teacher/register')
      .send({
        firstName: 'Teacher',
        lastName: 'Two',
        phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}t@example.test`,
        username,
        password: 'pass1234',
        organisationId: org.id,
      });
    expect(teacherRes.status).toBe(201);

    const studentRes = await request(app)
      .post('/auth/student/register')
      .send({
        firstName: 'Student',
        lastName: 'Two',
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}s@example.test`,
        username,
        password: 'pass1234',
      });

    expect(studentRes.status).toBe(409);
  });

  skipIfNoDb('registration creates exactly one usernames registry row for that username, owned by the new student', async () => {
    const suffix = `${RUN_ID}count`;
    const username = `${suffix}s`;
    const res = await request(app)
      .post('/auth/student/register')
      .send({
        firstName: 'Count',
        lastName: 'Student',
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}@example.test`,
        username,
        password: 'pass1234',
      });
    expect(res.status).toBe(201);

    // Query the specific row rather than a global count — other integration
    // test files register users concurrently against the same database, so
    // a before/after total count is inherently flaky here.
    const usernameRow = await prisma.username.findUnique({ where: { username } });
    expect(usernameRow).not.toBeNull();
    expect(usernameRow?.ownerType).toBe('STUDENT');
    expect(usernameRow?.ownerId).toBe(res.body.user.id);
  });
});
