export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type ResultType = 'info' | 'success' | 'warning' | 'error';

export interface ResultObject {
  resultId: string;
  title: string;
  summary: string;
  data?: Record<string, unknown>;
  type: ResultType;
  createdAt: string;
}

export interface MissionState {
  title: string;
  tasks: TaskItem[];
  activeResult: ResultObject | null;
}
