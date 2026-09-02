import type { SemanticExpression, VrmCapabilityMap } from '../avatarTypes';

export interface ExpressionTargetBinding {
  name: string;
  weight: number;
  isRawMorph?: boolean;
}

export interface ExpressionRecipe {
  bindings: ExpressionTargetBinding[];
}

export type ExpressionProfileMap = Record<SemanticExpression, ExpressionRecipe[]>;

/**
 * Model-independent translation recipes for each SemanticExpression.
 * Specified in order of preference. The resolver checks runtime capabilities
 * and selects the first recipe where all required target names exist in the model.
 */
export const DEFAULT_EXPRESSION_PROFILES: ExpressionProfileMap = {
  neutral: [
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],

  warm: [
    { bindings: [{ name: 'happy', weight: 0.82 }] },
    { bindings: [{ name: 'relaxed', weight: 0.68 }, { name: 'neutral', weight: 0.3 }] },
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],

  skeptical: [
    { bindings: [{ name: 'neutral', weight: 0.65 }, { name: 'angry', weight: 0.28 }] },
    { bindings: [{ name: 'surprised', weight: 0.20 }, { name: 'neutral', weight: 0.70 }] },
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],

  impressed: [
    { bindings: [{ name: 'surprised', weight: 0.62 }, { name: 'happy', weight: 0.42 }] },
    { bindings: [{ name: 'surprised', weight: 0.50 }] },
    { bindings: [{ name: 'happy', weight: 0.60 }] },
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],

  stern: [
    { bindings: [{ name: 'angry', weight: 0.68 }] },
    { bindings: [{ name: 'sad', weight: 0.42 }, { name: 'neutral', weight: 0.5 }] },
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],

  concerned: [
    { bindings: [{ name: 'sad', weight: 0.55 }, { name: 'surprised', weight: 0.20 }] },
    { bindings: [{ name: 'sad', weight: 0.60 }] },
    { bindings: [{ name: 'angry', weight: 0.30 }, { name: 'neutral', weight: 0.5 }] },
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],

  surprised: [
    { bindings: [{ name: 'surprised', weight: 0.85 }] },
    { bindings: [{ name: 'happy', weight: 0.50 }] },
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],

  thinking: [
    { bindings: [{ name: 'neutral', weight: 0.70 }, { name: 'relaxed', weight: 0.30 }] },
    { bindings: [{ name: 'neutral', weight: 1.0 }] },
  ],
};

/**
 * Resolves a semantic expression to target bindings based on runtime capabilities.
 * Guarantees zero crashes and never returns non-existent target names.
 */
export function resolveSemanticExpression(
  expression: SemanticExpression,
  capabilityMap: VrmCapabilityMap,
  customProfiles?: Partial<ExpressionProfileMap>
): ExpressionTargetBinding[] {
  const profiles = customProfiles
    ? { ...DEFAULT_EXPRESSION_PROFILES, ...customProfiles }
    : DEFAULT_EXPRESSION_PROFILES;

  const recipes = profiles[expression] || DEFAULT_EXPRESSION_PROFILES.neutral;

  for (const recipe of recipes) {
    const allSupported = recipe.bindings.every((binding) => {
      if (binding.isRawMorph) {
        return capabilityMap.rawMorphTargets.has(binding.name);
      }
      return (
        capabilityMap.presetExpressions.has(binding.name) ||
        capabilityMap.customExpressions.has(binding.name)
      );
    });

    if (allSupported) {
      return recipe.bindings;
    }
  }

  // Safe fallback if no recipe matched
  if (capabilityMap.presetExpressions.has('neutral')) {
    return [{ name: 'neutral', weight: 1.0 }];
  }

  return [];
}
