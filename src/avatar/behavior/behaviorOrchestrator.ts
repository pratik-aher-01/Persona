import type { ExpressionController } from '../expressions';
import type { GestureController } from '../animation/gestures';
import type { GazeController } from '../gaze';

export type SemanticBehavior =
  | 'listening'
  | 'thinking'
  | 'interested'
  | 'skeptical'
  | 'impressed'
  | 'speaking'
  | 'idle';

export class BehaviorOrchestrator {
  private expressions: ExpressionController;
  private gestures: GestureController;
  private gaze: GazeController;
  private currentBehavior: SemanticBehavior = 'idle';

  constructor(
    expressions: ExpressionController,
    gestures: GestureController,
    gaze: GazeController
  ) {
    this.expressions = expressions;
    this.gestures = gestures;
    this.gaze = gaze;
  }

  public setBehavior(behavior: SemanticBehavior) {
    const previous = this.currentBehavior;
    this.currentBehavior = behavior;

    switch (behavior) {
      case 'listening':
        this.gaze.lookAtUser();
        this.expressions.setActivity('listening');
        this.expressions.setEmotion('neutral');
        if (!this.gestures.isActive()) {
          this.gestures.play('acknowledge');
        }
        break;

      case 'thinking':
        this.gaze.lookAway();
        this.expressions.setActivity('thinking');
        this.expressions.setEmotion('thinking');
        if (!this.gestures.isActive()) {
          this.gestures.play('thinking');
        }
        break;

      case 'interested':
        this.gaze.lookAtUser();
        this.expressions.setActivity('idle');
        this.expressions.setEmotion('warm');
        if (!this.gestures.isActive()) {
          this.gestures.play('nod');
        }
        break;

      case 'skeptical':
        this.gaze.lookAtUser();
        this.expressions.setActivity('idle');
        this.expressions.setEmotion('skeptical');
        if (!this.gestures.isActive()) {
          this.gestures.play('head_tilt');
        }
        break;

      case 'impressed':
        this.gaze.lookAtUser();
        this.expressions.setActivity('idle');
        this.expressions.setEmotion('impressed');
        if (!this.gestures.isActive()) {
          this.gestures.play('nod');
        }
        break;

      case 'speaking':
        this.gaze.lookAtUser();
        this.expressions.setActivity('speaking');
        break;

      case 'idle':
      default:
        this.gaze.lookAtUser();
        this.expressions.setActivity('idle');
        if (previous === 'thinking' || previous === 'speaking') {
          this.expressions.setEmotion('neutral');
        }
        break;
    }

    console.log(`[BehaviorOrchestrator] Behavior transition: ${previous} → ${behavior}`);
  }

  public getCurrentBehavior(): SemanticBehavior {
    return this.currentBehavior;
  }
}
