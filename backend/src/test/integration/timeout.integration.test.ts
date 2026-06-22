import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Request Timeout Middleware', () => {
  it('sets X-Request-Id header on every response', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('each request gets a unique request ID', async () => {
    const [r1, r2] = await Promise.all([
      request(app).get('/auth/me'),
      request(app).get('/auth/me'),
    ]);
    expect(r1.headers['x-request-id']).not.toBe(r2.headers['x-request-id']);
  });
});
