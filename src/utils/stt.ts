export interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;

  constructor(
    onInterimResult: (text: string) => void,
    onFinalResult: (text: string) => void,
    onStateChange: (listening: boolean) => void,
    onError: (error: string) => void
  ) {
    if (!isSpeechRecognitionSupported()) {
      return;
    }

    try {
      const win = window as unknown as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

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

      this.recognition.onerror = (event: any) => {
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

      this.recognition.onresult = (event: any) => {
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
