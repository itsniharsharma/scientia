import { prisma } from '../../lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';
import type { RegisterOrganisationInput, AssignStudentToOrganisationInput } from '@scientia/validators';
import type {
  OrganisationDto,
  OrganisationMembershipDto,
  StudentOrganisationDto,
} from '@scientia/types';
import { Prisma } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeOrganisationName(name: string): string {
  return name.trim().toLowerCase();
}

// Shared authorization gate: verifies the given teacher is actually a member
// of the given organisation and returns that organisation. Every
// organisation-scoped teacher action must call this before touching data —
// never trust a client-supplied organisationId as proof of authorization by
// itself. Returning the organisation (fetched in the same query via the
// relation) lets callers avoid a second round-trip just to read its name.
export async function requireTeacherOrgMember(
  teacherId: string,
  organisationId: string,
): Promise<{ id: string; name: string }> {
  const membership = await prisma.teacherOrganisation.findUnique({
    where: { teacherId_organisationId: { teacherId, organisationId } },
    include: { organisation: { select: { id: true, name: true } } },
  });
  if (!membership) {
    throw new ForbiddenError('You are not authorized for this organisation');
  }
  return membership.organisation;
}

function toOrganisationDto(o: { id: string; name: string; createdAt: Date }): OrganisationDto {
  return { id: o.id, name: o.name, createdAt: o.createdAt.toISOString() };
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function registerOrganisation(
  data: RegisterOrganisationInput,
): Promise<OrganisationDto> {
  const name = data.name.trim();
  const normalizedName = normalizeOrganisationName(name);

  let organisation;
  try {
    organisation = await prisma.organisation.create({
      data: { name, normalizedName },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('An organisation with this name already exists');
    }
    throw err;
  }

  return toOrganisationDto(organisation);
}

// Public listing — used to populate the teacher-signup organisation dropdown
// before the teacher has an account. Organisation names are not sensitive.
export async function listOrganisations(): Promise<OrganisationDto[]> {
  const organisations = await prisma.organisation.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  return organisations.map(toOrganisationDto);
}

export async function listMyOrganisations(
  teacherId: string,
): Promise<OrganisationMembershipDto[]> {
  const memberships = await prisma.teacherOrganisation.findMany({
    where: { teacherId },
    include: { organisation: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return memberships.map((m) => ({
    organisationId: m.organisation.id,
    organisationName: m.organisation.name,
    joinedAt: m.createdAt.toISOString(),
  }));
}

// Teachers self-select an organisation at signup with no approval gate beyond
// "it exists" — this lets a teacher associate with an ADDITIONAL existing
// organisation later on that same basis. It is not a student-style
// assignment: nobody else authorizes it, mirroring the signup dropdown.
export async function joinOrganisation(
  teacherId: string,
  organisationId: string,
): Promise<OrganisationMembershipDto> {
  const organisation = await prisma.organisation.findUnique({ where: { id: organisationId } });
  if (!organisation) throw new NotFoundError('Organisation not found');

  let membership;
  try {
    membership = await prisma.teacherOrganisation.create({
      data: { teacherId, organisationId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('You are already a member of this organisation');
    }
    throw err;
  }

  return {
    organisationId: organisation.id,
    organisationName: organisation.name,
    joinedAt: membership.createdAt.toISOString(),
  };
}

export async function assignStudentToOrganisation(
  organisationId: string,
  teacherId: string,
  data: AssignStudentToOrganisationInput,
): Promise<StudentOrganisationDto> {
  const organisation = await requireTeacherOrgMember(teacherId, organisationId);

  const student = await prisma.student.findUnique({
    where: { username: data.username.trim().toLowerCase() },
  });
  if (!student) throw new NotFoundError(`No student found with username "${data.username}"`);

  let assignment;
  try {
    assignment = await prisma.studentOrganisation.create({
      data: { studentId: student.id, organisationId, assignedByTeacherId: teacherId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('Student is already assigned to this organisation');
    }
    throw err;
  }

  return {
    studentId: student.id,
    username: student.username,
    fullName: student.fullName,
    organisationId: organisation.id,
    organisationName: organisation.name,
    assignedByTeacherId: teacherId,
    createdAt: assignment.createdAt.toISOString(),
  };
}

export async function listOrganisationStudents(
  organisationId: string,
  teacherId: string,
): Promise<StudentOrganisationDto[]> {
  const organisation = await requireTeacherOrgMember(teacherId, organisationId);

  const assignments = await prisma.studentOrganisation.findMany({
    where: { organisationId },
    include: { student: { select: { id: true, username: true, fullName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return assignments.map((a) => ({
    studentId: a.student.id,
    username: a.student.username,
    fullName: a.student.fullName,
    organisationId: organisation.id,
    organisationName: organisation.name,
    assignedByTeacherId: a.assignedByTeacherId,
    createdAt: a.createdAt.toISOString(),
  }));
}

// Student-facing — always scoped to the authenticated student's own id.
// There is no parameter here that lets a caller ask for another student's
// organisations; the id comes from the verified JWT (req.user.userId), never
// from the request body/params.
export async function listMyStudentOrganisations(
  studentId: string,
): Promise<OrganisationMembershipDto[]> {
  const assignments = await prisma.studentOrganisation.findMany({
    where: { studentId },
    include: { organisation: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return assignments.map((a) => ({
    organisationId: a.organisation.id,
    organisationName: a.organisation.name,
    joinedAt: a.createdAt.toISOString(),
  }));
}
