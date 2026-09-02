import type { VRM } from '@pixiv/three-vrm';

export type GestureName =
  | 'idle'
  | 'nod'
  | 'shake_head'
  | 'head_tilt'
  | 'acknowledge'
  | 'agree'
  | 'disagree'
  | 'thinking'
  | 'lean_forward'
  | 'lean_back';

export interface GestureOffsets {
  headPitch: number;
  headYaw: number;
  headRoll: number;
  neckPitch: number;
  neckYaw: number;
  neckRoll: number;
  spinePitch: number;
  spineYaw: number;
  spineRoll: number;
  chestPitch: number;
  chestYaw: number;
  chestRoll: number;
}

export interface GesturePhase extends Partial<GestureOffsets> {
  ratio: number; // fraction of total duration for this phase
}

interface GestureConfig {
  duration: number;
  priority: number;
  phases: GesturePhase[];
}

const ZERO_OFFSETS: GestureOffsets = {
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

const GESTURE_LIBRARY: Record<Exclude<GestureName, 'idle'>, GestureConfig> = {
  // Natural 2-phase nod
  nod: {
    duration: 0.75,
    priority: 2,
    phases: [
      { ratio: 0.45, headPitch: 0.14, neckPitch: 0.04, spinePitch: 0.03 },
      { ratio: 0.55, headPitch: 0.0, neckPitch: 0.0, spinePitch: 0.0 },
    ],
  },

  // Small left-right head shake (1.5 cycles)
  shake_head: {
    duration: 1.1,
    priority: 2,
    phases: [
      { ratio: 0.25, headYaw: 0.16, neckYaw: 0.04 },
      { ratio: 0.50, headYaw: -0.16, neckYaw: -0.04 },
      { ratio: 0.25, headYaw: 0.0, neckYaw: 0.0 },
    ],
  },

  // Subtle curious head tilt
  head_tilt: {
    duration: 1.3,
    priority: 1,
    phases: [
      { ratio: 0.30, headRoll: 0.14, neckRoll: 0.05 },
      { ratio: 0.40, headRoll: 0.14, neckRoll: 0.05 },
      { ratio: 0.30, headRoll: 0.0, neckRoll: 0.0 },
    ],
  },

  // Subtle acknowledgement (nod + forward upper body accent)
  acknowledge: {
    duration: 0.85,
    priority: 1,
    phases: [
      { ratio: 0.40, headPitch: 0.10, spinePitch: 0.04, chestPitch: 0.03 },
      { ratio: 0.60, headPitch: 0.0, spinePitch: 0.0, chestPitch: 0.0 },
    ],
  },

  // Double nod cycle for agreement
  agree: {
    duration: 1.2,
    priority: 2,
    phases: [
      { ratio: 0.25, headPitch: 0.12, neckPitch: 0.03, spinePitch: 0.03 },
      { ratio: 0.25, headPitch: 0.04, neckPitch: 0.01, spinePitch: 0.01 },
      { ratio: 0.25, headPitch: 0.14, neckPitch: 0.04, spinePitch: 0.03 },
      { ratio: 0.25, headPitch: 0.0, neckPitch: 0.0, spinePitch: 0.0 },
    ],
  },

  // Head shake with slight posture retreat
  disagree: {
    duration: 1.3,
    priority: 2,
    phases: [
      { ratio: 0.25, headYaw: 0.14, spinePitch: -0.04, chestPitch: -0.03 },
      { ratio: 0.50, headYaw: -0.14, spinePitch: -0.04, chestPitch: -0.03 },
      { ratio: 0.25, headYaw: 0.0, spinePitch: 0.0, chestPitch: 0.0 },
    ],
  },

  // Thinking posture: subtle tilt, chin down, chest lean
  thinking: {
    duration: 2.2,
    priority: 1,
    phases: [
      { ratio: 0.25, headPitch: 0.06, headYaw: -0.08, headRoll: 0.08, spinePitch: 0.04, chestPitch: 0.03 },
      { ratio: 0.50, headPitch: 0.06, headYaw: -0.08, headRoll: 0.08, spinePitch: 0.04, chestPitch: 0.03 },
      { ratio: 0.25, headPitch: 0.0, headYaw: 0.0, headRoll: 0.0, spinePitch: 0.0, chestPitch: 0.0 },
    ],
  },

  // Subtle upper-body forward lean
  lean_forward: {
    duration: 1.5,
    priority: 2,
    phases: [
      { ratio: 0.30, spinePitch: 0.08, chestPitch: 0.06, headPitch: -0.03 },
      { ratio: 0.45, spinePitch: 0.08, chestPitch: 0.06, headPitch: -0.03 },
      { ratio: 0.25, spinePitch: 0.0, chestPitch: 0.0, headPitch: 0.0 },
    ],
  },

  // Subtle upper-body backward lean
  lean_back: {
    duration: 1.5,
    priority: 2,
    phases: [
      { ratio: 0.30, spinePitch: -0.08, chestPitch: -0.06, headPitch: 0.03 },
      { ratio: 0.45, spinePitch: -0.08, chestPitch: -0.06, headPitch: 0.03 },
      { ratio: 0.25, spinePitch: 0.0, chestPitch: 0.0, headPitch: 0.0 },
    ],
  },
};

export class GestureController {
  private vrm: VRM | null = null;
  private activeGesture: GestureName = 'idle';
  private gestureTimer = 0;
  private gestureDuration = 0;
  private gesturePhases: GesturePhase[] = [];
  private currentPriority = 0;
  private isPlaying = false;
  private onCompleteCallback: (() => void) | null = null;

  // Currently applied gesture offsets (smoothed across updates)
  private currentOffsets: GestureOffsets = { ...ZERO_OFFSETS };

  // Model bone availability
  private availableBones = new Set<string>();

  public attach(vrm: VRM) {
    this.detach();
    this.vrm = vrm;

    if (vrm.humanoid) {
      const boneNames = ['head', 'neck', 'spine', 'chest', 'leftShoulder', 'rightShoulder'];
      for (const name of boneNames) {
        if (vrm.humanoid.getNormalizedBoneNode(name as import('@pixiv/three-vrm').VRMHumanBoneName)) {
          this.availableBones.add(name);
        }
      }
    }
  }

  public isAttached(): boolean {
    return Boolean(this.vrm);
  }

  public detach() {
    this.stopGesture();
    this.vrm = null;
    this.availableBones.clear();
    this.currentOffsets = { ...ZERO_OFFSETS };
  }

  public play(name: GestureName, onComplete?: () => void) {
    if (name === 'idle') {
      this.stopGesture();
      return;
    }

    const config = GESTURE_LIBRARY[name as keyof typeof GESTURE_LIBRARY];
    if (!config) return;

    // Priority interrupt check
    if (this.isPlaying && config.priority < this.currentPriority) {
      return; // ignore lower priority gesture
    }

    this.activeGesture = name;
    this.gestureTimer = 0;
    this.gestureDuration = config.duration;
    this.gesturePhases = config.phases;
    this.currentPriority = config.priority;
    this.isPlaying = true;
    this.onCompleteCallback = onComplete || null;
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  public getActiveGesture(): GestureName {
    return this.activeGesture;
  }

  private stopGesture() {
    this.isPlaying = false;
    this.activeGesture = 'idle';
    this.currentPriority = 0;
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  /**
   * Returns current delta offsets to be added on top of base pose in IdleController.
   */
  public update(delta: number): GestureOffsets {
    if (!this.isPlaying || this.gesturePhases.length === 0) {
      // Blend current offsets back to zero smoothly
      const blendOut = Math.min(1.0, delta * 8.0);
      for (const key of Object.keys(ZERO_OFFSETS) as (keyof GestureOffsets)[]) {
        this.currentOffsets[key] += (0 - this.currentOffsets[key]) * blendOut;
      }
      return { ...this.currentOffsets };
    }

    this.gestureTimer += delta;
    const totalProgress = Math.min(1.0, this.gestureTimer / this.gestureDuration);

    // Compute active phase targets
    let elapsed = 0;
    let targetPhase: GesturePhase = this.gesturePhases[this.gesturePhases.length - 1];
    let prevPhase: GesturePhase = { ratio: 0, ...ZERO_OFFSETS };
    let phaseProgress = 1.0;

    for (let i = 0; i < this.gesturePhases.length; i++) {
      const phaseEnd = elapsed + this.gesturePhases[i].ratio;
      if (totalProgress <= phaseEnd || i === this.gesturePhases.length - 1) {
        prevPhase = i > 0 ? this.gesturePhases[i - 1] : { ratio: 0, ...ZERO_OFFSETS };
        targetPhase = this.gesturePhases[i];
        phaseProgress = (totalProgress - elapsed) / this.gesturePhases[i].ratio;
        phaseProgress = Math.max(0, Math.min(1, phaseProgress));
        // Cubic smoothstep for natural acceleration/deceleration
        phaseProgress = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
        break;
      }
      elapsed = phaseEnd;
    }

    // Interpolate target values for all bone channels
    const blendSpeed = Math.min(1.0, delta * 14.0);
    for (const key of Object.keys(ZERO_OFFSETS) as (keyof GestureOffsets)[]) {
      const prevVal = prevPhase[key] ?? 0;
      const targetVal = targetPhase[key] ?? 0;
      const interpolated = prevVal + (targetVal - prevVal) * phaseProgress;

      this.currentOffsets[key] += (interpolated - this.currentOffsets[key]) * blendSpeed;
    }

    // Check gesture completion
    if (totalProgress >= 1.0) {
      this.stopGesture();
    }

    return { ...this.currentOffsets };
  }
}
