import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PersonaAvatarRuntime } from './PersonaAvatarRuntime';
import type { AvatarStatus, Emotion } from '../types/persona';
import type { VrmValidationReport } from './avatarTypes';
import './PersonaAvatar.css';

interface PersonaAvatarProps {
  modelUrl?: string;
  status: AvatarStatus;
  emotion: Emotion;
  onValidationReport?: (report: VrmValidationReport) => void;
  onGestureRef?: (playGesture: (name: string) => void) => void;
  onCameraRef?: (api: {
    set: (cfg: Parameters<PersonaAvatarRuntime['setCameraConfig']>[0]) => void;
    get: () => ReturnType<PersonaAvatarRuntime['getCameraConfig']>;
  }) => void;
  onLightingRef?: (api: {
    set: (cfg: Parameters<PersonaAvatarRuntime['setLightingConfig']>[0]) => void;
    get: () => ReturnType<PersonaAvatarRuntime['getLightingConfig']>;
  }) => void;
  onAvatarRef?: (api: {
    set: (cfg: Parameters<PersonaAvatarRuntime['setAvatarConfig']>[0]) => void;
    get: () => ReturnType<PersonaAvatarRuntime['getAvatarConfig']>;
  }) => void;
  onAttentionRef?: (setAttention: (target: 'user' | 'center' | 'away') => void) => void;
}

export const PersonaAvatar: React.FC<PersonaAvatarProps> = ({
  modelUrl,
  status,
  emotion,
  onValidationReport,
  onGestureRef,
  onCameraRef,
  onLightingRef,
  onAvatarRef,
  onAttentionRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<PersonaAvatarRuntime | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vrmReport, setVrmReport] = useState<VrmValidationReport | null>(null);

  const propsRef = useRef({
    onValidationReport,
    onGestureRef,
    onCameraRef,
    onLightingRef,
    onAvatarRef,
    onAttentionRef,
  });

  useEffect(() => {
    propsRef.current = {
      onValidationReport,
      onGestureRef,
      onCameraRef,
      onLightingRef,
      onAvatarRef,
      onAttentionRef,
    };
  });

  // Initialize Three.js VRM Runtime
  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setError(null);

    const runtime = new PersonaAvatarRuntime(containerRef.current, {
      modelUrl,
      onLoad: (report) => {
        setIsLoading(false);
        setVrmReport(report);
        propsRef.current.onValidationReport?.(report);
        if (propsRef.current.onGestureRef) {
          propsRef.current.onGestureRef((name: string) => runtime.playGesture(name));
        }
        if (propsRef.current.onAttentionRef) {
          propsRef.current.onAttentionRef((target: 'user' | 'center' | 'away') => {
            if (target === 'user') runtime.lookAtUser();
            else if (target === 'center') runtime.lookAtCenter();
            else if (target === 'away') runtime.lookAway();
          });
        }
        if (propsRef.current.onCameraRef) {
          propsRef.current.onCameraRef({
            set: (cfg) => runtime.setCameraConfig(cfg),
            get: () => runtime.getCameraConfig(),
          });
        }
        if (propsRef.current.onLightingRef) {
          propsRef.current.onLightingRef({
            set: (cfg) => runtime.setLightingConfig(cfg),
            get: () => runtime.getLightingConfig(),
          });
        }
        if (propsRef.current.onAvatarRef) {
          propsRef.current.onAvatarRef({
            set: (cfg) => runtime.setAvatarConfig(cfg),
            get: () => runtime.getAvatarConfig(),
          });
        }
      },
      onError: (err) => {
        setIsLoading(false);
        setError(err.message || 'Failed to load VRM model asset.');
      },
    });

    runtimeRef.current = runtime;

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [modelUrl]);

  // Sync emotion changes
  useEffect(() => {
    if (runtimeRef.current) {
      runtimeRef.current.setEmotion(emotion);
    }
  }, [emotion]);

  // Sync status changes → avatar activity
  useEffect(() => {
    if (!runtimeRef.current) return;

    let activity: import('./avatarTypes').AvatarActivity = 'idle';
    if (status === 'speaking') {
      activity = 'speaking';
    } else if (status === 'listening') {
      activity = 'listening';
    } else if (status === 'agent_processing') {
      activity = 'thinking';
    }
    // 'idle', 'user_finished' → 'idle' (default)

    runtimeRef.current.setActivity(activity);
  }, [status]);

  const emotionLabelMap: Record<Emotion, { label: string; badgeBg: string; textColor: string }> = {
    neutral: { label: 'NEUTRAL', badgeBg: '#F4F4F4', textColor: '#191817' },
    warm: { label: 'WARM', badgeBg: '#E8F2FF', textColor: '#0F62FE' },
    skeptical: { label: 'SKEPTICAL', badgeBg: '#FFF3E0', textColor: '#D97706' },
    impressed: { label: 'IMPRESSED', badgeBg: '#E6F4EA', textColor: '#137333' },
    stern: { label: 'STERN', badgeBg: '#FCE8E6', textColor: '#C5221F' },
    concerned: { label: 'CONCERNED', badgeBg: '#F3E8FF', textColor: '#8A3FFC' },
    surprised: { label: 'SURPRISED', badgeBg: '#FEF3C7', textColor: '#B45309' },
    thinking: { label: 'THINKING', badgeBg: '#E0F2FE', textColor: '#0369A1' },
  };

  const currentEmotion = emotionLabelMap[emotion] || emotionLabelMap.neutral;

  return (
    <div className={`persona-vrm-wrapper ${status === 'speaking' ? 'is-speaking' : ''}`}>
      <div
        className="avatar-emotion-tag"
        style={{ backgroundColor: currentEmotion.badgeBg, color: currentEmotion.textColor }}
      >
        3D VRM • EXPRESSION: {currentEmotion.label}
      </div>

      <div className="vrm-canvas-container" ref={containerRef}>
        {isLoading && (
          <div className="vrm-loading-overlay">
            <div className="vrm-spinner" />
            <span className="loading-text">LOADING VRM AVATAR MODEL...</span>
          </div>
        )}

        {error && (
          <div className="vrm-error-overlay">
            <span className="error-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} />
            </span>
            <div className="error-title">VRM ASSET NOT LOADED</div>
            <p className="error-desc">{error}</p>
            <div className="expected-path-note">
              Expected location: <code>public/models/persona.vrm</code> or <code>public/models/Alex0.1.vrm</code>
            </div>
          </div>
        )}
      </div>

      {vrmReport && !isLoading && !error && (
        <div className="vrm-badge-footer">
          <span className="vrm-model-name">VRM {vrmReport.vrmVersion} • {vrmReport.vrmMetaName}</span>
        </div>
      )}
    </div>
  );
};
