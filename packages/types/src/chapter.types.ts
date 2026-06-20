export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterDto {
  name: string;
}

export interface UpdateChapterDto {
  name: string;
}
