export type Emotion = 'neutral' | 'warm' | 'skeptical' | 'impressed' | 'stern';

export type TurnStatus = 'idle' | 'listening' | 'user_finished' | 'agent_processing' | 'speaking';
export type AvatarStatus = TurnStatus;

export interface ToolCallRecord {
  tool: string;
  timestamp: string;
  args: Record<string, unknown>;
}

export interface DemoState {
  status: AvatarStatus;
  emotion: Emotion;
  dialogue: string;
  lastToolCall: ToolCallRecord | null;
  webMcpAvailable: boolean;
  webMcpRegistered: boolean;
  userTranscript: string;
  pendingUserUtterance: string;
  utteranceId: number;
  interimTranscript: string;
  isListening: boolean;
  micError: string | null;
}
