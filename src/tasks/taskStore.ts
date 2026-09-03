import type {
  TaskItem,
  TaskPriority,
  TaskStatus,
  ResultObject,
  ResultType,
  MissionState,
} from './taskTypes';

class TaskStore {
  private state: MissionState = {
    title: 'Agent Mission',
    tasks: [],
    activeResult: null,
  };

  private listeners: Set<() => void> = new Set();
  private idCounter = 1;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  public getState(): Readonly<MissionState> {
    return this.state;
  }

  public getTasks(filter?: TaskStatus | 'all'): TaskItem[] {
    if (!filter || filter === 'all') {
      return [...this.state.tasks];
    }
    return this.state.tasks.filter((t) => t.status === filter);
  }

  public getTaskById(id: string): TaskItem | undefined {
    return this.state.tasks.find((t) => t.id === id);
  }

  public getActiveResult(): ResultObject | null {
    return this.state.activeResult;
  }

  public setMissionTitle(title: string): void {
    this.state = {
      ...this.state,
      title: title.trim() || 'Agent Mission',
    };
    this.notify();
  }

  public createTask(
    title: string,
    description?: string,
    priority: TaskPriority = 'medium'
  ): TaskItem {
    const now = new Date().toISOString();
    const taskId = `task_${Date.now()}_${this.idCounter++}`;

    const newTask: TaskItem = {
      id: taskId,
      title: title.trim(),
      description: description ? description.trim() : undefined,
      priority,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.state = {
      ...this.state,
      tasks: [...this.state.tasks, newTask],
    };

    this.notify();
    return newTask;
  }

  public updateTask(
    taskId: string,
    updates: Partial<Pick<TaskItem, 'title' | 'description' | 'priority' | 'status'>>
  ): { success: boolean; task?: TaskItem; error?: string } {
    const existingIndex = this.state.tasks.findIndex((t) => t.id === taskId);
    if (existingIndex === -1) {
      return { success: false, error: 'Task not found' };
    }

    const existingTask = this.state.tasks[existingIndex];
    const now = new Date().toISOString();

    const updatedStatus = updates.status || existingTask.status;
    const isNowCompleted = updatedStatus === 'completed' && existingTask.status !== 'completed';

    const updatedTask: TaskItem = {
      ...existingTask,
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      status: updatedStatus,
      updatedAt: now,
      ...(isNowCompleted && { completedAt: now }),
    };

    const newTasks = [...this.state.tasks];
    newTasks[existingIndex] = updatedTask;

    this.state = {
      ...this.state,
      tasks: newTasks,
    };

    this.notify();
    return { success: true, task: updatedTask };
  }

  public completeTask(taskId: string): { success: boolean; task?: TaskItem; error?: string } {
    return this.updateTask(taskId, { status: 'completed' });
  }

  public showResult(
    title: string,
    summary: string,
    data?: Record<string, unknown>,
    type: ResultType = 'info'
  ): ResultObject {
    const now = new Date().toISOString();
    const resultId = `result_${Date.now()}`;

    const resultObj: ResultObject = {
      resultId,
      title: title.trim(),
      summary: summary.trim(),
      data,
      type,
      createdAt: now,
    };

    this.state = {
      ...this.state,
      activeResult: resultObj,
    };

    this.notify();
    return resultObj;
  }

  public dismissResult(): void {
    if (this.state.activeResult !== null) {
      this.state = {
        ...this.state,
        activeResult: null,
      };
      this.notify();
    }
  }

  public clearMission(): void {
    this.state = {
      title: 'Agent Mission',
      tasks: [],
      activeResult: null,
    };
    this.idCounter = 1;
    this.notify();
  }

  public getProgressPercentage(): number {
    if (this.state.tasks.length === 0) return 0;
    const completedCount = this.state.tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completedCount / this.state.tasks.length) * 100);
  }
}

export const taskStore = new TaskStore();
