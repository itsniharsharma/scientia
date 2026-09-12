export type UserRole = 'STUDENT' | 'TEACHER';

export interface StudentDto {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  username: string;
  role: 'STUDENT';
  createdAt: string;
  updatedAt: string;
}

export interface TeacherDto {
  id: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  role: 'TEACHER';
  createdAt: string;
  updatedAt: string;
}

export type AuthUser = StudentDto | TeacherDto;
