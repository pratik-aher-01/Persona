import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import type { AvatarActivity } from './avatarTypes';

// Gaze target positions relative to the scene (Z-forward convention)
// These are world-space positions; the VRM lookAt system handles conversion.
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

  public setVRM(vrm: VRM, scene: THREE.Scene) {
    this.vrm = vrm;

    if (!scene.getObjectByName('GazeTarget')) {
      scene.add(this.targetObject);
    }

    if (this.vrm.lookAt) {
      this.vrm.lookAt.target = this.targetObject;
    }
  }

  /** Set the camera position so gaze-to-user tracks correctly */
  public setCameraPosition(x: number, y: number, z: number) {
    this.cameraPosition.set(x, y, z);
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
        // Look toward camera (user)
        this.setGazePreset('user');
        break;

      case 'listening':
        // Look toward user with a very slight upward attentive tilt
        this.desiredTarget.set(
          this.cameraPosition.x,
          this.cameraPosition.y + 0.04,
          this.cameraPosition.z,
        );
        break;

      case 'thinking':
        // Look down-left — classic natural thinking direction
        this.setGazePreset('down');
        break;
    }
  }

  private setGazePreset(preset: GazePreset) {
    const presets: Record<GazePreset, GazePosition> = {
      user:    { x: this.cameraPosition.x,        y: this.cameraPosition.y,        z: this.cameraPosition.z },
      away:    { x: this.cameraPosition.x + 0.35, y: this.cameraPosition.y + 0.05, z: this.cameraPosition.z },
      down:    { x: this.cameraPosition.x - 0.25, y: this.cameraPosition.y - 0.25, z: this.cameraPosition.z },
      neutral: { x: 0,                             y: 1.4,                           z: 2.0 },
    };
    const pos = presets[preset];
    this.desiredTarget.set(pos.x, pos.y, pos.z);
  }

  public getTarget(): THREE.Vector3 {
    return this.smoothedTarget.clone();
  }

  public update(delta: number) {
    if (!this.vrm || !this.vrm.lookAt) return;

    this.wanderTime += delta;

    // Micro-wander: extremely subtle eye movement on top of the base target
    // Keeps the eyes from looking "locked" to a single point
    const wanderX = Math.sin(this.wanderTime * 0.8  + this.wanderPhaseX) * 0.012;
    const wanderY = Math.sin(this.wanderTime * 0.55 + this.wanderPhaseY) * 0.008;

    // Smooth lerp toward desired target (slow = natural eye movement)
    const lerpSpeed = 3.5; // units/sec for gaze following
    const alpha = Math.min(1.0, delta * lerpSpeed);
    this.smoothedTarget.lerp(this.desiredTarget, alpha);

    // Apply wander on top of smoothed position
    this.targetObject.position.set(
      this.smoothedTarget.x + wanderX,
      this.smoothedTarget.y + wanderY,
      this.smoothedTarget.z,
    );
  }
}
