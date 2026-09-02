import React, { useState, useEffect, useCallback } from 'react';
import type { Emotion } from '../types/persona';
import type { VrmValidationReport } from '../avatar/avatarTypes';
import type { AvatarStatus } from '../types/persona';

interface CameraConfig {
  fov: number;
  cameraZ: number;
  cameraYOffset: number;
  cameraLookYOffset: number;
  cameraX?: number;
  x?: number;
  y?: number;
}

interface LightingConfig {
  ambient: number;
  key: number;
  fill: number;
  rim: number;
  keyX?: number;
  keyY?: number;
  keyZ?: number;
  exposure?: number;
}

interface AvatarConfig {
  scale: number;
  x: number;
  y: number;
  z: number;
}

interface CameraApi {
  set: (cfg: Partial<CameraConfig>) => void;
  get: () => CameraConfig;
}

interface LightingApi {
  set: (cfg: Partial<LightingConfig>) => void;
  get: () => LightingConfig;
}

interface AvatarApi {
  set: (cfg: Partial<AvatarConfig>) => void;
  get: () => AvatarConfig;
}

interface ManualControlsProps {
  onManualSpeak: (text: string, emotion: Emotion) => void;
  onResetIdle: () => void;
  currentEmotion: Emotion;
  vrmReport?: VrmValidationReport | null;
  onSetActivity?: (status: AvatarStatus) => void;
  onPlayGesture?: (gesture: string) => void;
  currentStatus?: AvatarStatus;
  cameraApi?: CameraApi | null;
  lightingApi?: LightingApi | null;
  avatarApi?: AvatarApi | null;
}

const EMOTIONS: { key: Emotion; label: string }[] = [
  { key: 'neutral',   label: 'Neutral'   },
  { key: 'warm',      label: 'Warm'      },
  { key: 'skeptical', label: 'Skeptical' },
  { key: 'impressed', label: 'Impressed' },
  { key: 'stern',     label: 'Stern'     },
  { key: 'concerned', label: 'Concerned' },
  { key: 'surprised', label: 'Surprised' },
  { key: 'thinking',  label: 'Thinking'  },
];

const QUICK_PHRASES: { text: string; emotion: Emotion }[] = [
  { text: "Good morning! Tell me about your background and experience.", emotion: 'neutral' },
  { text: "That's a really interesting answer — I like how you framed that.", emotion: 'warm' },
  { text: "Hmm, I'm not entirely convinced. Can you elaborate on that?", emotion: 'skeptical' },
  { text: "Wow, that's impressive! I didn't expect that level of depth.", emotion: 'impressed' },
  { text: "That approach has significant risks. Walk me through your reasoning.", emotion: 'stern' },
  { text: "I'm concerned about how this handles edge cases under load.", emotion: 'concerned' },
  { text: "Oh, wow! That is completely unexpected.", emotion: 'surprised' },
  { text: "Let me ponder that architectural trade-off for a moment...", emotion: 'thinking' },
];

const GESTURES = [
  'nod',
  'shake_head',
  'head_tilt',
  'acknowledge',
  'agree',
  'disagree',
  'thinking',
  'lean_forward',
  'lean_back',
];

const ACTIVITIES: { key: AvatarStatus; label: string }[] = [
  { key: 'idle',             label: '💤  IDLE'      },
  { key: 'listening',        label: '👂  LISTENING' },
  { key: 'agent_processing', label: '🤔  THINKING'  },
  { key: 'speaking',         label: '💬  SPEAKING'  },
];

const TUNING_STORAGE_KEY = 'persona_vrm_tuning';

const DEFAULT_TUNING = {
  lighting: {
    keyIntensity: 1.4,
    fillIntensity: 1.15,
    rimIntensity: 0.5,
    ambientIntensity: 0.15,
    exposure: 0.65,
    keyX: 5.0,
    keyY: -1.1,
    keyZ: -5.0,
  },
  camera: {
    x: 0,
    y: 0,
    z: 1.26,
    fov: 24,
    cameraLookYOffset: -0.04,
  },
  avatar: {
    scale: 1.0,
    x: 0,
    y: 0,
    z: 0,
  },
};

// ─── Reusable slider row ─────────────────────────────────────────────────────
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

