import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../shared/errors';
import type { TeacherDto } from '@scientia/types';

export async function getTeacherProfile(teacherId: string): Promise<TeacherDto> {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new NotFoundError('Teacher not found');
  return {
    id: teacher.id,
    username: teacher.username,
    role: 'TEACHER',
    createdAt: teacher.createdAt.toISOString(),
    updatedAt: teacher.updatedAt.toISOString(),
  };
}
