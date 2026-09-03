import type { VRM } from '@pixiv/three-vrm';
import type { AvatarActivity, PersonaEmotion } from '../avatarTypes';
import type { ExpressionController } from '../expressions';
import type { GestureController, GestureName } from '../animation/gestures';
import type { GazeController } from '../gaze';
import { MicroReactionEngine, type MicroReactionType } from './microReactions';

export class HumanizationEngine {
  private vrm: VRM | null = null;
  private expressions: ExpressionController;
  private gestures: GestureController;
  private gaze: GazeController;
  private microReactions: MicroReactionEngine;

  private currentActivity: AvatarActivity = 'idle';

  // ── 2A. LISTENING STATE TIMERS ─────────────────────────────────────────────
  private listeningTimer = 0;
  private nextListeningNodTime = 10.0;

  // ── 2B. THINKING STATE TIMERS ─────────────────────────────────────────────
  private isThinkingActive = false;
  private thinkingPhaseTimer = 0;

  // ── 2C. SPEAKING STATE TIMERS ─────────────────────────────────────────────
  private speakGestureTimer = 0;
  private speakGestureInterval = 4.0;

  // ── 2D. IDLE MICRO-BEHAVIOR TIMERS ────────────────────────────────────────
  private idleMicroTimer = 0;
  private nextIdleMicroInterval = 8.0;

  constructor(
    expressions: ExpressionController,
    gestures: GestureController,
    gaze: GazeController
  ) {
    this.expressions = expressions;
    this.gestures = gestures;
    this.gaze = gaze;
    this.microReactions = new MicroReactionEngine(expressions, gaze, gestures);
    this.scheduleNextListeningNod();
    this.scheduleNextIdleMicro();
  }

  public triggerMicroReaction(type: MicroReactionType): void {
    this.microReactions.trigger(type);
  }

  public onInterruptionRecoil(): void {
    // When user interrupts while avatar is speaking
    this.expressions.setSpeaking(false);
    this.microReactions.trigger('surprised');
    this.gaze.lookAtUser();
    this.setActivity('listening');
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
    this.speakGestureInterval = 3.0 + Math.random() * 3.5;
    this.thinkingPhaseTimer = 0;

    switch (activity) {
      case 'listening':
        this.isThinkingActive = false;
        this.gaze.lookAtUser();
        this.expressions.setActivity('listening');
        this.scheduleNextListeningNod();
        break;

      case 'thinking':
        this.isThinkingActive = true;
        this.expressions.setActivity('thinking');
        // Cognitive thinking sequence step 1: subtle gaze shift away & thoughtful posture/gesture
        if (Math.random() < 0.7) {
          this.gaze.lookAway();
        } else {
          this.gaze.lookAtUser();
        }
        if (!this.gestures.isActive()) {
          const thinkGestures: GestureName[] = ['thinking', 'thoughtful_hand', 'head_tilt'];
          const selected = thinkGestures[Math.floor(Math.random() * thinkGestures.length)];
          this.gestures.play(selected);
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
        this.scheduleNextIdleMicro();
        break;
    }
  }

  public setEmotion(emotion: PersonaEmotion) {
    this.expressions.setEmotion(emotion);
  }

  private scheduleNextListeningNod() {
    this.nextListeningNodTime = 10.0 + Math.random() * 8.0;
    this.listeningTimer = 0;
  }

  private scheduleNextIdleMicro() {
    this.nextIdleMicroInterval = 6.0 + Math.random() * 8.0;
    this.idleMicroTimer = 0;
  }

  public update(delta: number) {
    if (!this.vrm) return;

    switch (this.currentActivity) {
      case 'listening':
        this.updateListeningBehaviors(delta);
        break;

      case 'thinking':
        this.updateThinkingBehaviors(delta);
        break;

      case 'speaking':
        this.updateSpeakingBehaviors(delta);
        break;

      case 'idle':
      default:
        this.updateIdleBehaviors(delta);
        break;
    }
  }

  private updateListeningBehaviors(delta: number) {
    if (this.gestures.isActive()) return;

    this.listeningTimer += delta;
    if (this.listeningTimer >= this.nextListeningNodTime) {
      this.scheduleNextListeningNod();
      if (Math.random() < 0.35) {
        this.gestures.play('nod');
      }
    }
  }

  private updateThinkingBehaviors(delta: number) {
    this.thinkingPhaseTimer += delta;
    // Step 2 of cognitive thinking sequence: return gaze to user right before speech transition
    if (this.thinkingPhaseTimer > 1.2 && Math.random() < 0.3) {
      this.gaze.lookAtUser();
    }
  }

  private updateSpeakingBehaviors(delta: number) {
    if (this.gestures.isActive()) return;

    this.speakGestureTimer += delta;
    if (this.speakGestureTimer >= this.speakGestureInterval) {
      this.speakGestureTimer = 0;
      this.speakGestureInterval = 3.5 + Math.random() * 4.0;

      // Combine head accents with occasional hand gestures during speech
      const gestures: GestureName[] = [
        'nod',
        'head_tilt',
        'explain_hand',
        'subtle_hand_open',
        'hand_emphasis',
        'small_hand_raise',
      ];
      const gesture = gestures[Math.floor(Math.random() * gestures.length)];
      this.gestures.play(gesture);
    }
  }

  private updateIdleBehaviors(delta: number) {
    if (this.gestures.isActive()) return;

    this.idleMicroTimer += delta;
    if (this.idleMicroTimer >= this.nextIdleMicroInterval) {
      this.scheduleNextIdleMicro();

      const roll = Math.random();
      if (roll < 0.35) {
        // Posture / subtle arm repositioning
        const postureGestures: GestureName[] = ['subtle_hand_open', 'lean_forward', 'lean_back', 'hands_together'];
        const g = postureGestures[Math.floor(Math.random() * postureGestures.length)];
        this.gestures.play(g);
      } else if (roll < 0.65) {
        // Brief gaze look away & return
        this.gaze.lookAway();
        setTimeout(() => {
          if (this.currentActivity === 'idle') {
            this.gaze.lookAtUser();
          }
        }, 1200 + Math.random() * 1000);
      } else {
        // Small head accent
        const headGestures: GestureName[] = ['head_tilt', 'nod'];
        const g = headGestures[Math.floor(Math.random() * headGestures.length)];
        this.gestures.play(g);
      }
    }
  }
}
