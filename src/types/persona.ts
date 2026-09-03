export type Emotion = 
  | 'neutral'
  | 'warm'
  | 'skeptical'
  | 'impressed'
  | 'stern'
  | 'concerned'
  | 'surprised'
  | 'thinking';


export type TurnStatus = 'idle' | 'listening' | 'user_finished' | 'agent_processing' | 'speaking';
export type AvatarStatus = TurnStatus;
export type ScenarioMode = string;

export interface ToolCallRecord {
  tool: string;
  timestamp: string;
  args: Record<string, unknown>;
}

export type ThemeMode = 'light' | 'dark';

export interface VrmTuningConfig {
  lighting: {
    keyIntensity: number;
    fillIntensity: number;
    rimIntensity: number;
    ambientIntensity: number;
    keyX: number;
    keyY: number;
    keyZ: number;
    exposure: number;
  };
  camera: {
    fov: number;
    cameraZ: number;
    cameraYOffset: number;
    cameraLookYOffset: number;
    x: number;
    y: number;
  };
  avatar: {
    scale: number;
    x: number;
    y: number;
    z: number;
  };
}

export type AgentBehavioralState = 
  | 'LISTENING' 
  | 'THINKING' 
  | 'PLANNING' 
  | 'EXECUTING' 
  | 'EVALUATING' 
  | 'WAITING' 
  | 'RESPONDING' 
  | 'COMPLETED';

export interface DemoState {
  status: AvatarStatus;
  behavioralState: AgentBehavioralState;
  attentionPercentage: number;
  behavioralAction: string;
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
  activePersonaId: string;
  selectedPersonaId: string;
  theme: ThemeMode;
}

