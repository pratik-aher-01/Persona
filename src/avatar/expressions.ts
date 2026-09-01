import type { VRM } from '@pixiv/three-vrm';
import type { PersonaEmotion, AvatarActivity } from './avatarTypes';

export class ExpressionController {
  private vrm: VRM | null = null;
  private currentEmotion: PersonaEmotion = 'neutral';
  private currentActivity: AvatarActivity = 'idle';
  private targetWeights: Map<string, number> = new Map();
  private currentWeights: Map<string, number> = new Map();
  private isSpeaking = false;

  // Organic mouth motion state — multiple oscillators to avoid robotic pulse
  private mouthT1 = 0;
  private mouthT2 = 0;
  private mouthT3 = 0;
  private smoothMouth = 0;

  constructor(vrm?: VRM) {
    if (vrm) {
      this.setVRM(vrm);
    }
  }

  public setVRM(vrm: VRM) {
    this.vrm = vrm;
    this.applyEmotion(this.currentEmotion);
  }

  public setEmotion(emotion: PersonaEmotion) {
    this.currentEmotion = emotion;
    this.applyEmotion(emotion);
  }

  public getEmotion(): PersonaEmotion {
    return this.currentEmotion;
  }

  public setActivity(activity: AvatarActivity) {
    this.currentActivity = activity;
    // Re-apply emotion to adjust intensities for listening/thinking
    this.applyEmotion(this.currentEmotion);
  }

  public setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    if (!speaking) {
      // Reset all mouth shape targets smoothly to zero
      this.setTargetWeight('aa', 0);
      this.setTargetWeight('ih', 0);
      this.setTargetWeight('ou', 0);
      this.setTargetWeight('ee', 0);
      this.setTargetWeight('oh', 0);
      // Reset mouth oscillators for next speaking session
      this.mouthT1 = 0;
      this.mouthT2 = 0;
      this.mouthT3 = 0;
    }
  }

  public setCustomExpression(name: string, weight: number) {
    this.setTargetWeight(name, weight);
  }

  private setTargetWeight(name: string, weight: number) {
    this.targetWeights.set(name, Math.max(0, Math.min(1, weight)));
  }

  private applyEmotion(emotion: PersonaEmotion) {
    // Reset all emotion-tier expression targets
    const resetExpressions = ['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised'];
    for (const exp of resetExpressions) {
      this.setTargetWeight(exp, 0);
    }

    if (!this.vrm || !this.vrm.expressionManager) return;

    const available = this.vrm.expressionManager.expressionMap;

    // Scale emotion intensity slightly by activity
    // Listening → neutral/attentive lean (soften strong emotions slightly)
    // Thinking → subtle (pulled inward)
    let intensityScale = 1.0;
    if (this.currentActivity === 'thinking') intensityScale = 0.75;
    else if (this.currentActivity === 'listening') intensityScale = 0.9;

    switch (emotion) {
      case 'warm':
        if (available['happy'])   this.setTargetWeight('happy',   0.82 * intensityScale);
        else if (available['relaxed']) this.setTargetWeight('relaxed', 0.68 * intensityScale);
        break;

      case 'skeptical':
        if (available['neutral']) this.setTargetWeight('neutral', 0.65 * intensityScale);
        if (available['angry'])   this.setTargetWeight('angry',   0.28 * intensityScale);
        else if (available['surprised']) this.setTargetWeight('surprised', 0.20 * intensityScale);
        break;

      case 'impressed':
        if (available['surprised']) this.setTargetWeight('surprised', 0.62 * intensityScale);
        if (available['happy'])     this.setTargetWeight('happy',     0.42 * intensityScale);
        break;

      case 'stern':
        if (available['angry']) this.setTargetWeight('angry', 0.68 * intensityScale);
        else if (available['sad']) this.setTargetWeight('sad', 0.42 * intensityScale);
        break;

      case 'neutral':
      default:
        if (available['neutral']) this.setTargetWeight('neutral', 1.0 * intensityScale);
        break;
    }
  }

  public update(delta: number) {
    if (!this.vrm || !this.vrm.expressionManager) return;

    // ── ORGANIC MOUTH MOTION ───────────────────────────────────────
    if (this.isSpeaking) {
      // Three detuned oscillators that beat against each other
      // This creates an irregular, organic open/close rhythm
      this.mouthT1 += delta * 10.8; // primary syllable rate
      this.mouthT2 += delta *  7.3; // secondary envelope
      this.mouthT3 += delta *  3.1; // slow amplitude modulation

      // Combine: primary * secondary envelope * slow mod
      const primary  = Math.abs(Math.sin(this.mouthT1));
      const envelope = (Math.sin(this.mouthT2) * 0.5 + 0.5);           // 0..1
      const slowMod  = (Math.sin(this.mouthT3) * 0.3 + 0.7);           // 0.4..1.0
      const rawMouth = primary * envelope * slowMod;

      // Clamp to realistic range: mouth doesn't close fully during speech
      const targetMouth = 0.08 + rawMouth * 0.65;

      // Smooth the mouth value so it doesn't snap
      this.smoothMouth += (targetMouth - this.smoothMouth) * Math.min(1.0, delta * 18.0);

      const available = this.vrm.expressionManager.expressionMap;
      if (available['aa']) {
        this.setTargetWeight('aa', this.smoothMouth);
      } else if (available['oh']) {
        this.setTargetWeight('oh', this.smoothMouth);
      }
    }

    // ── SMOOTH LERP ALL WEIGHTS ────────────────────────────────────
    const lerpFactor = Math.min(1.0, delta * 9.0);

    const allKeys = new Set([...this.targetWeights.keys(), ...this.currentWeights.keys()]);
    for (const key of allKeys) {
      const target  = this.targetWeights.get(key)  ?? 0;
      const current = this.currentWeights.get(key) ?? 0;
      const next    = current + (target - current) * lerpFactor;

      this.currentWeights.set(key, next);
      this.vrm.expressionManager.setValue(key, next);
    }
  }
}
