import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import type {
  RegisterStudentInput,
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
  username: string;
  createdAt: Date;
  updatedAt: Date;
};

type TeacherRecord = {
  id: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
};

function toStudentDto(r: StudentRecord): StudentDto {
  return {
    id: r.id,
    fullName: r.fullName,
    phone: r.phone,
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
    role: 'TEACHER',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function registerStudent(
  data: RegisterStudentInput,
): Promise<AuthResponse<StudentDto>> {
  const normalizedUsername = data.username.toLowerCase();

  const conflict = await prisma.student.findFirst({
    where: {
      OR: [{ phone: data.phone }, { username: normalizedUsername }],
    },
  });

  if (conflict) {
    if (conflict.phone === data.phone) {
      throw new ConflictError('An account with this phone number already exists');
    }
    throw new ConflictError('This username is already taken');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const student = await prisma.student.create({
    data: {
      fullName: data.fullName.trim(),
      phone: data.phone,
      username: normalizedUsername,
      password: hashedPassword,
    },
  });

  return { token: signToken(student.id, 'STUDENT'), user: toStudentDto(student) };
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
