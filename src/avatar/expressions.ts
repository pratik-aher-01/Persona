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

  public setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    if (!speaking) {
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

    // ── 1. ORGANIC MOUTH MOTION ───────────────────────────────────────
    if (this.isSpeaking) {
      // Three detuned oscillators beating against each other
      this.mouthT1 += delta * 10.8; // primary syllable rate
      this.mouthT2 += delta * 7.3;  // secondary envelope
      this.mouthT3 += delta * 3.1;  // slow amplitude modulation

      const primary  = Math.abs(Math.sin(this.mouthT1));
      const envelope = Math.sin(this.mouthT2) * 0.5 + 0.5;
      const slowMod  = Math.sin(this.mouthT3) * 0.3 + 0.7;
      const rawMouth = primary * envelope * slowMod;

      // Clamp to realistic range: mouth doesn't close fully during speech
      const targetMouth = 0.08 + rawMouth * 0.65;

      // Smooth the mouth value so it doesn't snap
      this.smoothMouth += (targetMouth - this.smoothMouth) * Math.min(1.0, delta * 18.0);

      const caps = this.adapter.getCapabilityMap();
      if (caps.presetExpressions.has('aa')) {
        this.adapter.setTargetWeight('aa', this.smoothMouth);
      } else if (caps.presetExpressions.has('oh')) {
        this.adapter.setTargetWeight('oh', this.smoothMouth);
      } else if (caps.rawMorphTargets.has('Fcl_MTH_A')) {
        this.adapter.setTargetWeight('Fcl_MTH_A', this.smoothMouth);
      }
    }

    // ── 2. SMOOTH LERP ALL WEIGHTS ────────────────────────────────────
    this.adapter.update(delta);
  }
}
