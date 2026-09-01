import { voiceEngine } from '../voice';
import type { Emotion } from '../types/persona';

export function isSpeechSynthesisSupported(): boolean {
  return voiceEngine.isSupported();
}

export function speakUtterance(
  text: string,
  emotion: Emotion,
  onStart: () => void,
  onEnd: () => void,
  onError: (err: SpeechSynthesisErrorEvent | Error) => void
): boolean {
  return voiceEngine.speak({
    text,
    emotion,
    onStart,
    onEnd,
    onError,
  });
}

export function stopSpeech(): void {
  voiceEngine.stop();
}
