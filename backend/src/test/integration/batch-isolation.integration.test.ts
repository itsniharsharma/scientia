import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { RUN_ID, cleanupTestUsers, registerTestOrganisation, registerTestTeacher } from './helpers';

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;

describe('Batch Isolation Integration', () => {
  let teacherCookie: string;
  let organisationId: string;
  let batchId: string;
  let studentACookie: string;
  let studentBCookie: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) return;

    const org = await registerTestOrganisation();
    organisationId = org.id;

    const teacher = await registerTestTeacher(organisationId);
    teacherCookie = teacher.cookie;

    // Create a test batch scoped to the freshly-registered organisation
    const batchRes = await request(app)
      .post('/teacher/batches')
      .set('Cookie', teacherCookie)
      .send({ name: `${RUN_ID}batch`, organisationId });

    if (batchRes.status === 201) {
      batchId = batchRes.body.id;
    }

    // Register student A, assign them to the organisation, then enroll them in the batch
    const phoneA = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const usernameA = `${RUN_ID}stuA`;
    const regA = await request(app)
      .post('/auth/student/register')
      .send({
        firstName: 'Student',
        lastName: 'A',
        phone: phoneA,
        email: `${usernameA}@example.test`,
        username: usernameA,
        password: 'pass1234',
      });
    studentACookie = (regA.headers['set-cookie'] as unknown as string[])[0];

    if (batchId) {
      await request(app)
        .post(`/organisations/${organisationId}/students`)
        .set('Cookie', teacherCookie)
        .send({ username: usernameA });

      await request(app)
        .post(`/teacher/batches/${batchId}/students`)
        .set('Cookie', teacherCookie)
        .send({ username: usernameA });
    }

    // Register student B (NOT enrolled, NOT assigned to the organisation)
    const phoneB = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const usernameB = `${RUN_ID}stuB`;
    const regB = await request(app)
      .post('/auth/student/register')
      .send({
        firstName: 'Student',
        lastName: 'B',
        phone: phoneB,
        email: `${usernameB}@example.test`,
        username: usernameB,
        password: 'pass1234',
      });
    studentBCookie = (regB.headers['set-cookie'] as unknown as string[])[0];
  });

  afterAll(async () => {
    if (batchId) {
      try {
        await prisma.batch.delete({ where: { id: batchId } });
      } catch { /* ignore */ }
    }
    await cleanupTestUsers();
    await prisma.$disconnect();
  });

  skipIfNoDb('Student A can view their enrolled batch', async () => {
    if (!batchId) return;
    const res = await request(app)
      .get(`/student/batches/${batchId}`)
      .set('Cookie', studentACookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(batchId);
  });

  skipIfNoDb('Student B cannot view a batch they are not enrolled in', async () => {
    if (!batchId) return;
    const res = await request(app)
      .get(`/student/batches/${batchId}`)
      .set('Cookie', studentBCookie);

    expect(res.status).toBe(403);
  });

  skipIfNoDb('Unauthenticated user cannot view any batch', async () => {
    const res = await request(app).get(`/student/batches/some-batch-id`);
    expect(res.status).toBe(401);
  });

  skipIfNoDb('Student A cannot list student B batches (own batches only)', async () => {
    const resA = await request(app)
      .get('/student/batches')
      .set('Cookie', studentACookie);
    const resB = await request(app)
      .get('/student/batches')
      .set('Cookie', studentBCookie);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    // Student B is not enrolled anywhere — their list should be empty
    expect(resB.body).toHaveLength(0);
    // Student A is enrolled in batchId — should appear
    if (batchId) {
      const ids: string[] = resA.body.map((b: { id: string }) => b.id);
      expect(ids).toContain(batchId);
    }
  });

  skipIfNoDb('Student B cannot be added to the organisation-scoped batch without an organisation assignment', async () => {
    if (!batchId) return;
    const usernameC = `${RUN_ID}stuC`;
    await request(app)
      .post('/auth/student/register')
      .send({
        firstName: 'Student',
        lastName: 'C',
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${usernameC}@example.test`,
        username: usernameC,
        password: 'pass1234',
      });

    // Student C was never assigned to the organisation via
    // POST /organisations/:id/students, so adding them straight to an
    // org-scoped batch must be rejected even though the requesting teacher
    // does own the batch.
    const res = await request(app)
      .post(`/teacher/batches/${batchId}/students`)
      .set('Cookie', teacherCookie)
      .send({ username: usernameC });

    expect(res.status).toBe(422);
  });
});
