export type UserRole = 'STUDENT' | 'TEACHER';

export interface StudentDto {
  id: string;
  fullName: string;
  phone: string;
  username: string;
  role: 'STUDENT';
  createdAt: string;
  updatedAt: string;
}

export interface TeacherDto {
  id: string;
  username: string;
  role: 'TEACHER';
  createdAt: string;
  updatedAt: string;
}

export type AuthUser = StudentDto | TeacherDto;

export interface AuthResponse<T extends AuthUser = AuthUser> {
  token: string;
  user: T;
}
