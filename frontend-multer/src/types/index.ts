export interface User {
  username: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  isCompleted: boolean;
  isPublic: boolean;
  fileUrl?: string;
  categoryId?: string;
  category?: Category;
  createdAt: string;
  author: User;
}

export interface PaginationMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface TasksResponse {
  data: Task[];
  meta: PaginationMeta;
}