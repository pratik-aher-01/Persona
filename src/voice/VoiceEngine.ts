import { BrowserVoiceEngine } from './BrowserVoiceEngine';
import type { IVoiceEngine, SpeakOptions } from './VoiceTypes';

export class VoiceEngineManager {
  private activeEngine: IVoiceEngine;

  constructor(engine?: IVoiceEngine) {
    this.activeEngine = engine || new BrowserVoiceEngine();
  }

  public setEngine(engine: IVoiceEngine): void {
    this.activeEngine = engine;
  }

  public getEngine(): IVoiceEngine {
    return this.activeEngine;
  }

  public isSupported(): boolean {
    return this.activeEngine.isSupported();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.activeEngine.getVoices();
  }

  public speak(options: SpeakOptions): boolean {
    return this.activeEngine.speak(options);
  }

  public stop(): void {
    this.activeEngine.stop();
  }
}

export const voiceEngine = new VoiceEngineManager();