const BrutalSlider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange }) => (
  <div className="mc-slider-row">
    <div className="mc-slider-header">
      <span className="mc-slider-label">{label}</span>
      <span className="mc-slider-value">{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      className="mc-range-input"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
    />
    <div className="mc-slider-minmax">
      <span>{min}</span><span>{max}</span>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const ManualControls: React.FC<ManualControlsProps> = ({
  onManualSpeak,
  onResetIdle,
  currentEmotion,
  vrmReport,
  onSetActivity,
  onPlayGesture,
  currentStatus,
  cameraApi,
  lightingApi,
  avatarApi,
}) => {
  const [text, setText] = useState('Good morning. Tell me about your background.');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>(currentEmotion);
  const [prevEmotion, setPrevEmotion] = useState<Emotion>(currentEmotion);
  if (prevEmotion !== currentEmotion) {
    setPrevEmotion(currentEmotion);
    setSelectedEmotion(currentEmotion);
  }

  const [activeTab, setActiveTab] = useState<'speak' | 'activity' | 'scene' | 'debug'>('scene');
  const [copied, setCopied] = useState(false);

  // Helper to read initial calibration from localStorage
  const getStoredTuning = () => {
    try {
      const stored = localStorage.getItem(TUNING_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return null;
  };

  // Camera state
  const [cam, setCam] = useState<CameraConfig>(() => {
    const parsed = getStoredTuning();
    return {
      fov: parsed?.camera?.fov ?? DEFAULT_TUNING.camera.fov,
      cameraZ: parsed?.camera?.z ?? DEFAULT_TUNING.camera.z,
      cameraYOffset: parsed?.camera?.y ?? DEFAULT_TUNING.camera.y,
      cameraLookYOffset: DEFAULT_TUNING.camera.cameraLookYOffset,
      cameraX: parsed?.camera?.x ?? DEFAULT_TUNING.camera.x,
    };
  });

  // Lighting state
  const [lit, setLit] = useState<LightingConfig>(() => {
    const parsed = getStoredTuning();
    return {
      ambient: parsed?.lighting?.ambientIntensity ?? DEFAULT_TUNING.lighting.ambientIntensity,
      key: parsed?.lighting?.keyIntensity ?? DEFAULT_TUNING.lighting.keyIntensity,
      fill: parsed?.lighting?.fillIntensity ?? DEFAULT_TUNING.lighting.fillIntensity,
      rim: parsed?.lighting?.rimIntensity ?? DEFAULT_TUNING.lighting.rimIntensity,
      keyX: parsed?.lighting?.keyX ?? DEFAULT_TUNING.lighting.keyX,
      keyY: parsed?.lighting?.keyY ?? DEFAULT_TUNING.lighting.keyY,
      keyZ: parsed?.lighting?.keyZ ?? DEFAULT_TUNING.lighting.keyZ,
      exposure: parsed?.lighting?.exposure ?? DEFAULT_TUNING.lighting.exposure,
    };
  });

  // Avatar transform state
  const [avt, setAvt] = useState<AvatarConfig>(() => {
    const parsed = getStoredTuning();
    return {
      scale: parsed?.avatar?.scale ?? DEFAULT_TUNING.avatar.scale,
      x: parsed?.avatar?.x ?? DEFAULT_TUNING.avatar.x,
      y: parsed?.avatar?.y ?? DEFAULT_TUNING.avatar.y,
      z: parsed?.avatar?.z ?? DEFAULT_TUNING.avatar.z,
    };
  });

  // Apply state to runtime APIs
  useEffect(() => {
    if (cameraApi) {
      cameraApi.set({
        fov: cam.fov,
        cameraZ: cam.cameraZ,
        cameraYOffset: cam.cameraYOffset,
        cameraLookYOffset: cam.cameraLookYOffset,
        cameraX: cam.cameraX,
      });
    }
  }, [cameraApi, cam]);

  useEffect(() => {
    if (lightingApi) {
      lightingApi.set({
        ambient: lit.ambient,
        key: lit.key,
        fill: lit.fill,
        rim: lit.rim,
        keyX: lit.keyX,
        keyY: lit.keyY,
        keyZ: lit.keyZ,
        exposure: lit.exposure,
      });
    }
  }, [lightingApi, lit]);

  useEffect(() => {
    if (avatarApi) {
      avatarApi.set({
        scale: avt.scale,
        x: avt.x,
        y: avt.y,
        z: avt.z,
      });
    }
  }, [avatarApi, avt]);

  // Persist calibration to localStorage
  const saveToStorage = useCallback((
    currentLit: LightingConfig,
    currentCam: CameraConfig,
    currentAvt: AvatarConfig
  ) => {
    const payload = {
      lighting: {
        keyIntensity: currentLit.key,
        fillIntensity: currentLit.fill,
        rimIntensity: currentLit.rim,
        ambientIntensity: currentLit.ambient,
        exposure: currentLit.exposure ?? 0.95,
        keyX: currentLit.keyX ?? 1.2,
        keyY: currentLit.keyY ?? 2.2,
        keyZ: currentLit.keyZ ?? 1.8,
      },
      camera: {
        x: currentCam.cameraX ?? 0,
        y: currentCam.cameraYOffset ?? 0,
        z: currentCam.cameraZ,
        fov: currentCam.fov,
      },
      avatar: {
        scale: currentAvt.scale,
        x: currentAvt.x,
        y: currentAvt.y,
        z: currentAvt.z,
      },
    };
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(payload));
  }, []);

  // Updaters
  const updateCam = useCallback(<K extends keyof CameraConfig>(key: K, val: number) => {
    setCam(prev => {
      const next = { ...prev, [key]: val };
      saveToStorage(lit, next, avt);
      return next;
    });
  }, [lit, avt, saveToStorage]);

  const updateLit = useCallback(<K extends keyof LightingConfig>(key: K, val: number) => {
    setLit(prev => {
      const next = { ...prev, [key]: val };
      saveToStorage(next, cam, avt);
      return next;
    });
  }, [cam, avt, saveToStorage]);

  const updateAvt = useCallback(<K extends keyof AvatarConfig>(key: K, val: number) => {
    setAvt(prev => {
      const next = { ...prev, [key]: val };
      saveToStorage(lit, cam, next);
      return next;
    });
  }, [lit, cam, saveToStorage]);

  const handleSpeak = () => {
    if (text.trim()) onManualSpeak(text.trim(), selectedEmotion);
  };

  const handleCopyConfig = () => {
    const payload = {
      lighting: {
        keyIntensity: lit.key,
        fillIntensity: lit.fill,
        rimIntensity: lit.rim,
        ambientIntensity: lit.ambient,
        exposure: lit.exposure ?? 0.95,
        keyX: lit.keyX ?? 1.2,
        keyY: lit.keyY ?? 2.2,
        keyZ: lit.keyZ ?? 1.8,
      },
      camera: {
        x: cam.cameraX ?? 0,
        y: cam.cameraYOffset ?? 0,
        z: cam.cameraZ,
        fov: cam.fov,
      },
      avatar: {
        scale: avt.scale,
        x: avt.x,
        y: avt.y,
        z: avt.z,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetDefaults = () => {
    localStorage.removeItem(TUNING_STORAGE_KEY);
    const defaultCam = {
      fov: DEFAULT_TUNING.camera.fov,
      cameraZ: DEFAULT_TUNING.camera.z,
      cameraYOffset: DEFAULT_TUNING.camera.y,
      cameraLookYOffset: DEFAULT_TUNING.camera.cameraLookYOffset,
      cameraX: DEFAULT_TUNING.camera.x,
    };
    const defaultLit = {
      ambient: DEFAULT_TUNING.lighting.ambientIntensity,
      key: DEFAULT_TUNING.lighting.keyIntensity,
      fill: DEFAULT_TUNING.lighting.fillIntensity,
      rim: DEFAULT_TUNING.lighting.rimIntensity,
      keyX: DEFAULT_TUNING.lighting.keyX,
      keyY: DEFAULT_TUNING.lighting.keyY,
      keyZ: DEFAULT_TUNING.lighting.keyZ,
      exposure: DEFAULT_TUNING.lighting.exposure,
    };
    const defaultAvt = {
      scale: DEFAULT_TUNING.avatar.scale,
      x: DEFAULT_TUNING.avatar.x,
      y: DEFAULT_TUNING.avatar.y,
      z: DEFAULT_TUNING.avatar.z,
    };

    setCam(defaultCam);
    setLit(defaultLit);
    setAvt(defaultAvt);

    cameraApi?.set({
      fov: defaultCam.fov,
      cameraZ: defaultCam.cameraZ,
      cameraYOffset: defaultCam.cameraYOffset,
      cameraLookYOffset: defaultCam.cameraLookYOffset,
      cameraX: defaultCam.cameraX,
    });
    lightingApi?.set(defaultLit);
    avatarApi?.set(defaultAvt);
  };

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'scene',    label: '🎛 AVATAR TUNING' },
    { key: 'speak',    label: '🎤 SPEAK' },
    { key: 'activity', label: '🎭 ACTIVITY' },
    { key: 'debug',    label: '🔬 DEBUG' },
  ];

  return (
    <div className="mc-root">
      {/* Tab bar */}
      <div className="mc-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`mc-tab-btn ${activeTab === t.key ? 'is-active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mc-body">
        {/* ── SCENE (LIVE AVATAR CALIBRATION) ─────────────────────────── */}
        {activeTab === 'scene' && (
          <div className="mc-section-stack">
            <div className="mc-section">
              <span className="mc-section-label">LIGHTING</span>
              <BrutalSlider label="Key Light Intensity"   value={lit.key}               min={0}   max={3.0} step={0.05} onChange={v => updateLit('key', v)} />
              <BrutalSlider label="Fill Light Intensity"  value={lit.fill}              min={0}   max={2.0} step={0.05} onChange={v => updateLit('fill', v)} />
              <BrutalSlider label="Rim Light Intensity"   value={lit.rim}               min={0}   max={2.0} step={0.05} onChange={v => updateLit('rim', v)} />
              <BrutalSlider label="Ambient Light Intensity" value={lit.ambient}         min={0}   max={2.0} step={0.05} onChange={v => updateLit('ambient', v)} />
              <BrutalSlider label="Light Position X"      value={lit.keyX ?? 1.2}      min={-5}  max={5}   step={0.1}  onChange={v => updateLit('keyX', v)} />
              <BrutalSlider label="Light Position Y"      value={lit.keyY ?? 2.2}      min={-5}  max={5}   step={0.1}  onChange={v => updateLit('keyY', v)} />
              <BrutalSlider label="Light Position Z"      value={lit.keyZ ?? 1.8}      min={-5}  max={5}   step={0.1}  onChange={v => updateLit('keyZ', v)} />
            </div>

            <div className="mc-divider" />

            <div className="mc-section">
              <span className="mc-section-label">RENDERING</span>
              <BrutalSlider label="Exposure"              value={lit.exposure ?? 0.95}  min={0.1} max={2.5} step={0.05} onChange={v => updateLit('exposure', v)} />
            </div>

            <div className="mc-divider" />

            <div className="mc-section">
              <span className="mc-section-label">CAMERA</span>
              <BrutalSlider label="Field of View (FOV)"   value={cam.fov}               min={10}  max={60}  step={0.5}  onChange={v => updateCam('fov', v)} />
              <BrutalSlider label="Camera Distance (Z)"   value={cam.cameraZ}           min={0.4} max={3.5} step={0.01} onChange={v => updateCam('cameraZ', v)} />
              <BrutalSlider label="Camera Position X"     value={cam.cameraX ?? 0}      min={-1.5} max={1.5} step={0.01} onChange={v => updateCam('cameraX', v)} />
              <BrutalSlider label="Camera Height Offset Y" value={cam.cameraYOffset}   min={-1.0} max={1.0} step={0.01} onChange={v => updateCam('cameraYOffset', v)} />
            </div>

            <div className="mc-divider" />

            <div className="mc-section">
              <span className="mc-section-label">AVATAR TRANSFORM</span>
              <BrutalSlider label="Model Scale"           value={avt.scale}             min={0.5} max={2.0} step={0.02} onChange={v => updateAvt('scale', v)} />
              <BrutalSlider label="Model Position X"      value={avt.x}                 min={-1.5} max={1.5} step={0.02} onChange={v => updateAvt('x', v)} />
              <BrutalSlider label="Model Position Y"      value={avt.y}                 min={-1.5} max={1.5} step={0.02} onChange={v => updateAvt('y', v)} />
              <BrutalSlider label="Model Position Z"      value={avt.z}                 min={-1.5} max={1.5} step={0.02} onChange={v => updateAvt('z', v)} />
            </div>

            <div className="mc-divider" />

            <div className="mc-action-row">
              <button
                type="button"
                className={`mc-btn-primary mc-copy-btn ${copied ? 'is-copied' : ''}`}
                onClick={handleCopyConfig}
              >
                {copied ? '✓ COPIED TUNING JSON' : '⧉ COPY TUNING VALUES'}
              </button>
              <button
                type="button"
                className="mc-btn-outline"
                onClick={handleResetDefaults}
              >
                ↺ RESET DEFAULTS
              </button>
            </div>
            <p className="mc-hint" style={{ marginTop: '8px' }}>
              Tuning values automatically persist in localStorage. Click "COPY TUNING VALUES" to export clean JSON.
            </p>
          </div>
        )}

        {/* ── SPEAK ──────────────────────────────────────────────── */}
        {activeTab === 'speak' && (
          <div className="mc-section-stack">
            <div className="mc-section">
              <span className="mc-section-label">SELECT EMOTION</span>
              <div className="mc-emotion-grid">
                {EMOTIONS.map(e => (
                  <button
                    key={e.key}
                    type="button"
                    className={`mc-emotion-btn ${selectedEmotion === e.key ? 'is-active' : ''}`}
                    onClick={() => setSelectedEmotion(e.key)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-section">
              <span className="mc-section-label">DIALOGUE TEXT</span>
              <textarea
                className="mc-textarea"
                rows={3}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type what Persona should say..."
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSpeak(); } }}
              />
              <span className="mc-hint">Ctrl+Enter to speak</span>
            </div>

            <div className="mc-action-row">
              <button type="button" className="mc-btn-primary" onClick={handleSpeak}>
                ▶ TRIGGER SPEAK()
              </button>
              <button type="button" className="mc-btn-outline" onClick={() => { onResetIdle(); }}>
                ↺ RESET
              </button>
            </div>

            <div className="mc-section">
              <span className="mc-section-label">QUICK PHRASES</span>
              <div className="mc-phrase-list">
                {QUICK_PHRASES.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="mc-phrase-btn"
                    onClick={() => onManualSpeak(p.text, p.emotion)}
                  >
                    <span className="mc-phrase-tag">[{p.emotion.toUpperCase()}]</span>
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ───────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="mc-section-stack">
            <div className="mc-section">
              <span className="mc-section-label">AVATAR STATE</span>
              <div className="mc-activity-grid">
                {ACTIVITIES.map(a => (
                  <button
                    key={a.key}
                    type="button"
                    className={`mc-activity-btn ${currentStatus === a.key ? 'is-active' : ''}`}
                    onClick={() => {
                      if (a.key === 'speaking') {
                        onManualSpeak(text.trim() || 'Speaking state active.', selectedEmotion);
                      } else {
                        onSetActivity?.(a.key);
                        if (a.key === 'idle') onResetIdle();
                      }
                    }}
                  >
                    {a.label}
                    {currentStatus === a.key && <span className="mc-active-dot" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mc-section">
              <span className="mc-section-label">GESTURES</span>
              <div className="mc-gesture-grid">
                {GESTURES.map(g => (
                  <button
                    key={g}
                    type="button"
                    className="mc-gesture-btn"
                    onClick={() => onPlayGesture?.(g)}
                  >
                    {g.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DEBUG ──────────────────────────────────────────────── */}
        {activeTab === 'debug' && (
          <div className="mc-section-stack">
            <div className="mc-section">
              <span className="mc-section-label">VRM VALIDATION REPORT</span>
              {vrmReport ? (
                <div className="mc-debug-table">
                  {[
                    ['Version',    `${vrmReport.vrmVersion} — ${vrmReport.vrmMetaName}`],
                    ['Author',     vrmReport.vrmMetaAuthor],
                    ['Humanoid',   vrmReport.humanoidAvailable   ? '✓ Available' : '❌ Missing'],
                    ['Expressions',vrmReport.expressionManagerAvailable ? '✓ Available' : '❌ Missing'],
                    ['LookAt',     vrmReport.lookAtAvailable     ? '✓ Available' : '❌ Missing'],
                    ['SpringBones',vrmReport.springBonesAvailable? '✓ Available' : '❌ Missing'],
                    [`Preset Exp (${vrmReport.presetExpressions.length})`, vrmReport.presetExpressions.join(', ') || '—'],
                    ...(vrmReport.rawMorphTargetsCount ? [['Raw Morph Targets', `${vrmReport.rawMorphTargetsCount} targets on face mesh`]] : []),
                    ...(vrmReport.customExpressions.length > 0
                      ? [[`Custom Exp (${vrmReport.customExpressions.length})`, vrmReport.customExpressions.join(', ')]]
                      : []),
                  ].map(([k, v]) => (
                    <div className="mc-debug-row" key={k}>
                      <span className="mc-debug-key">{k}</span>
                      <span className="mc-debug-val">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mc-hint">VRM not yet loaded...</p>
              )}
            </div>
            <div className="mc-info-box">
              ✅ All controls work directly without WebMCP or ChatGPT.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
