import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { RUN_ID, cleanupTestUsers, registerTestOrganisation, registerTestTeacher } from './helpers';

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;

describe('Organisation Integration', () => {
  afterAll(async () => {
    await cleanupTestUsers();
    await prisma.$disconnect();
  });

  skipIfNoDb('POST /organisations/register — creates an organisation, independent of any teacher', async () => {
    const name = `${RUN_ID}orgAlpha`;
    const res = await request(app).post('/organisations/register').send({ name });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe(name);
  });

  skipIfNoDb('POST /organisations/register — 409 on exact duplicate name', async () => {
    const name = `${RUN_ID}orgDup`;
    await request(app).post('/organisations/register').send({ name });
    const res = await request(app).post('/organisations/register').send({ name });

    expect(res.status).toBe(409);
  });

  skipIfNoDb('POST /organisations/register — 409 on case-insensitive duplicate name', async () => {
    const name = `${RUN_ID}orgCase`;
    await request(app).post('/organisations/register').send({ name });
    const res = await request(app)
      .post('/organisations/register')
      .send({ name: name.toUpperCase() });

    expect(res.status).toBe(409);
  });

  skipIfNoDb('GET /organisations — public, lists organisations for the signup dropdown', async () => {
    const org = await registerTestOrganisation();

    const res = await request(app).get('/organisations');
    expect(res.status).toBe(200);
    const ids: string[] = res.body.map((o: { id: string }) => o.id);
    expect(ids).toContain(org.id);
  });

  skipIfNoDb('GET /organisations — requires no authentication', async () => {
    const res = await request(app).get('/organisations');
    expect(res.status).toBe(200);
  });

  skipIfNoDb('POST /organisations/:id/join — teacher can later join a second organisation', async () => {
    const orgA = await registerTestOrganisation();
    const orgB = await registerTestOrganisation();
    const teacher = await registerTestTeacher(orgA.id);

    const joinRes = await request(app)
      .post(`/organisations/${orgB.id}/join`)
      .set('Cookie', teacher.cookie);
    expect(joinRes.status).toBe(201);

    const mineRes = await request(app)
      .get('/organisations/mine')
      .set('Cookie', teacher.cookie);
    expect(mineRes.status).toBe(200);
    const orgIds: string[] = mineRes.body.map((m: { organisationId: string }) => m.organisationId);
    expect(orgIds).toContain(orgA.id);
    expect(orgIds).toContain(orgB.id);
  });

  skipIfNoDb('POST /organisations/:id/join — 409 on joining the same organisation twice', async () => {
    const org = await registerTestOrganisation();
    const teacher = await registerTestTeacher(org.id);

    const res = await request(app)
      .post(`/organisations/${org.id}/join`)
      .set('Cookie', teacher.cookie);

    expect(res.status).toBe(409);
  });

  skipIfNoDb('POST /organisations/:id/join — 404 for a nonexistent organisation', async () => {
    const org = await registerTestOrganisation();
    const teacher = await registerTestTeacher(org.id);

    const res = await request(app)
      .post('/organisations/00000000-0000-0000-0000-000000000000/join')
      .set('Cookie', teacher.cookie);

    expect(res.status).toBe(404);
  });
});
