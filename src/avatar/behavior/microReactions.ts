import type { ExpressionController } from '../expressions';
import type { GazeController } from '../gaze';
import type { GestureController, GestureName } from '../animation/gestures';
import type { PersonaEmotion } from '../avatarTypes';

export type MicroReactionType =
  | 'uncertain'
  | 'empathetic'
  | 'skeptical'
  | 'impressed'
  | 'surprised'
  | 'encouraging'
  | 'listening';

export class MicroReactionEngine {
  private expressions: ExpressionController;
  private gaze: GazeController;
  private gestures: GestureController;
  private isReactionActive = false;
  private activeTimer: number | null = null;

  constructor(
    expressions: ExpressionController,
    gaze: GazeController,
    gestures: GestureController
  ) {
    this.expressions = expressions;
    this.gaze = gaze;
    this.gestures = gestures;
  }

  public trigger(type: MicroReactionType): void {
    if (this.isReactionActive) {
      if (this.activeTimer) {
        clearTimeout(this.activeTimer);
        this.activeTimer = null;
      }
    }

    this.isReactionActive = true;

    switch (type) {
      case 'uncertain':
        // Soft eyebrow/thinking morph + gaze shift slightly away + head tilt
        this.expressions.setEmotion('thinking');
        this.gaze.lookAway();
        this.playGestureIfFree('head_tilt');
        this.scheduleRestore('neutral', 1800);
        break;

      case 'empathetic':
        // Soft warm expression + gentle forward gaze + nod
        this.expressions.setEmotion('warm');
        this.gaze.lookAtUser();
        this.playGestureIfFree('nod');
        this.scheduleRestore('warm', 2200);
        break;

      case 'skeptical':
        // Subtle skeptical eyebrow + gaze user + lean/head tilt
        this.expressions.setEmotion('skeptical');
        this.gaze.lookAtUser();
        this.playGestureIfFree('head_tilt');
        this.scheduleRestore('neutral', 2000);
        break;

      case 'impressed':
        // Impressed expression + brief eye contact + acknowledge nod
        this.expressions.setEmotion('impressed');
        this.gaze.lookAtUser();
        this.playGestureIfFree('acknowledge');
        this.scheduleRestore('warm', 2400);
        break;

      case 'surprised':
        // Surprised expression + eyes center/user + quick head tilt
        this.expressions.setEmotion('surprised');
        this.gaze.lookAtUser();
        this.playGestureIfFree('head_tilt');
        this.scheduleRestore('neutral', 1600);
        break;

      case 'encouraging':
        // Warm expression + user gaze + subtle hand open
        this.expressions.setEmotion('warm');
        this.gaze.lookAtUser();
        this.playGestureIfFree('subtle_hand_open');
        this.scheduleRestore('warm', 2000);
        break;

      case 'listening':
      default:
        // Attentive neutral/warm + user gaze
        this.expressions.setEmotion('neutral');
        this.gaze.lookAtUser();
        this.scheduleRestore('neutral', 1500);
        break;
    }
  }

  private playGestureIfFree(gesture: GestureName): void {
    if (!this.gestures.isActive()) {
      this.gestures.play(gesture);
    }
  }

  private scheduleRestore(fallbackEmotion: PersonaEmotion, durationMs: number): void {
    this.activeTimer = window.setTimeout(() => {
      this.isReactionActive = false;
      this.activeTimer = null;
      // Smooth return to user gaze & fallback emotion
      this.gaze.lookAtUser();
      this.expressions.setEmotion(fallbackEmotion);
    }, durationMs);
  }
}
