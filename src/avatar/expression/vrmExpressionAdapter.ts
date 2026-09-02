import type { VRM } from '@pixiv/three-vrm';
import type { Mesh, SkinnedMesh } from 'three';
import type { VrmCapabilityMap } from '../avatarTypes';
import { detectVRMCapabilities } from './vrmCapabilityDetector';

export class VrmExpressionAdapter {
  private vrm: VRM | null = null;
  private capabilityMap: VrmCapabilityMap = {
    presetExpressions: new Set(),
    customExpressions: new Set(),
    rawMorphTargets: new Set(),
    hasMouthVisemes: false,
    hasEyeBlink: false,
  };

  private targetWeights: Map<string, number> = new Map();
  private currentWeights: Map<string, number> = new Map();
  private rawMorphTargetIndexCache: Map<string, { mesh: Mesh | SkinnedMesh; index: number }[]> = new Map();

  public attach(vrm: VRM): VrmCapabilityMap {
    this.detach();
    this.vrm = vrm;
    this.capabilityMap = detectVRMCapabilities(vrm);
    this.buildRawMorphCache();
    return this.capabilityMap;
  }

  public detach() {
    if (this.vrm && this.vrm.expressionManager) {
      // Reset all current values before detaching
      for (const key of this.currentWeights.keys()) {
        try {
          this.vrm.expressionManager.setValue(key, 0);
        } catch {
          // ignore cleanup errors
        }
      }
    }

    this.vrm = null;
    this.capabilityMap = {
      presetExpressions: new Set(),
      customExpressions: new Set(),
      rawMorphTargets: new Set(),
      hasMouthVisemes: false,
      hasEyeBlink: false,
    };
    this.targetWeights.clear();
    this.currentWeights.clear();
    this.rawMorphTargetIndexCache.clear();
  }

  public getCapabilityMap(): VrmCapabilityMap {
    return this.capabilityMap;
  }

  public isAttached(): boolean {
    return Boolean(this.vrm);
  }

  public setTargetWeight(name: string, weight: number) {
    const clamped = Math.max(0, Math.min(1, weight));
    this.targetWeights.set(name, clamped);
  }

  public getTargetWeight(name: string): number {
    return this.targetWeights.get(name) ?? 0;
  }

  public resetAllTargets(names: string[]) {
    for (const name of names) {
      this.targetWeights.set(name, 0);
    }
  }

  private buildRawMorphCache() {
    if (!this.vrm) return;
    this.rawMorphTargetIndexCache.clear();

    this.vrm.scene.traverse((obj) => {
      const mesh = obj as Mesh | SkinnedMesh;
      if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        for (const [targetName, idx] of Object.entries(mesh.morphTargetDictionary)) {
          const list = this.rawMorphTargetIndexCache.get(targetName) || [];
          list.push({ mesh, index: idx });
          this.rawMorphTargetIndexCache.set(targetName, list);
        }
      }
    });
  }

  public update(delta: number) {
    if (!this.vrm) return;

    const lerpFactor = Math.min(1.0, delta * 9.0);
    const allKeys = new Set([...this.targetWeights.keys(), ...this.currentWeights.keys()]);

    for (const key of allKeys) {
      const target = this.targetWeights.get(key) ?? 0;
      const current = this.currentWeights.get(key) ?? 0;
      const next = current + (target - current) * lerpFactor;

      // Only apply if changed meaningfully
      if (Math.abs(next - current) > 0.0001 || target === 0) {
        this.currentWeights.set(key, next);

        // 1. Try VRM Expression Manager
        if (
          this.vrm.expressionManager &&
          (this.capabilityMap.presetExpressions.has(key) || this.capabilityMap.customExpressions.has(key))
        ) {
          this.vrm.expressionManager.setValue(key, next);
        }

        // 2. Direct Mesh Morph Target
        const rawCache = this.rawMorphTargetIndexCache.get(key);
        if (rawCache) {
          for (const item of rawCache) {
            if (item.mesh.morphTargetInfluences) {
              item.mesh.morphTargetInfluences[item.index] = next;
            }
          }
        }
      }
    }
  }
}
