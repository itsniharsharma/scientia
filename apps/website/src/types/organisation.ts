export interface OrganisationDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface OrganisationMembershipDto {
  organisationId: string;
  organisationName: string;
  joinedAt: string;
}

export interface StudentOrganisationDto {
  studentId: string;
  username: string;
  fullName: string;
  organisationId: string;
  organisationName: string;
  assignedByTeacherId: string;
  createdAt: string;
}
