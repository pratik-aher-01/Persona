import type * as THREE from 'three';
import type { Emotion } from '../types/persona';

export type PersonaEmotion = Emotion; // 'neutral' | 'warm' | 'skeptical' | 'impressed' | 'stern'

export type AvatarActivity = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AvatarState {
  emotion: PersonaEmotion;
  activity: AvatarActivity;
  gazeTarget?: THREE.Vector3;
  isBlinking: boolean;
}

export interface VrmValidationReport {
  vrmVersion: string;
  humanoidAvailable: boolean;
  expressionManagerAvailable: boolean;
  lookAtAvailable: boolean;
  springBonesAvailable: boolean;
  presetExpressions: string[];
  customExpressions: string[];
  vrmMetaName?: string;
  vrmMetaAuthor?: string;
}

export interface AvatarControllerApi {
  setEmotion: (emotion: PersonaEmotion) => void;
  setActivity: (activity: AvatarActivity) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  lookAt: (target: THREE.Vector3 | { x: number; y: number; z: number }) => void;
  playGesture: (gestureName: string) => void;
  getValidationReport: () => VrmValidationReport | null;
  getState: () => AvatarState;
}
