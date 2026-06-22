import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Unit tests for auth service logic ───────────────────────────────────────
// These test the business logic without hitting a real database by mocking Prisma.

vi.mock('../lib/prisma', () => ({
  prisma: {
    student: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    teacher: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn().mockResolvedValue('$hashed') },
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue('$hashed'),
}));

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { registerStudent, loginStudent, loginTeacher } from '../modules/auth/auth.service';
import { ConflictError, UnauthorizedError } from '../shared/errors';

const mockStudent = {
  id: 'student-1',
  fullName: 'Test Student',
  phone: '9999999999',
  username: 'teststudent',
  password: '$hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTeacher = {
  id: 'teacher-1',
  username: 'raj@scientia',
  password: '$hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('registerStudent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a student and returns a token', async () => {
    (prisma.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.student.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockStudent);

    const result = await registerStudent({
      fullName: 'Test Student',
      phone: '9999999999',
      username: 'teststudent',
      password: 'password123',
    });

    expect(result.token).toBeTruthy();
    expect(result.user.username).toBe('teststudent');
    expect(result.user.role).toBe('STUDENT');
  });

  it('throws ConflictError when phone already exists', async () => {
    (prisma.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockStudent,
      phone: '9999999999',
    });

    await expect(
      registerStudent({
        fullName: 'Test',
        phone: '9999999999',
        username: 'newuser',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('throws ConflictError when username already exists', async () => {
    (prisma.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockStudent,
      phone: '1111111111',
    });

    await expect(
      registerStudent({
        fullName: 'Test',
        phone: '8888888888',
        username: 'teststudent',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictError);
  });
});

describe('loginStudent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns token on valid credentials', async () => {
    (prisma.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockStudent);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await loginStudent({ username: 'teststudent', password: 'password123' });
    expect(result.token).toBeTruthy();
    expect(result.user.role).toBe('STUDENT');
  });

  it('throws UnauthorizedError on wrong password', async () => {
    (prisma.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockStudent);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      loginStudent({ username: 'teststudent', password: 'wrongpass' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when student not found', async () => {
    (prisma.student.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      loginStudent({ username: 'nobody', password: 'anything' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

describe('loginTeacher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns token on valid credentials', async () => {
    (prisma.teacher.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTeacher);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await loginTeacher({ username: 'raj@scientia', password: 'reet32999' });
    expect(result.token).toBeTruthy();
    expect(result.user.role).toBe('TEACHER');
  });

  it('throws UnauthorizedError on wrong password', async () => {
    (prisma.teacher.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTeacher);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      loginTeacher({ username: 'raj@scientia', password: 'wrongpass' }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
