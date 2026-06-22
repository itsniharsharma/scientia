import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { RUN_ID, cleanupTestUsers, loginTeacher } from './helpers';

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;
const skipIfNoTeacher = !process.env.TEST_TEACHER_USERNAME ? it.skip : it;

describe('Batch Isolation Integration', () => {
  let teacherCookie: string;
  let batchId: string;
  let studentACookie: string;
  let studentBCookie: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL || !process.env.TEST_TEACHER_USERNAME) return;

    teacherCookie = await loginTeacher();

    // Create a test batch
    const batchRes = await request(app)
      .post('/teacher/batches')
      .set('Cookie', teacherCookie)
      .send({ name: `${RUN_ID}batch` });

    if (batchRes.status === 201) {
      batchId = batchRes.body.id;
    }

    // Register student A and enroll them
    const phoneA = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const regA = await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'Student A', phone: phoneA, username: `${RUN_ID}stuA`, password: 'pass1234' });
    studentACookie = (regA.headers['set-cookie'] as unknown as string[])[0];

    if (batchId) {
      await request(app)
        .post(`/teacher/batches/${batchId}/students`)
        .set('Cookie', teacherCookie)
        .send({ username: `${RUN_ID}stuA` });
    }

    // Register student B (NOT enrolled)
    const phoneB = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const regB = await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'Student B', phone: phoneB, username: `${RUN_ID}stuB`, password: 'pass1234' });
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

  skipIfNoTeacher('Student A can view their enrolled batch', async () => {
    if (!batchId) return;
    const res = await request(app)
      .get(`/student/batches/${batchId}`)
      .set('Cookie', studentACookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(batchId);
  });

  skipIfNoTeacher('Student B cannot view a batch they are not enrolled in', async () => {
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

  skipIfNoTeacher('Student A cannot list student B batches (own batches only)', async () => {
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
});
