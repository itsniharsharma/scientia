import { api } from './axios';
import type { OrganisationDto, OrganisationMembershipDto, StudentOrganisationDto } from '../types/organisation';

// Public — populates the teacher-signup dropdown and the organisation
// registration confirmation. No authentication required.
export async function listOrganisations(): Promise<OrganisationDto[]> {
  const res = await api.get('/organisations');
  return res.data;
}

export async function registerOrganisation(name: string): Promise<OrganisationDto> {
  const res = await api.post('/organisations/register', { name });
  return res.data;
}

// Teacher-authenticated
export async function getMyOrganisations(): Promise<OrganisationMembershipDto[]> {
  const res = await api.get('/organisations/mine');
  return res.data;
}

export async function joinOrganisation(organisationId: string): Promise<OrganisationMembershipDto> {
  const res = await api.post(`/organisations/${organisationId}/join`);
  return res.data;
}

export async function listOrganisationStudents(organisationId: string): Promise<StudentOrganisationDto[]> {
  const res = await api.get(`/organisations/${organisationId}/students`);
  return res.data;
}

export async function assignStudentToOrganisation(
  organisationId: string,
  username: string,
): Promise<StudentOrganisationDto> {
  const res = await api.post(`/organisations/${organisationId}/students`, { username });
  return res.data;
}

// Student-authenticated — read only, always the caller's own assignments.
export async function getMyStudentOrganisations(): Promise<OrganisationMembershipDto[]> {
  const res = await api.get('/student/organisations');
  return res.data;
}
