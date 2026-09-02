import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import type { AvatarActivity } from '../avatarTypes';
import type { GestureName, GestureOffsets } from './gestures';

// ─── Natural Idle Pose ────────────────────────────────────────────────────────
// All values are rotations applied to VRM normalized-space bones.
// These move the bones from the default T-pose (all rotations = 0) to a
// natural relaxed standing pose.
//
// Coordinate reasoning for @pixiv/three-vrm v3 normalized space:
//   • The character faces −Z after VRMUtils.rotateVRM0().
//   • Character's left arm in T-pose points in +X world direction.
//   • Character's right arm in T-pose points in −X world direction.
//   • Positive Z-rotation around left arm bone: +X → +Y  (arm goes UP)
//   • Negative Z-rotation around left arm bone: +X → −Y  (arm goes DOWN) ✓
//   • Positive Z-rotation around right arm bone: −X → −Y (arm goes DOWN) ✓
//
// Upper arm target: ~70° down from horizontal (1.2 rad), slight inward tilt
// Lower arm target: slight forward bend at elbow (0.3 rad around X)
// Shoulder: slight depression (droop) to avoid stiff shoulder cap look

const NATURAL_POSE: Record<string, { x: number; y: number; z: number }> = {
  leftShoulder:  { x: 0,    y: 0,    z: -0.08 },
  rightShoulder: { x: 0,    y: 0,    z:  0.08 },
  leftUpperArm:  { x: 0,    y: 0,    z: -1.20 },
  rightUpperArm: { x: 0,    y: 0,    z:  1.20 },
  leftLowerArm:  { x: 0.3,  y: 0,    z: -0.05 },
  rightLowerArm: { x: 0.3,  y: 0,    z:  0.05 },
  leftHand:      { x: 0,    y: 0,    z: -0.10 },
  rightHand:     { x: 0,    y: 0,    z:  0.10 },
};

export class IdleController {
  private vrm: VRM | null = null;
  private blinkingEnabled = true;
  private currentActivity: AvatarActivity = 'idle';

  // Blink state
  private nextBlinkTime = 0;
  private blinkTimer = 0;
  private isBlinking = false;
  private blinkDuration = 0.16;

  // Idle motion timers — multiple frequencies to break periodicity
  private idleTime = 0;
  private breathPhase = 0;
  private swayPhase   = 0;
  private microPhase  = 0;

  // Baseline bone rotations (captured once at VRM load from the T-pose = 0)
  private baseSpineX = 0;
  private baseHeadY  = 0;
  private baseHeadX  = 0;

  // Smoothed arm pose values (lerp from 0 → NATURAL_POSE targets over ~1s on load)
  private armPose: Record<string, { x: number; y: number; z: number }> = {};

  // External gesture offsets (supplied by GestureController each frame)
  private gestureOffsets: GestureOffsets = {
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    neckPitch: 0,
    neckYaw: 0,
    neckRoll: 0,
    spinePitch: 0,
    spineYaw: 0,
    spineRoll: 0,
    chestPitch: 0,
    chestYaw: 0,
    chestRoll: 0,
  };

  // Smoothed motion outputs (to avoid abrupt changes between activities)
  private smoothBreath = 0;
  private smoothSwayY  = 0;
  private smoothSwayX  = 0;

  constructor(vrm?: VRM) {
    // Randomize phase offsets so multiple instances don't sync
    this.breathPhase = Math.random() * Math.PI * 2;
    this.swayPhase   = Math.random() * Math.PI * 2;
    this.microPhase  = Math.random() * Math.PI * 2;

    // Initialize arm pose smooth state at 0 (T-pose), will lerp to targets
    for (const boneName of Object.keys(NATURAL_POSE)) {
      this.armPose[boneName] = { x: 0, y: 0, z: 0 };
    }

    if (vrm) {
      this.setVRM(vrm);
    }
    this.scheduleNextBlink();
  }

  public setVRM(vrm: VRM) {
    this.vrm = vrm;

    // Cache spine/head baseline from the loaded pose (should be ~0 for T-pose)
    if (this.vrm.humanoid) {
      const spine = this.vrm.humanoid.getNormalizedBoneNode('spine');
      if (spine) this.baseSpineX = spine.rotation.x;

      const head = this.vrm.humanoid.getNormalizedBoneNode('head');
      if (head) {
        this.baseHeadY = head.rotation.y;
        this.baseHeadX = head.rotation.x;
      }
    }
  }

  public setActivity(activity: AvatarActivity) {
    this.currentActivity = activity;
  }

  /** Called each frame by GestureController to supply current gesture bone offsets */
  public applyGestureOffsets(offsets: GestureOffsets) {
    this.gestureOffsets = { ...offsets };
  }

  public setBlinkingEnabled(enabled: boolean) {
    this.blinkingEnabled = enabled;
    if (!enabled && this.vrm?.expressionManager) {
      this.vrm.expressionManager.setValue('blink', 0);
      this.isBlinking = false;
    }
  }

  public isCurrentlyBlinking(): boolean {
    return this.isBlinking;
  }

  public triggerBlink() {
    if (!this.isBlinking) {
      this.isBlinking = true;
      this.blinkTimer = 0;
    }
  }

  private scheduleNextBlink() {
    // Irregular intervals: 2–6s, weighted toward 3–5s range
    this.nextBlinkTime = 2.0 + Math.random() * 4.0;
  }

