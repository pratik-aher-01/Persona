import type { VRM } from '@pixiv/three-vrm';
import type { PersonaEmotion, AvatarActivity, VrmCapabilityMap } from './avatarTypes';
import { VrmExpressionAdapter } from './expression/vrmExpressionAdapter';
import { resolveSemanticExpression } from './expression/expressionProfiles';

export class ExpressionController {
  private adapter = new VrmExpressionAdapter();
  private currentEmotion: PersonaEmotion = 'neutral';
  private currentActivity: AvatarActivity = 'idle';
  private isSpeaking = false;

  // Organic mouth motion state — multiple sines to avoid robotic pulse
  private mouthT1 = 0;
  private mouthT2 = 0;
  private mouthT3 = 0;
  private smoothMouth = 0;

  constructor(vrm?: VRM) {
    if (vrm) {
      this.attach(vrm);
    }
  }

  public attach(vrm: VRM): VrmCapabilityMap {
    const caps = this.adapter.attach(vrm);
    this.applyEmotion(this.currentEmotion);
    return caps;
  }

  public detach() {
    this.adapter.detach();
  }

  public getCapabilityMap(): VrmCapabilityMap {
    return this.adapter.getCapabilityMap();
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

  private audioAmplitude = 0;

  public setAudioAmplitude(amplitude: number) {
    this.audioAmplitude = Math.max(0, Math.min(1.0, amplitude));
  }

  public setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    if (!speaking) {
      this.audioAmplitude = 0;
      // Reset mouth shape targets smoothly to zero
      this.adapter.setTargetWeight('aa', 0);
      this.adapter.setTargetWeight('ih', 0);
      this.adapter.setTargetWeight('ou', 0);
      this.adapter.setTargetWeight('ee', 0);
      this.adapter.setTargetWeight('oh', 0);
      this.adapter.setTargetWeight('Fcl_MTH_A', 0);

      // Reset mouth oscillators for next speaking session
      this.mouthT1 = 0;
      this.mouthT2 = 0;
      this.mouthT3 = 0;
    }
  }

  public setCustomExpression(name: string, weight: number) {
    this.adapter.setTargetWeight(name, weight);
  }

  private applyEmotion(emotion: PersonaEmotion) {
    if (!this.adapter.isAttached()) return;

    const caps = this.adapter.getCapabilityMap();

    // Scale emotion intensity slightly by activity
    // Thinking -> subtle (pulled inward)
    // Listening -> attentive lean
    let intensityScale = 1.0;
    if (this.currentActivity === 'thinking') intensityScale = 0.75;
    else if (this.currentActivity === 'listening') intensityScale = 0.9;

    // Resolve semantic expression to target bindings via model-independent profile
    const bindings = resolveSemanticExpression(emotion, caps);

    // Reset standard emotion preset slots first
    const resetList = ['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised'];
    this.adapter.resetAllTargets(resetList);

    // Apply resolved bindings
    for (const binding of bindings) {
      this.adapter.setTargetWeight(binding.name, binding.weight * intensityScale);
    }
  }

  public update(delta: number) {
    if (!this.adapter.isAttached()) return;

    // ── 1. DYNAMIC MULTI-VISEME LIP-SYNC WITH AUDIO AMPLITUDE ────────
    if (this.isSpeaking) {
      this.mouthT1 += delta * 12.0; // Syllable oscillation
      this.mouthT2 += delta * 7.5;  // Secondary modulation
      this.mouthT3 += delta * 3.5;  // Viseme morph selector

      const primary = Math.abs(Math.sin(this.mouthT1));
      const envelope = Math.sin(this.mouthT2) * 0.45 + 0.55;
      const rawMouth = primary * envelope;

      // Combine oscillator with audio amplitude envelope when available
      const ampMod = this.audioAmplitude > 0 ? (0.3 + this.audioAmplitude * 0.7) : 1.0;
      const targetMouth = (0.12 + rawMouth * 0.65) * ampMod;

      this.smoothMouth += (targetMouth - this.smoothMouth) * Math.min(1.0, delta * 20.0);

      const caps = this.adapter.getCapabilityMap();
      const visemes: Array<'aa' | 'ih' | 'ou' | 'ee' | 'oh'> = ['aa', 'ih', 'ou', 'ee', 'oh'];
      const cycleIndex = Math.floor((this.mouthT3 % (Math.PI * 2)) / ((Math.PI * 2) / visemes.length));
      const activeViseme = visemes[cycleIndex % visemes.length];

      for (const v of visemes) {
        if (caps.presetExpressions.has(v)) {
          const weight = (v === activeViseme) ? this.smoothMouth : (v === 'aa' ? this.smoothMouth * 0.3 : 0);
          this.adapter.setTargetWeight(v, weight);
        }
      }

      if (caps.rawMorphTargets.has('Fcl_MTH_A')) {
        this.adapter.setTargetWeight('Fcl_MTH_A', this.smoothMouth);
      }
    }

    // ── 2. SMOOTH LERP ALL WEIGHTS ────────────────────────────────────
    this.adapter.update(delta);
  }
}
