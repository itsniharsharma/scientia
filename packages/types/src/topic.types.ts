export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicDto {
  name: string;
}

export interface UpdateTopicDto {
  name: string;
}
