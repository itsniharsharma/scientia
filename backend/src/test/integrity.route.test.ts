import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../modules/attempts/integrity.service', () => ({
  recordIntegrityEvents: vi.fn(async () => ({ accepted: 1 })),
}));

import app from '../app';
import { recordIntegrityEvents } from '../modules/attempts/integrity.service';

const ATTEMPT = '11111111-1111-4111-8111-111111111111';
const body = {
  sentAt: 1_763_600_000_000,
  events: [
    {
      clientEventId: '22222222-2222-4222-8222-222222222222',
      episodeId: '33333333-3333-4333-8333-333333333333',
      type: 'TAB_HIDDEN',
      occurredAt: 1_763_599_990_000,
    },
  ],
};

const cookie = (role: 'STUDENT' | 'TEACHER') =>
  `auth_token=${jwt.sign({ sub: 'stu-1', role }, process.env.JWT_SECRET!)}`;

describe('POST /attempts/:id/integrity-events', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts a normal JSON request', async () => {
    const res = await request(app)
      .post(`/attempts/${ATTEMPT}/integrity-events`)
      .set('Cookie', cookie('STUDENT'))
      .send(body);
    expect(res.status).toBe(200);
    expect(recordIntegrityEvents).toHaveBeenCalledWith(ATTEMPT, 'stu-1', body);
  });

  it('accepts a sendBeacon delivery (text/plain body, cookie auth)', async () => {
    const res = await request(app)
      .post(`/attempts/${ATTEMPT}/integrity-events`)
      .set('Cookie', cookie('STUDENT'))
      .set('Content-Type', 'text/plain;charset=UTF-8')
      .send(JSON.stringify(body));
    expect(res.status).toBe(200);
    expect(recordIntegrityEvents).toHaveBeenCalledWith(ATTEMPT, 'stu-1', body);
  });

  it('rejects malformed events', async () => {
    const res = await request(app)
      .post(`/attempts/${ATTEMPT}/integrity-events`)
      .set('Cookie', cookie('STUDENT'))
      .send({ ...body, events: [{ ...body.events[0], type: 'NAP' }] });
    expect(res.status).toBe(400);
    expect(recordIntegrityEvents).not.toHaveBeenCalled();
  });

  it('is for students only', async () => {
    const anon = await request(app).post(`/attempts/${ATTEMPT}/integrity-events`).send(body);
    expect(anon.status).toBe(401);
    const teacher = await request(app)
      .post(`/attempts/${ATTEMPT}/integrity-events`)
      .set('Cookie', cookie('TEACHER'))
      .send(body);
    expect(teacher.status).toBe(403);
  });
});
