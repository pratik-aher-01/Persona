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
    preferredVoiceSpec?: SpeechSynthesisVoice | string | null,
    genderPreference?: 'male' | 'female'
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

    // 2. Gender-aware voice selection heuristic
    if (genderPreference === 'male') {
      const maleKeywords = [
        'microsoft david',
        'microsoft guy',
        'microsoft mark',
        'google us english male',
        'daniel',
        'alex',
        'fred',
        'george',
        'james',
        'male',
      ];
      for (const kw of maleKeywords) {
        const found = candidates.find((v) => v.name.toLowerCase().includes(kw));
        if (found) return found;
      }
    } else if (genderPreference === 'female') {
      const femaleKeywords = [
        'microsoft jenny',
        'microsoft aria',
        'microsoft zira',
        'samantha',
        'karen',
        'victoria',
        'female',
      ];
      for (const kw of femaleKeywords) {
        const found = candidates.find((v) => v.name.toLowerCase().includes(kw));
        if (found) return found;
      }
    }

    // 3. Fallback high quality / natural voices by name keywords
    const preferredKeywords = [
      'natural',
      'online',
      'google us english',
      'daniel',
      'microsoft david',
      'microsoft guy',
      'samantha',
      'alex',
    ];

    for (const kw of preferredKeywords) {
      const found = candidates.find((v) => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }

    const anyEnVoice = candidates.find((v) => v.lang.startsWith('en'));
    if (anyEnVoice) return anyEnVoice;

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

      if (synth.paused) {
        synth.resume();
      }

      // Cancel any ongoing speech immediately before starting new utterance
      synth.cancel();

      if (synth.paused) {
        synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(options.text);

      const selectedVoice = this.selectBestVoice(this.getVoices(), options.voice, options.genderPreference);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      const emotionParams = this.getEmotionParams(options.emotion);
      utterance.pitch = options.pitch ?? emotionParams.pitch;
      utterance.rate = options.speed ?? emotionParams.rate;

      let heartbeatTimer: number | null = window.setInterval(() => {
        if (synth.speaking) {
          if (synth.paused) {
            synth.resume();
          }
        } else {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
        }
      }, 4000);

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        options.onEnd?.();
      };

      utterance.onerror = (event) => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (event.error === 'interrupted' || event.error === 'canceled') {
          return;
        }
        console.warn('[BrowserVoiceEngine] Utterance error:', event);
        options.onError?.(event);
      };

      synth.speak(utterance);

      if (synth.paused || synth.pending) {
        synth.resume();
      }

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