  public update(delta: number) {
    if (!this.vrm) return;

    this.idleTime += delta;

    // ── 1. BLINKING ─────────────────────────────────────────────────
    if (this.blinkingEnabled && this.vrm.expressionManager) {
      if (!this.isBlinking) {
        this.nextBlinkTime -= delta;
        if (this.nextBlinkTime <= 0) {
          this.triggerBlink();
        }
      } else {
        this.blinkTimer += delta;
        const progress = this.blinkTimer / this.blinkDuration;
        if (progress >= 1.0) {
          this.isBlinking = false;
          this.vrm.expressionManager.setValue('blink', 0);
          this.scheduleNextBlink();
          // Occasional double-blink (5% chance)
          if (Math.random() < 0.05) {
            this.nextBlinkTime = 0.12 + Math.random() * 0.15;
          }
        } else {
          // Asymmetric: fast close (35% of duration), slow open (65%)
          const closePhase = 0.35;
          let blinkWeight: number;
          if (progress < closePhase) {
            blinkWeight = progress / closePhase;
          } else {
            blinkWeight = 1.0 - (progress - closePhase) / (1.0 - closePhase);
          }
          blinkWeight = Math.max(0, Math.min(1, blinkWeight));
          this.vrm.expressionManager.setValue('blink', blinkWeight);
        }
      }
    }

    // ── 2. PROCEDURAL BONE MOTION ───────────────────────────────────
    if (!this.vrm.humanoid) return;

    // Scale motion intensity by activity
    let breathScale: number;
    let swayScale: number;
    let microScale: number;

    switch (this.currentActivity) {
      case 'speaking':
        breathScale = 1.3;
        swayScale   = 0.7;
        microScale  = 1.1;
        break;
      case 'listening':
        breathScale = 0.9;
        swayScale   = 0.5;
        microScale  = 0.6;
        break;
      case 'thinking':
        breathScale = 0.7;
        swayScale   = 0.4;
        microScale  = 0.5;
        break;
      default: // idle
        breathScale = 1.0;
        swayScale   = 1.0;
        microScale  = 1.0;
    }

    // Breathing: two slightly detuned sines to avoid perfectly periodic wave
    const t = this.idleTime;
    const rawBreath = (Math.sin(t * 2.18 + this.breathPhase) * 0.7 +
                       Math.sin(t * 2.67 + this.breathPhase * 1.3) * 0.3) * 0.006 * breathScale;

    // Head sway: three frequencies so it never feels like a metronome
    const rawSwayY = (Math.sin(t * 1.27 + this.swayPhase) * 0.5 +
                      Math.sin(t * 0.83 + this.swayPhase * 0.7) * 0.3 +
                      Math.sin(t * 2.11 + this.swayPhase * 1.5) * 0.2) * 0.004 * swayScale;

    const rawSwayX = (Math.sin(t * 0.97 + this.microPhase) * 0.6 +
                      Math.sin(t * 1.51 + this.microPhase * 1.2) * 0.4) * 0.003 * microScale;

    // Smooth the raw values to prevent micro-jitter
    const smoothFactor = Math.min(1.0, delta * 6.0);
    this.smoothBreath += (rawBreath - this.smoothBreath) * smoothFactor;
    this.smoothSwayY  += (rawSwayY  - this.smoothSwayY)  * smoothFactor;
    this.smoothSwayX  += (rawSwayX  - this.smoothSwayX)  * smoothFactor;

    // ── 3. APPLY NATURAL ARM POSE (move arms out of T-pose) ─────────
    // Blend speed: ~3.5 units/sec so arms reach natural position in ~0.5s on load
    // This also means any frame-rate-related issues are gracefully handled.
    const poseBlend = Math.min(1.0, delta * 3.5);

    for (const boneName of Object.keys(NATURAL_POSE)) {
      const target  = NATURAL_POSE[boneName];
      const current = this.armPose[boneName];

      current.x += (target.x - current.x) * poseBlend;
      current.y += (target.y - current.y) * poseBlend;
      current.z += (target.z - current.z) * poseBlend;

      const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName as VRMHumanBoneName);
      if (bone) {
        bone.rotation.x = current.x;
        bone.rotation.y = current.y;
        bone.rotation.z = current.z;
      }
    }

    // ── 4. APPLY SPINE & CHEST ──────────────────────────────────────
    const spine = this.vrm.humanoid.getNormalizedBoneNode('spine');
    if (spine) {
      spine.rotation.x = this.baseSpineX + this.smoothBreath + this.gestureOffsets.spinePitch;
      spine.rotation.y = this.gestureOffsets.spineYaw;
      spine.rotation.z = this.gestureOffsets.spineRoll;
    }

    const chest = this.vrm.humanoid.getNormalizedBoneNode('chest');
    if (chest) {
      chest.rotation.x = this.gestureOffsets.chestPitch;
      chest.rotation.y = this.gestureOffsets.chestYaw;
      chest.rotation.z = this.gestureOffsets.chestRoll;
    }

    // ── 5. APPLY NECK & HEAD ────────────────────────────────────────
    const neck = this.vrm.humanoid.getNormalizedBoneNode('neck');
    if (neck) {
      neck.rotation.x = this.gestureOffsets.neckPitch;
      neck.rotation.y = this.gestureOffsets.neckYaw;
      neck.rotation.z = this.gestureOffsets.neckRoll;
    }

    const head = this.vrm.humanoid.getNormalizedBoneNode('head');
    if (head) {
      head.rotation.x = this.baseHeadX + this.smoothSwayX + this.gestureOffsets.headPitch;
      head.rotation.y = this.baseHeadY + this.smoothSwayY + this.gestureOffsets.headYaw;
      head.rotation.z = this.gestureOffsets.headRoll;
    }
  }
}

export type { GestureName };
