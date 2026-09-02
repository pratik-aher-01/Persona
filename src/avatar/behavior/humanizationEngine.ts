import type { VRM } from '@pixiv/three-vrm';
import type { AvatarActivity, PersonaEmotion } from '../avatarTypes';
import type { ExpressionController } from '../expressions';
import type { GestureController, GestureName } from '../animation/gestures';
import type { GazeController } from '../gaze';

export class HumanizationEngine {
  private vrm: VRM | null = null;
  private expressions: ExpressionController;
  private gestures: GestureController;
  private gaze: GazeController;

  private currentActivity: AvatarActivity = 'idle';

  // ── 2A. LISTENING STATE TIMERS ─────────────────────────────────────────────
  private listeningTimer = 0;
  private nextListeningNodTime = 12.0;

  // ── 2B. THINKING STATE TIMERS ─────────────────────────────────────────────
  private isThinkingActive = false;

  // ── 2C. SPEAKING STATE TIMERS ─────────────────────────────────────────────
  private speakGestureTimer = 0;
  private speakGestureInterval = 4.0;

  constructor(
    expressions: ExpressionController,
    gestures: GestureController,
    gaze: GazeController
  ) {
    this.expressions = expressions;
    this.gestures = gestures;
    this.gaze = gaze;
    this.scheduleNextListeningNod();
  }

  public attach(vrm: VRM) {
    this.vrm = vrm;
  }

  public detach() {
    this.vrm = null;
  }

  public setActivity(activity: AvatarActivity) {
    const previous = this.currentActivity;
    this.currentActivity = activity;

    // Reset activity timers
    this.speakGestureTimer = 0;
    this.speakGestureInterval = 3.5 + Math.random() * 3.0;

    switch (activity) {
      case 'listening':
        this.isThinkingActive = false;
        // Natural listening setup: look at user, warm/attentive expression if neutral
        this.gaze.lookAtUser();
        this.expressions.setActivity('listening');
        this.scheduleNextListeningNod();
        break;

      case 'thinking':
        this.isThinkingActive = true;
        // Natural thinking setup: gaze away temporarily, set thinking expression
        this.gaze.lookAway();
        this.expressions.setActivity('thinking');
        if (!this.gestures.isActive()) {
          this.gestures.play('thinking');
        }
        break;

      case 'speaking':
        // If transitioning from thinking, return gaze to user smoothly right before speaking
        if (previous === 'thinking' || this.isThinkingActive) {
          this.isThinkingActive = false;
        }
        this.gaze.lookAtUser();
        this.expressions.setActivity('speaking');
        this.expressions.setSpeaking(true);
        break;

      case 'idle':
      default:
        this.isThinkingActive = false;
        this.gaze.lookAtUser();
        this.expressions.setActivity('idle');
        this.expressions.setSpeaking(false);
        break;
    }
  }

  public setEmotion(emotion: PersonaEmotion) {
    this.expressions.setEmotion(emotion);
  }

  private scheduleNextListeningNod() {
    // Randomized interval: 14–22 seconds between subtle listening nods
    this.nextListeningNodTime = 14.0 + Math.random() * 8.0;
    this.listeningTimer = 0;
  }

  public update(delta: number) {
    if (!this.vrm) return;

    switch (this.currentActivity) {
      case 'listening':
        this.updateListeningBehaviors(delta);
        break;

      case 'thinking':
        this.updateThinkingBehaviors();
        break;

      case 'speaking':
        this.updateSpeakingBehaviors(delta);
        break;

      case 'idle':
      default:
        break;
    }
  }

  /**
   * 2A — NATURAL LISTENING
   * Subtle listening nods and micro-posture adjustments when user speaks.
   * Priority Rule: Explicit agent commands win over autonomous listening gestures.
   */
  private updateListeningBehaviors(delta: number) {
    if (this.gestures.isActive()) return;

    this.listeningTimer += delta;
    if (this.listeningTimer >= this.nextListeningNodTime) {
      this.scheduleNextListeningNod();
      // 25% probability per window to perform a subtle nod
      if (Math.random() < 0.25) {
        this.gestures.play('nod');
      }
    }
  }

  /**
   * 2B — NATURAL THINKING
   * Thinking expression & gaze away while processing, returning gaze to user before speaking.
   */
  private updateThinkingBehaviors() {
    // Keep gaze focused thoughtfully away during thinking unless an explicit gesture is playing
  }

  /**
   * 2C — NATURAL SPEAKING
   * Occasional subtle head movement & nods while speaking.
   * Priority Rule: Explicit agent gestures always win over auto-speaking gestures.
   */
  private updateSpeakingBehaviors(delta: number) {
    if (this.gestures.isActive()) return;

    this.speakGestureTimer += delta;
    if (this.speakGestureTimer >= this.speakGestureInterval) {
      this.speakGestureTimer = 0;
      this.speakGestureInterval = 3.0 + Math.random() * 4.0;
      // 60% nod, 40% head tilt during speech
      const gesture: GestureName = Math.random() < 0.6 ? 'nod' : 'head_tilt';
      this.gestures.play(gesture);
    }
  }
}
