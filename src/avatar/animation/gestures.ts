// GestureController — no VRM import needed; outputs delta offsets to IdleController

export type GestureName = 'idle' | 'nod' | 'head_tilt' | 'thinking' | 'greeting';

interface GestureConfig {
  duration: number;         // total gesture duration in seconds
  phases: GesturePhase[];   // sequential phases
}

interface GesturePhase {
  ratio: number;  // fraction of total duration for this phase
  headPitch: number; // target pitch delta (X) in radians
  headYaw: number;   // target yaw delta (Y) in radians
  headRoll: number;  // target roll delta (Z) in radians
  spinePitch: number; // target spine pitch delta (X)
}

const GESTURE_LIBRARY: Record<GestureName, GestureConfig | null> = {
  idle: null,

  // Two-phase nod: dip forward, return
  nod: {
    duration: 0.7,
    phases: [
      { ratio: 0.4, headPitch:  0.16, headYaw: 0, headRoll: 0, spinePitch:  0.04 },
      { ratio: 0.6, headPitch:  0.0,  headYaw: 0, headRoll: 0, spinePitch:  0.0  },
    ],
  },

  // Three-phase: tilt right, hold, return
  head_tilt: {
    duration: 1.2,
    phases: [
      { ratio: 0.3, headPitch: 0, headYaw: 0, headRoll:  0.12, spinePitch: 0 },
      { ratio: 0.4, headPitch: 0, headYaw: 0, headRoll:  0.12, spinePitch: 0 },
      { ratio: 0.3, headPitch: 0, headYaw: 0, headRoll:  0.0,  spinePitch: 0 },
    ],
  },

  // Thinking: combined tilt + slight chin down, gaze averted
  thinking: {
    duration: 2.0,
    phases: [
      { ratio: 0.25, headPitch:  0.06, headYaw: -0.08, headRoll:  0.07, spinePitch: 0.02 },
      { ratio: 0.50, headPitch:  0.06, headYaw: -0.08, headRoll:  0.07, spinePitch: 0.02 },
      { ratio: 0.25, headPitch:  0.0,  headYaw:  0.0,  headRoll:  0.0,  spinePitch: 0.0  },
    ],
  },

  // Greeting: slight forward lean + nod with spine
  greeting: {
    duration: 1.0,
    phases: [
      { ratio: 0.35, headPitch:  0.12, headYaw: 0, headRoll: 0, spinePitch:  0.06 },
      { ratio: 0.30, headPitch:  0.06, headYaw: 0, headRoll: 0, spinePitch:  0.03 },
      { ratio: 0.35, headPitch:  0.0,  headYaw: 0, headRoll: 0, spinePitch:  0.0  },
    ],
  },
};

export class GestureController {
  // Current gesture state
  private activeGesture: GestureName = 'idle';
  private gestureTimer = 0;
  private gestureDuration = 0;
  private gesturePhases: GesturePhase[] = [];
  private isPlaying = false;
  private onCompleteCallback: (() => void) | null = null;

  // Current applied gesture offsets (for smooth blending out)
  private currentHeadPitch = 0;
  private currentHeadYaw = 0;
  private currentHeadRoll = 0;
  private currentSpinePitch = 0;


  /**
   * Play a named gesture. If a gesture is already playing, it will be interrupted
   * and replaced after a short blend-out.
   */
  public play(name: GestureName, onComplete?: () => void) {
    if (name === 'idle') {
      this.stopGesture();
      return;
    }

    const config = GESTURE_LIBRARY[name];
    if (!config) return;

    this.activeGesture = name;
    this.gestureTimer = 0;
    this.gestureDuration = config.duration;
    this.gesturePhases = config.phases;
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
    this.onCompleteCallback = null;
  }

  /**
   * Returns the current gesture bone offsets that IdleController should ADD
   * on top of its own procedural offsets. This avoids fighting over bone ownership.
   */
  public update(delta: number): {
    headPitch: number;
    headYaw: number;
    headRoll: number;
    spinePitch: number;
  } {
    if (!this.isPlaying || this.gesturePhases.length === 0) {
      // Blend back toward zero
      const blendOut = Math.min(1.0, delta * 8.0);
      this.currentHeadPitch  += (0 - this.currentHeadPitch)  * blendOut;
      this.currentHeadYaw    += (0 - this.currentHeadYaw)    * blendOut;
      this.currentHeadRoll   += (0 - this.currentHeadRoll)   * blendOut;
      this.currentSpinePitch += (0 - this.currentSpinePitch) * blendOut;
      return {
        headPitch: this.currentHeadPitch,
        headYaw:   this.currentHeadYaw,
        headRoll:  this.currentHeadRoll,
        spinePitch: this.currentSpinePitch,
      };
    }

    this.gestureTimer += delta;
    const totalProgress = Math.min(1.0, this.gestureTimer / this.gestureDuration);

    // Find which phase we're in
    let elapsed = 0;
    let targetPhase: GesturePhase = this.gesturePhases[this.gesturePhases.length - 1];
    let prevPhase: GesturePhase = this.gesturePhases[0];
    let phaseProgress = 1.0;

    for (let i = 0; i < this.gesturePhases.length; i++) {
      const phaseEnd = elapsed + this.gesturePhases[i].ratio;
      if (totalProgress <= phaseEnd || i === this.gesturePhases.length - 1) {
        prevPhase = i > 0 ? this.gesturePhases[i - 1] : { headPitch: 0, headYaw: 0, headRoll: 0, spinePitch: 0, ratio: 0 };
        targetPhase = this.gesturePhases[i];
        phaseProgress = (totalProgress - elapsed) / this.gesturePhases[i].ratio;
        phaseProgress = Math.max(0, Math.min(1, phaseProgress));
        // Smooth step
        phaseProgress = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
        break;
      }
      elapsed = phaseEnd;
    }

    const targetHeadPitch  = prevPhase.headPitch  + (targetPhase.headPitch  - prevPhase.headPitch)  * phaseProgress;
    const targetHeadYaw    = prevPhase.headYaw    + (targetPhase.headYaw    - prevPhase.headYaw)    * phaseProgress;
    const targetHeadRoll   = prevPhase.headRoll   + (targetPhase.headRoll   - prevPhase.headRoll)   * phaseProgress;
    const targetSpinePitch = prevPhase.spinePitch + (targetPhase.spinePitch - prevPhase.spinePitch) * phaseProgress;

    // Smooth lerp current toward target
    const blend = Math.min(1.0, delta * 14.0);
    this.currentHeadPitch  += (targetHeadPitch  - this.currentHeadPitch)  * blend;
    this.currentHeadYaw    += (targetHeadYaw    - this.currentHeadYaw)    * blend;
    this.currentHeadRoll   += (targetHeadRoll   - this.currentHeadRoll)   * blend;
    this.currentSpinePitch += (targetSpinePitch - this.currentSpinePitch) * blend;

    // Check completion
    if (totalProgress >= 1.0) {
      this.stopGesture();
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
        this.onCompleteCallback = null;
      }
    }

    return {
      headPitch:  this.currentHeadPitch,
      headYaw:    this.currentHeadYaw,
      headRoll:   this.currentHeadRoll,
      spinePitch: this.currentSpinePitch,
    };
  }
}
