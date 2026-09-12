import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import type {
  RegisterStudentInput,
  RegisterTeacherInput,
  LoginStudentInput,
  LoginTeacherInput,
} from '@scientia/validators';
import type { StudentDto, TeacherDto, AuthResponse } from '@scientia/types';

const SALT_ROUNDS = 12;

function signToken(sub: string, role: 'STUDENT' | 'TEACHER'): string {
  return jwt.sign({ sub, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

type StudentRecord = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  username: string;
  createdAt: Date;
  updatedAt: Date;
};

type TeacherRecord = {
  id: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toStudentDto(r: StudentRecord): StudentDto {
  return {
    id: r.id,
    fullName: r.fullName,
    phone: r.phone,
    email: r.email,
    username: r.username,
    role: 'STUDENT',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toTeacherDto(r: TeacherRecord): TeacherDto {
  return {
    id: r.id,
    username: r.username,
    fullName: r.fullName,
    phone: r.phone,
    email: r.email,
    role: 'TEACHER',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function registerStudent(
  data: RegisterStudentInput,
): Promise<AuthResponse<StudentDto>> {
  const normalizedUsername = data.username.toLowerCase();
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

  // Username uniqueness is checked against the global `Username` registry —
  // not just the students table — so a student can never claim a username
  // a teacher already holds, and vice versa.
  const [usernameConflict, fieldConflict] = await Promise.all([
    prisma.username.findUnique({ where: { username: normalizedUsername } }),
    prisma.student.findFirst({
      where: { OR: [{ phone: data.phone }, { email: data.email }] },
    }),
  ]);

  if (usernameConflict) {
    throw new ConflictError('This username is already taken');
  }
  if (fieldConflict) {
    if (fieldConflict.phone === data.phone) {
      throw new ConflictError('An account with this phone number already exists');
    }
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // The checks above are not atomic with this create — under a concurrent
  // double-submit, both requests can pass the checks before either commits,
  // and the loser hits a DB unique constraint (Prisma P2002) instead of the
  // friendly ConflictError above. Caught here and converted to the same
  // conflict response instead of a raw 500. The Student row and its Username
  // registry entry are created atomically in one transaction so the two can
  // never drift apart.
  let student;
  try {
    student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          fullName,
          phone: data.phone,
          email: data.email,
          username: normalizedUsername,
          password: hashedPassword,
        },
      });
      await tx.username.create({
        data: { username: normalizedUsername, ownerType: 'STUDENT', ownerId: created.id },
      });
      return created;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('An account with this username, phone number, or email already exists');
    }
    throw err;
  }

  return { token: signToken(student.id, 'STUDENT'), user: toStudentDto(student) };
}

export async function registerTeacher(
  data: RegisterTeacherInput,
): Promise<AuthResponse<TeacherDto>> {
  const normalizedUsername = data.username.toLowerCase();
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

  // The organisation must already exist — a teacher can never fabricate one
  // by passing an arbitrary id here. This is the server-side check that
  // makes the signup dropdown's "existing organisations only" constraint
  // actually binding, not just a frontend convenience.
  const organisation = await prisma.organisation.findUnique({
    where: { id: data.organisationId },
  });
  if (!organisation) {
    throw new NotFoundError('Organisation not found');
  }

  const [usernameConflict, fieldConflict] = await Promise.all([
    prisma.username.findUnique({ where: { username: normalizedUsername } }),
    prisma.teacher.findFirst({
      where: { OR: [{ phone: data.phone }, { email: data.email }] },
    }),
  ]);

  if (usernameConflict) {
    throw new ConflictError('This username is already taken');
  }
  if (fieldConflict) {
    if (fieldConflict.phone === data.phone) {
      throw new ConflictError('An account with this phone number already exists');
    }
    throw new ConflictError('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Teacher row, its Username registry entry, and its initial
  // TeacherOrganisation membership are all created in one transaction.
  let teacher;
  try {
    teacher = await prisma.$transaction(async (tx) => {
      const created = await tx.teacher.create({
        data: {
          username: normalizedUsername,
          password: hashedPassword,
          fullName,
          phone: data.phone,
          email: data.email,
        },
      });
      await tx.username.create({
        data: { username: normalizedUsername, ownerType: 'TEACHER', ownerId: created.id },
      });
      await tx.teacherOrganisation.create({
        data: { teacherId: created.id, organisationId: organisation.id },
      });
      return created;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('An account with this username, phone number, or email already exists');
    }
    throw err;
  }

  return { token: signToken(teacher.id, 'TEACHER'), user: toTeacherDto(teacher) };
}

export async function loginStudent(
  data: LoginStudentInput,
): Promise<AuthResponse<StudentDto>> {
  const student = await prisma.student.findUnique({
    where: { username: data.username.toLowerCase() },
  });

  if (!student || !(await bcrypt.compare(data.password, student.password))) {
    throw new UnauthorizedError('Invalid username or password');
  }

  return { token: signToken(student.id, 'STUDENT'), user: toStudentDto(student) };
}

export async function loginTeacher(
  data: LoginTeacherInput,
): Promise<AuthResponse<TeacherDto>> {
  const teacher = await prisma.teacher.findUnique({
    where: { username: data.username.toLowerCase() },
  });

  if (!teacher || !(await bcrypt.compare(data.password, teacher.password))) {
    throw new UnauthorizedError('Invalid username or password');
  }

  return { token: signToken(teacher.id, 'TEACHER'), user: toTeacherDto(teacher) };
}

export async function getCurrentUser(
  userId: string,
  role: 'STUDENT' | 'TEACHER',
): Promise<StudentDto | TeacherDto> {
  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { id: userId } });
    if (!student) throw new UnauthorizedError('User not found');
    return toStudentDto(student);
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: userId } });
  if (!teacher) throw new UnauthorizedError('User not found');
  return toTeacherDto(teacher);
}
