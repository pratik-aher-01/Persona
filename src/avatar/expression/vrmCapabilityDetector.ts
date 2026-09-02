import type { VRM } from '@pixiv/three-vrm';
import type { Mesh, SkinnedMesh } from 'three';
import type { VrmCapabilityMap } from '../avatarTypes';

export function detectVRMCapabilities(vrm: VRM | null): VrmCapabilityMap {
  const presetExpressions = new Set<string>();
  const customExpressions = new Set<string>();
  const rawMorphTargets = new Set<string>();

  if (!vrm) {
    return {
      presetExpressions,
      customExpressions,
      rawMorphTargets,
      hasMouthVisemes: false,
      hasEyeBlink: false,
    };
  }

  // 1. Inspect VRM Expression Manager
  if (vrm.expressionManager) {
    const stdPresets = new Set([
      'neutral',
      'happy',
      'angry',
      'sad',
      'relaxed',
      'surprised',
      'aa',
      'ih',
      'ou',
      'ee',
      'oh',
      'blink',
      'blinkLeft',
      'blinkRight',
    ]);

    for (const name of Object.keys(vrm.expressionManager.expressionMap)) {
      if (stdPresets.has(name)) {
        presetExpressions.add(name);
      } else {
        customExpressions.add(name);
      }
    }
  }

  // 2. Traverse VRM scene to collect raw mesh morph target names
  vrm.scene.traverse((obj) => {
    const mesh = obj as Mesh | SkinnedMesh;
    if (mesh.isMesh && mesh.morphTargetDictionary) {
      for (const targetName of Object.keys(mesh.morphTargetDictionary)) {
        rawMorphTargets.add(targetName);
      }
    }
  });

  const hasMouthVisemes = presetExpressions.has('aa') || presetExpressions.has('oh');
  const hasEyeBlink = presetExpressions.has('blink');

  const capabilityMap: VrmCapabilityMap = {
    presetExpressions,
    customExpressions,
    rawMorphTargets,
    hasMouthVisemes,
    hasEyeBlink,
  };

  console.log(
    `[VrmCapabilityDetector] Model inspected. Presets: ${presetExpressions.size}, Custom: ${customExpressions.size}, Raw morphs: ${rawMorphTargets.size}`
  );

  return capabilityMap;
}
