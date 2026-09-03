export interface TopicObservation {
  topic: string;
  confidence: 'low' | 'medium' | 'high';
  difficulty?: string;
  previousIssue?: string;
  lastDiscussed: string;
}

class SessionMemoryStore {
  private observations: Map<string, TopicObservation> = new Map();
  private currentFocusTopic: string | null = null;

  public setObservation(topic: string, details: Partial<Omit<TopicObservation, 'topic' | 'lastDiscussed'>>): TopicObservation {
    const key = topic.trim().toLowerCase();
    const existing = this.observations.get(key);
    const now = new Date().toISOString();

    const updated: TopicObservation = {
      topic: topic.trim(),
      confidence: details.confidence || existing?.confidence || 'medium',
      difficulty: details.difficulty !== undefined ? details.difficulty : existing?.difficulty,
      previousIssue: details.previousIssue !== undefined ? details.previousIssue : existing?.previousIssue,
      lastDiscussed: now,
    };

    this.observations.set(key, updated);
    this.currentFocusTopic = topic.trim();
    return updated;
  }

  public getObservation(topic: string): TopicObservation | undefined {
    return this.observations.get(topic.trim().toLowerCase());
  }

  public getCurrentFocus(): string | null {
    return this.currentFocusTopic;
  }

  public getAllObservations(): TopicObservation[] {
    return Array.from(this.observations.values());
  }

  public clear(): void {
    this.observations.clear();
    this.currentFocusTopic = null;
  }
}

export const sessionMemoryStore = new SessionMemoryStore();
