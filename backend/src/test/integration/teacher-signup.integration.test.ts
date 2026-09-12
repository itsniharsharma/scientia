import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { RUN_ID, cleanupTestUsers, registerTestOrganisation } from './helpers';

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;

describe('Teacher Signup Integration', () => {
  afterAll(async () => {
    await cleanupTestUsers();
    await prisma.$disconnect();
  });

  skipIfNoDb('POST /auth/teacher/register — succeeds against an existing organisation and is linked to it', async () => {
    const org = await registerTestOrganisation();
    const username = `${RUN_ID}tsignup1`;

    const res = await request(app)
      .post('/auth/teacher/register')
      .send({
        firstName: 'New',
        lastName: 'Teacher',
        phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}@example.test`,
        username,
        password: 'pass1234',
        organisationId: org.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('TEACHER');
    expect(res.body.token).toBeUndefined(); // cookie-based, same as student flow

    const cookie = (res.headers['set-cookie'] as unknown as string[])[0];
    const mineRes = await request(app).get('/organisations/mine').set('Cookie', cookie);
    expect(mineRes.status).toBe(200);
    expect(mineRes.body).toHaveLength(1);
    expect(mineRes.body[0].organisationId).toBe(org.id);
  });

  skipIfNoDb('POST /auth/teacher/register — 404 on a fabricated/nonexistent organisationId', async () => {
    const username = `${RUN_ID}tsignup2`;

    const res = await request(app)
      .post('/auth/teacher/register')
      .send({
        firstName: 'New',
        lastName: 'Teacher',
        phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}@example.test`,
        username,
        password: 'pass1234',
        organisationId: '00000000-0000-0000-0000-000000000000',
      });

    expect(res.status).toBe(404);

    // No teacher row, no username registry row should have been created.
    const teacher = await prisma.teacher.findUnique({ where: { username } });
    expect(teacher).toBeNull();
    const usernameRow = await prisma.username.findUnique({ where: { username } });
    expect(usernameRow).toBeNull();
  });

  skipIfNoDb('POST /auth/teacher/register — 400 when organisationId is missing (cannot create one implicitly)', async () => {
    const username = `${RUN_ID}tsignup3`;

    const res = await request(app)
      .post('/auth/teacher/register')
      .send({
        firstName: 'New',
        lastName: 'Teacher',
        phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}@example.test`,
        username,
        password: 'pass1234',
        // organisationId intentionally omitted
      });

    expect(res.status).toBe(400);
  });

  skipIfNoDb('POST /auth/teacher/register — extra/unexpected fields cannot fabricate an organisation', async () => {
    const username = `${RUN_ID}tsignup4`;

    // Attempting to pass a free-text organisation name instead of an id must
    // not create a new organisation — the schema only accepts organisationId.
    const res = await request(app)
      .post('/auth/teacher/register')
      .send({
        firstName: 'New',
        lastName: 'Teacher',
        phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `${username}@example.test`,
        username,
        password: 'pass1234',
        organisationName: 'Some Brand New Organisation',
      });

    expect(res.status).toBe(400);
    const org = await prisma.organisation.findFirst({
      where: { name: 'Some Brand New Organisation' },
    });
    expect(org).toBeNull();
  });
});
