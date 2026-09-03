import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import type { AvatarActivity } from './avatarTypes';

type GazePreset = 'user' | 'away' | 'down' | 'neutral';

interface GazePosition {
  x: number;
  y: number;
  z: number;
}

export class GazeController {
  private vrm: VRM | null = null;

  // The Three.js object VRM lookAt tracks
  private targetObject: THREE.Object3D;

  // Desired gaze world-position (set by activity / API)
  private desiredTarget = new THREE.Vector3(0, 1.4, 2.0);

  // Smoothed target (lerped toward desiredTarget each frame)
  private smoothedTarget = new THREE.Vector3(0, 1.4, 2.0);

  // Camera reference (set after VRM load to compute user-facing position)
  private cameraPosition = new THREE.Vector3(0, 1.4, 1.15);

  // Small real-time micro-wander on top of desired target
  private wanderTime = 0;
  private wanderPhaseX = Math.random() * Math.PI * 2;
  private wanderPhaseY = Math.random() * Math.PI * 2;

  constructor(scene?: THREE.Scene) {
    this.targetObject = new THREE.Object3D();
    this.targetObject.name = 'GazeTarget';
    this.targetObject.position.copy(this.desiredTarget);

    if (scene) {
      scene.add(this.targetObject);
    }
  }

  public attach(vrm: VRM, scene: THREE.Scene) {
    this.detach();
    this.vrm = vrm;

    if (!scene.getObjectByName('GazeTarget')) {
      scene.add(this.targetObject);
    }

    if (this.vrm.lookAt) {
      this.vrm.lookAt.target = this.targetObject;
    }
  }

  public setVRM(vrm: VRM, scene: THREE.Scene) {
    this.attach(vrm, scene);
  }

  public detach() {
    if (this.vrm && this.vrm.lookAt) {
      this.vrm.lookAt.target = null;
    }
    this.vrm = null;
  }

  /** Set the camera position so gaze-to-user tracks correctly */
  public setCameraPosition(x: number, y: number, z: number) {
    this.cameraPosition.set(x, y, z);
    // Refresh user gaze target default position
    this.desiredTarget.set(x, y, z);
  }

  /** Explicit Semantic API: Point gaze directly at user camera */
  public lookAtUser() {
    this.desiredTarget.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
  }

  /** Explicit Semantic API: Point gaze at scene center forward point */
  public lookAtCenter() {
    this.desiredTarget.set(0, this.cameraPosition.y, 2.0);
  }

  /** Explicit Semantic API: Shift gaze away for reflective thinking */
  public lookAway() {
    this.setGazePreset('down');
  }

  /** Directly set a world-space look target */
  public setLookTarget(x: number, y: number, z: number) {
    this.desiredTarget.set(x, y, z);
  }

  public setLookVector(vec: THREE.Vector3) {
    this.desiredTarget.copy(vec);
  }

  /** Set gaze based on activity state — called by PersonaAvatarRuntime */
  public setActivityGaze(activity: AvatarActivity) {
    switch (activity) {
      case 'idle':
      case 'speaking':
        this.lookAtUser();
        break;

      case 'listening':
        // Look toward user with slight attentive focus
        this.desiredTarget.set(
          this.cameraPosition.x,
          this.cameraPosition.y + 0.04,
          this.cameraPosition.z
        );
        break;

      case 'thinking':
        this.lookAway();
        break;
    }
  }

  private setGazePreset(preset: GazePreset) {
    const presets: Record<GazePreset, GazePosition> = {
      user: { x: this.cameraPosition.x, y: this.cameraPosition.y, z: this.cameraPosition.z },
      away: { x: this.cameraPosition.x + 0.35, y: this.cameraPosition.y + 0.05, z: this.cameraPosition.z },
      down: { x: this.cameraPosition.x - 0.25, y: this.cameraPosition.y - 0.25, z: this.cameraPosition.z },
      neutral: { x: 0, y: 1.4, z: 2.0 },
    };
    const pos = presets[preset];
    this.desiredTarget.set(pos.x, pos.y, pos.z);
  }

  public getTarget(): THREE.Vector3 {
    return this.smoothedTarget.clone();
  }

  public getAttentionPercentage(): number {
    const distToUser = this.smoothedTarget.distanceTo(this.cameraPosition);
    if (distToUser < 0.15) {
      return 92 + Math.floor(Math.sin(this.wanderTime * 1.5) * 5);
    } else if (distToUser < 0.4) {
      return 82 + Math.floor(Math.sin(this.wanderTime * 1.5) * 4);
    } else {
      return 68 + Math.floor(Math.cos(this.wanderTime * 1.2) * 5);
    }
  }

  public update(delta: number) {
    if (!this.vrm || !this.vrm.lookAt) return;

    this.wanderTime += delta;

    // Micro-wander: subtle eye micro-saccades on top of base target
    const wanderX = Math.sin(this.wanderTime * 0.8 + this.wanderPhaseX) * 0.012;
    const wanderY = Math.sin(this.wanderTime * 0.55 + this.wanderPhaseY) * 0.008;

    // Smooth lerp toward desired target for natural eye movement
    const lerpSpeed = 4.0; // units/sec for smooth gaze transitions
    const alpha = Math.min(1.0, delta * lerpSpeed);
    this.smoothedTarget.lerp(this.desiredTarget, alpha);

    // Apply wander on top of smoothed position
    this.targetObject.position.set(
      this.smoothedTarget.x + wanderX,
      this.smoothedTarget.y + wanderY,
      this.smoothedTarget.z
    );
  }
}
