import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Unit tests for auth service logic ───────────────────────────────────────
// These test the business logic without hitting a real database by mocking Prisma.

const mockTx = {
  student: { create: vi.fn() },
  teacher: { create: vi.fn() },
  username: { create: vi.fn() },
  teacherOrganisation: { create: vi.fn() },
};

vi.mock('../lib/prisma', () => ({
  prisma: {
    student: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    username: {
      findUnique: vi.fn(),
    },
    organisation: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn().mockResolvedValue('$hashed') },
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue('$hashed'),
}));

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { registerStudent, registerTeacher, loginStudent, loginTeacher } from '../modules/auth/auth.service';
import { ConflictError, NotFoundError, UnauthorizedError } from '../shared/errors';

const mockStudent = {
  id: 'student-1',
  fullName: 'Test Student',
  phone: '9999999999',
  email: 'test.student@example.com',
  username: 'teststudent',
  password: '$hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTeacher = {
  id: 'teacher-1',
  username: 'raj@scientia',
  fullName: 'Raj Teacher',
  phone: '9888888888',
  email: 'raj@scientia.example.com',
  password: '$hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('registerStudent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );
  });

  it('creates a student and returns a token', async () => {
    (prisma.username.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockTx.student.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockStudent);

    const result = await registerStudent({
      firstName: 'Test',
      lastName: 'Student',
      phone: '9999999999',
      email: 'test.student@example.com',
      username: 'teststudent',
      password: 'password123',
    });

    expect(result.token).toBeTruthy();
    expect(result.user.username).toBe('teststudent');
    expect(result.user.role).toBe('STUDENT');
  });

  it('throws ConflictError when username is already taken (global registry)', async () => {
    (prisma.username.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      username: 'teststudent',
      ownerType: 'TEACHER',
      ownerId: 'someone-else',
      createdAt: new Date(),
    });

    await expect(
      registerStudent({
        firstName: 'Test',
        lastName: 'User',
        phone: '9999999999',
        email: 'new.user@example.com',
        username: 'teststudent',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('throws ConflictError when phone already exists', async () => {
    (prisma.username.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockStudent,
      phone: '9999999999',
    });

    await expect(
      registerStudent({
        firstName: 'Test',
        lastName: 'User',
        phone: '9999999999',
        email: 'another@example.com',
        username: 'newuser',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('throws ConflictError when email already exists', async () => {
    (prisma.username.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockStudent,
      phone: '1111111111',
    });

    await expect(
      registerStudent({
        firstName: 'Test',
        lastName: 'User',
        phone: '8888888888',
        email: 'test.student@example.com',
        username: 'newuser2',
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

describe('registerTeacher', () => {
  const validInput = {
    firstName: 'Raj',
    lastName: 'Teacher',
    phone: '9888888888',
    email: 'raj@scientia.example.com',
    username: 'rajteacher',
    password: 'password123',
    organisationId: 'org-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx),
    );
  });

  it('rejects registration against a nonexistent organisation — cannot fabricate an organisationId', async () => {
    (prisma.organisation.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(registerTeacher(validInput)).rejects.toThrow(NotFoundError);
    // Must fail before ever touching username/teacher creation.
    expect(prisma.username.findUnique).not.toHaveBeenCalled();
  });

  it('creates a teacher, links them to the selected organisation, and returns a token', async () => {
    (prisma.organisation.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'org-1',
      name: 'Aakash',
      normalizedName: 'aakash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (prisma.username.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.teacher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockTx.teacher.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockTeacher);

    const result = await registerTeacher(validInput);

    expect(result.token).toBeTruthy();
    expect(result.user.role).toBe('TEACHER');
    expect(mockTx.teacherOrganisation.create).toHaveBeenCalledWith({
      data: { teacherId: mockTeacher.id, organisationId: 'org-1' },
    });
  });

  it('throws ConflictError when username is already taken (global registry)', async () => {
    (prisma.organisation.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'org-1',
      name: 'Aakash',
      normalizedName: 'aakash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (prisma.username.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      username: 'rajteacher',
      ownerType: 'STUDENT',
      ownerId: 'some-student',
      createdAt: new Date(),
    });

    await expect(registerTeacher(validInput)).rejects.toThrow(ConflictError);
  });
});
