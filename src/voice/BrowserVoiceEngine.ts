import type { Emotion } from '../types/persona';
import type { IVoiceEngine, SpeakOptions } from './VoiceTypes';

export class BrowserVoiceEngine implements IVoiceEngine {
  public readonly id = 'browser-speech-synthesis';
  public readonly name = 'Browser SpeechSynthesis Engine';

  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (this.isSupported()) {
      this.updateVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.updateVoices();
        };
      }
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    );
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && this.isSupported()) {
      this.updateVoices();
    }
    return this.cachedVoices;
  }

  private updateVoices(): void {
    if (this.isSupported()) {
      this.cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }

  /**
   * Deterministic voice selection algorithm prioritizing natural English system voices
   * while avoiding robotic defaults where possible.
   */
  public selectBestVoice(
    voices?: SpeechSynthesisVoice[],
    preferredVoiceSpec?: SpeechSynthesisVoice | string | null
  ): SpeechSynthesisVoice | null {
    const list = voices && voices.length > 0 ? voices : this.getVoices();
    if (list.length === 0) {
      return null;
    }

    // 1. If explicit voice object or name requested
    if (preferredVoiceSpec) {
      if (typeof preferredVoiceSpec === 'object') {
        return preferredVoiceSpec;
      }
      const match = list.find(
        (v) =>
          v.name.toLowerCase() === preferredVoiceSpec.toLowerCase() ||
          v.voiceURI.toLowerCase() === preferredVoiceSpec.toLowerCase()
      );
      if (match) return match;
    }

    // Filter English voices
    const englishVoices = list.filter(
      (v) => v.lang.startsWith('en') || v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')
    );

    const candidates = englishVoices.length > 0 ? englishVoices : list;

    // 2. Look for high quality / natural voices by name keywords
    const preferredKeywords = [
      'natural',
      'online',
      'google us english',
      'google english',
      'samantha',
      'karen',
      'daniel',
      'victoria',
      'microsoft jenny',
      'microsoft guy',
      'microsoft aria',
      'microsoft zira',
      'microsoft david',
      'alex',
    ];

    for (const kw of preferredKeywords) {
      const found = candidates.find((v) => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }

    // 3. Prefer non-default local English voice over hard-robotic fallback
    const enUsVoice = candidates.find((v) => v.lang === 'en-US' || v.lang.startsWith('en-US'));
    if (enUsVoice) return enUsVoice;

    const anyEnVoice = candidates.find((v) => v.lang.startsWith('en'));
    if (anyEnVoice) return anyEnVoice;

    // 4. Default fallback
    return candidates[0] || null;
  }

  /**
   * Subtle human-like emotion to speech parameters mapping
   */
  private getEmotionParams(emotion: Emotion): { pitch: number; rate: number } {
    switch (emotion) {
      case 'warm':
        return { pitch: 1.05, rate: 0.95 };
      case 'skeptical':
        return { pitch: 0.95, rate: 0.95 };
      case 'impressed':
        return { pitch: 1.1, rate: 1.05 };
      case 'stern':
        return { pitch: 0.9, rate: 0.9 };
      case 'neutral':
      default:
        return { pitch: 1.0, rate: 1.0 };
    }
  }

  public speak(options: SpeakOptions): boolean {
    if (!this.isSupported()) {
      console.warn('[BrowserVoiceEngine] SpeechSynthesis not supported in this browser.');
      options.onError?.(new Error('SpeechSynthesis not supported'));
      return false;
    }

    try {
      const synth = window.speechSynthesis;

      // Cancel any ongoing speech immediately before starting new utterance
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(options.text);

      const selectedVoice = this.selectBestVoice(this.getVoices(), options.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      const emotionParams = this.getEmotionParams(options.emotion);
      utterance.pitch = options.pitch ?? emotionParams.pitch;
      utterance.rate = options.speed ?? emotionParams.rate;

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        options.onEnd?.();
      };

      utterance.onerror = (event) => {
        if (event.error === 'interrupted' || event.error === 'canceled') {
          // Intentionally cancelled or interrupted — do not treat as an error or trigger idle reset
          return;
        }
        console.warn('[BrowserVoiceEngine] Utterance error:', event);
        options.onError?.(event);
      };

      synth.speak(utterance);
      return true;
    } catch (err) {
      console.error('[BrowserVoiceEngine] Exception starting speech:', err);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      options.onError?.(errorObj);
      return false;
    }
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
