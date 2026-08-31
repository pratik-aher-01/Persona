import type { Emotion } from '../types/persona';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speakUtterance(
  text: string,
  emotion: Emotion,
  onStart: () => void,
  onEnd: () => void,
  onError: (err: SpeechSynthesisErrorEvent | Error) => void
): boolean {
  if (!isSpeechSynthesisSupported()) {
    return false;
  }

  try {
    const synth = window.speechSynthesis;

    // Cancel any ongoing speech immediately before starting new utterance
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Select reasonable English voice if available
    const voices = synth.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en-US') || v.lang.startsWith('en')
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // Subtle pitch and rate adjustments based on visual emotion
    switch (emotion) {
      case 'warm':
        utterance.pitch = 1.05;
        utterance.rate = 0.95;
        break;
      case 'skeptical':
        utterance.pitch = 0.95;
        utterance.rate = 0.95;
        break;
      case 'impressed':
        utterance.pitch = 1.1;
        utterance.rate = 1.05;
        break;
      case 'stern':
        utterance.pitch = 0.9;
        utterance.rate = 0.9;
        break;
      case 'neutral':
      default:
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        break;
    }

    utterance.onstart = () => {
      onStart();
    };

    utterance.onend = () => {
      onEnd();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.warn('[SpeechSynthesis] Speech utterance error:', event);
      }
      onError(event);
    };

    synth.speak(utterance);
    return true;
  } catch (err) {
    console.error('[SpeechSynthesis] Exception starting speech:', err);
    onError(err instanceof Error ? err : new Error(String(err)));
    return false;
  }
}

export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
