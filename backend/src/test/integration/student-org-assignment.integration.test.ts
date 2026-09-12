import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import {
  RUN_ID,
  cleanupTestUsers,
  registerTestOrganisation,
  registerTestTeacher,
  registerTestStudent,
} from './helpers';

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;

describe('Student Organisation Assignment Integration', () => {
  afterAll(async () => {
    await cleanupTestUsers();
    await prisma.$disconnect();
  });

  skipIfNoDb('authorized teacher can assign an existing student to their organisation', async () => {
    const org = await registerTestOrganisation();
    const teacher = await registerTestTeacher(org.id);
    const student = await registerTestStudent('assign1');

    const res = await request(app)
      .post(`/organisations/${org.id}/students`)
      .set('Cookie', teacher.cookie)
      .send({ username: student.username });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe(student.username);
    expect(res.body.organisationId).toBe(org.id);

    const viewRes = await request(app)
      .get('/student/organisations')
      .set('Cookie', student.cookie);
    expect(viewRes.status).toBe(200);
    expect(viewRes.body).toHaveLength(1);
    expect(viewRes.body[0].organisationId).toBe(org.id);
  });

  skipIfNoDb('a teacher NOT a member of the organisation cannot assign a student to it (403)', async () => {
    const orgA = await registerTestOrganisation();
    const orgB = await registerTestOrganisation();
    const outsiderTeacher = await registerTestTeacher(orgA.id); // member of A, not B
    const student = await registerTestStudent('assign2');

    const res = await request(app)
      .post(`/organisations/${orgB.id}/students`)
      .set('Cookie', outsiderTeacher.cookie)
      .send({ username: student.username });

    expect(res.status).toBe(403);
  });

  skipIfNoDb('changing organisationId in the URL cannot bypass authorization even with a valid teacher session', async () => {
    const orgA = await registerTestOrganisation();
    const orgB = await registerTestOrganisation();
    const teacherA = await registerTestTeacher(orgA.id);
    const student = await registerTestStudent('assign3');

    // teacherA is authenticated and legitimate, but tries to act on orgB,
    // which they never joined — the client-supplied organisationId in the
    // URL must not be trusted as authorization.
    const res = await request(app)
      .post(`/organisations/${orgB.id}/students`)
      .set('Cookie', teacherA.cookie)
      .send({ username: student.username });

    expect(res.status).toBe(403);
    const assignment = await prisma.studentOrganisation.findFirst({
      where: { organisationId: orgB.id },
    });
    expect(assignment).toBeNull();
  });

  skipIfNoDb('duplicate assignment of the same student to the same organisation is rejected (409)', async () => {
    const org = await registerTestOrganisation();
    const teacher = await registerTestTeacher(org.id);
    const student = await registerTestStudent('assign4');

    const first = await request(app)
      .post(`/organisations/${org.id}/students`)
      .set('Cookie', teacher.cookie)
      .send({ username: student.username });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/organisations/${org.id}/students`)
      .set('Cookie', teacher.cookie)
      .send({ username: student.username });
    expect(second.status).toBe(409);
  });

  skipIfNoDb('a student has no route to assign, remove, or change their own organisation membership', async () => {
    const org = await registerTestOrganisation();
    const student = await registerTestStudent('assign5');

    // No POST route exists on the student-scoped organisations path at all.
    const selfAssign = await request(app)
      .post('/student/organisations')
      .set('Cookie', student.cookie)
      .send({ organisationId: org.id });
    expect(selfAssign.status).toBe(404);

    // The teacher-only assignment endpoint rejects a student session outright.
    const viaTeacherRoute = await request(app)
      .post(`/organisations/${org.id}/students`)
      .set('Cookie', student.cookie)
      .send({ username: student.username });
    expect(viaTeacherRoute.status).toBe(403);

    // Confirm no assignment was ever created as a side effect.
    const assignment = await prisma.studentOrganisation.findFirst({
      where: { organisationId: org.id },
    });
    expect(assignment).toBeNull();
  });

  skipIfNoDb('GET /student/organisations only ever returns the authenticated student\'s own assignments', async () => {
    const org = await registerTestOrganisation();
    const teacher = await registerTestTeacher(org.id);
    const studentA = await registerTestStudent('assign6a');
    const studentB = await registerTestStudent('assign6b');

    await request(app)
      .post(`/organisations/${org.id}/students`)
      .set('Cookie', teacher.cookie)
      .send({ username: studentA.username });

    const resA = await request(app).get('/student/organisations').set('Cookie', studentA.cookie);
    const resB = await request(app).get('/student/organisations').set('Cookie', studentB.cookie);

    expect(resA.body).toHaveLength(1);
    expect(resB.body).toHaveLength(0);
  });
});
