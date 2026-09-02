export type SessionState =
  | 'IDLE'
  | 'REQUESTING_MIC'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'ENDED'
  | 'ERROR';

export interface SessionConfig {
  onStateChange: (state: SessionState) => void;
  onError: (errorMessage: string) => void;
  onUserTranscript: (transcript: string) => void;
  onAgentResponse: (response: string) => void;
}

export class ConversationSessionController {
  private currentState: SessionState = 'IDLE';
  private isActiveSession = false;
  private config: SessionConfig | null = null;
  private listeners: Set<(state: SessionState) => void> = new Set();

  public attachConfig(config: SessionConfig) {
    this.config = config;
  }

  public subscribe(cb: (state: SessionState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public getState(): SessionState {
    return this.currentState;
  }

  public isSessionActive(): boolean {
    return this.isActiveSession;
  }

  public setState(state: SessionState) {
    this.currentState = state;
    this.config?.onStateChange(state);
    this.listeners.forEach((cb) => cb(state));
  }

  public startSession() {
    if (this.isActiveSession) return;

    this.isActiveSession = true;
    this.setState('REQUESTING_MIC');
  }

  public onMicGranted() {
    if (!this.isActiveSession) return;
    this.setState('LISTENING');
  }

  public onMicError(msg: string) {
    this.isActiveSession = false;
    this.setState('ERROR');
    this.config?.onError(msg);
  }

  public onUserSpeechCaptured(transcript: string) {
    if (!this.isActiveSession || !transcript.trim()) return;

    this.config?.onUserTranscript(transcript);
    this.setState('PROCESSING');
  }

  public onAgentSpeechStart(response: string) {
    if (!this.isActiveSession) return;

    this.config?.onAgentResponse(response);
    this.setState('SPEAKING');
  }

  public onAgentSpeechEnd() {
    if (!this.isActiveSession) {
      this.setState('IDLE');
      return;
    }
    // Automatically transition back to LISTENING for next user turn
    this.setState('LISTENING');
  }

  public stopSession() {
    this.isActiveSession = false;
    this.setState('ENDED');
  }

  public resetToIdle() {
    this.isActiveSession = false;
    this.setState('IDLE');
  }
}

export const conversationSessionInstance = new ConversationSessionController();
