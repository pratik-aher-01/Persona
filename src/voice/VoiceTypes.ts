import type { Emotion } from '../types/persona';

export interface SpeakOptions {
  text: string;
  emotion: Emotion;
  voice?: SpeechSynthesisVoice | string | null;
  speed?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error | SpeechSynthesisErrorEvent) => void;
}

export interface IVoiceEngine {
  readonly id: string;
  readonly name: string;
  isSupported(): boolean;
  getVoices(): SpeechSynthesisVoice[];
  speak(options: SpeakOptions): boolean;
  stop(): void;
}
