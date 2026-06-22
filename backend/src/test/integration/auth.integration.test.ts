import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { RUN_ID, cleanupTestUsers } from './helpers';

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;

describe('Auth Integration', () => {
  afterAll(async () => {
    await cleanupTestUsers();
    await prisma.$disconnect();
  });

  // ─── Registration ─────────────────────────────────────────────────────────

  skipIfNoDb('POST /auth/student/register — returns 201, sets httpOnly cookie, no token in body', async () => {
    const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const res = await request(app)
      .post('/auth/student/register')
      .send({
        fullName: 'Integration Student',
        phone,
        username: `${RUN_ID}reg1`,
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(`${RUN_ID}reg1`);
    expect(res.body.user.role).toBe('STUDENT');
    // Token MUST NOT be in response body
    expect(res.body.token).toBeUndefined();
    // Cookie MUST be set
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    const authCookie = cookies!.find((c: string) => c.startsWith('auth_token='));
    expect(authCookie).toBeDefined();
    expect(authCookie).toMatch(/HttpOnly/i);
  });

  skipIfNoDb('POST /auth/student/register — 409 on duplicate phone', async () => {
    const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'A', phone, username: `${RUN_ID}dup1`, password: 'pass1234' });

    const res = await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'B', phone, username: `${RUN_ID}dup2`, password: 'pass1234' });

    expect(res.status).toBe(409);
  });

  skipIfNoDb('POST /auth/student/register — 409 on duplicate username', async () => {
    const username = `${RUN_ID}dupname`;
    await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'A', phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`, username, password: 'pass1234' });

    const res = await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'B', phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`, username, password: 'pass1234' });

    expect(res.status).toBe(409);
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  skipIfNoDb('POST /auth/student/login — 200 on valid credentials, sets cookie', async () => {
    const username = `${RUN_ID}login1`;
    await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'A', phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`, username, password: 'TestPass1!' });

    const res = await request(app)
      .post('/auth/student/login')
      .send({ username, password: 'TestPass1!' });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(username);
    expect(res.body.token).toBeUndefined();
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies?.some((c: string) => c.startsWith('auth_token='))).toBe(true);
  });

  skipIfNoDb('POST /auth/student/login — 401 on wrong password', async () => {
    const username = `${RUN_ID}login2`;
    await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'A', phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`, username, password: 'correct123' });

    const res = await request(app)
      .post('/auth/student/login')
      .send({ username, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  skipIfNoDb('POST /auth/student/login — 401 on unknown username', async () => {
    const res = await request(app)
      .post('/auth/student/login')
      .send({ username: `${RUN_ID}nobody`, password: 'anything' });

    expect(res.status).toBe(401);
  });

  // ─── Session persistence via cookie ───────────────────────────────────────

  skipIfNoDb('GET /auth/me — authenticated via cookie', async () => {
    const username = `${RUN_ID}me1`;
    const regRes = await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'A', phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`, username, password: 'pass1234' });

    const cookie = (regRes.headers['set-cookie'] as unknown as string[])[0];
    const meRes = await request(app)
      .get('/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.username).toBe(username);
  });

  skipIfNoDb('GET /auth/me — 401 without cookie or token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  // ─── Logout ───────────────────────────────────────────────────────────────

  skipIfNoDb('POST /auth/logout — clears cookie', async () => {
    const username = `${RUN_ID}logout1`;
    const regRes = await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'A', phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`, username, password: 'pass1234' });

    const cookie = (regRes.headers['set-cookie'] as unknown as string[])[0];

    const logoutRes = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(204);

    // The cleared cookie should be set with expires in the past or maxAge=0
    const clearedCookies = logoutRes.headers['set-cookie'] as unknown as string[] | undefined;
    expect(clearedCookies?.some((c: string) => c.includes('auth_token=;') || c.includes('Expires=') || c.includes('Max-Age=0'))).toBe(true);
  });

  // ─── Protected route — authorization ─────────────────────────────────────

  skipIfNoDb('Teacher routes — 401 when unauthenticated', async () => {
    const res = await request(app).get('/subjects');
    expect(res.status).toBe(401);
  });

  skipIfNoDb('Teacher routes — 403 when authenticated as STUDENT', async () => {
    const username = `${RUN_ID}role1`;
    const regRes = await request(app)
      .post('/auth/student/register')
      .send({ fullName: 'A', phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`, username, password: 'pass1234' });

    const cookie = (regRes.headers['set-cookie'] as unknown as string[])[0];

    const res = await request(app)
      .get('/subjects')
      .set('Cookie', cookie);

    expect(res.status).toBe(403);
  });
});
