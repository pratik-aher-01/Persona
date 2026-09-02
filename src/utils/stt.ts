export interface SpeechRecognitionResultItem {
  transcript: string;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
  error?: string;
}

export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

export interface IWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export class SpeechRecognizer {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;

  constructor(
    onInterimResult: (text: string) => void,
    onFinalResult: (text: string) => void,
    onStateChange: (listening: boolean) => void,
    onError: (error: string) => void,
    onSpeechStart?: () => void
  ) {
    if (!isSpeechRecognitionSupported()) {
      return;
    }

    try {
      const win = window as unknown as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!SpeechRecognitionClass) return;

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        onStateChange(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onStateChange(false);
      };

      this.recognition.onerror = (event: SpeechRecognitionEvent) => {
        const err = event.error || 'unknown_error';
        if (err === 'not-allowed' || err === 'permission-denied') {
          onError('Microphone permission denied. Please allow access in browser settings.');
        } else if (err === 'no-speech') {
          onError('No speech detected. Please try speaking into your microphone again.');
        } else if (err !== 'aborted') {
          onError(`Speech recognition error: ${err}`);
        }
        this.isListening = false;
        onStateChange(false);
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        if (interim || final) {
          onSpeechStart?.();
        }

        if (interim) {
          onInterimResult(interim);
        }
        if (final) {
          onFinalResult(final);
        }
      };
    } catch (e) {
      console.error('[SpeechRecognizer] Instantiation error:', e);
    }
  }

  public start(): boolean {
    if (!this.recognition) return false;
    if (this.isListening) return true;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('[SpeechRecognizer] Start exception:', err);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('[SpeechRecognizer] Stop exception:', err);
      }
    }
  }
}
