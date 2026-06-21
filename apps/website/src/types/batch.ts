export interface BatchStudentDto {
  studentId: string;
  username: string;
  fullName: string;
  joinedAt: string;
}

export interface BatchDto {
  id: string;
  name: string;
  teacherId: string;
  studentCount: number;
  testCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchDetailDto extends BatchDto {
  students: BatchStudentDto[];
}
