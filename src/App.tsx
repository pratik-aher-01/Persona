import { useEffect, useState, useCallback, useRef } from 'react';
import { PersonaAvatar } from './avatar/PersonaAvatar';
import type { VrmValidationReport } from './avatar/avatarTypes';
import { ManualControls } from './components/ManualControls';
import { registerWebMcpTools } from './webmcp/registerTools';
import { voiceEngine } from './voice';
import { isSpeechRecognitionSupported, SpeechRecognizer } from './utils/stt';
import { PERSONAS, getPersonaById, type PersonaConfig } from './config/personas';
import type { DemoState, Emotion, ThemeMode } from './types/persona';
import { MockAgentConsole } from './dev/MockAgentConsole';
import { conversationSessionInstance, type SessionState } from './session/ConversationSession';
import { ConversationControls } from './components/ConversationControls';
import { ConversationTranscript, type TranscriptTurn } from './components/ConversationTranscript';
import { activeAgentAdapter } from './agent/ConversationAgent';
import { AgentMissionPanel } from './components/AgentMissionPanel';
import './App.css';

export default function App() {
  const [state, setState] = useState<DemoState>({
    status: 'idle',
    behavioralState: 'WAITING',
    attentionPercentage: 90,
    behavioralAction: 'Awaiting agent tool call or user input...',
    emotion: 'neutral',
    dialogue: 'Welcome to Persona. Awaiting agent or manual tool call...',
    lastToolCall: null,
    webMcpAvailable: false,
    webMcpRegistered: false,
    userTranscript: '',
    pendingUserUtterance: '',
    utteranceId: 0,
    interimTranscript: '',
    isListening: false,
    micError: null,
    activePersonaId: 'technical-interview',
    selectedPersonaId: 'technical-interview',
    theme: (localStorage.getItem('persona_theme') as ThemeMode) || 'light',
  });

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isPersonasDrawerOpen, setIsPersonasDrawerOpen] = useState(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [vrmReport, setVrmReport] = useState<VrmValidationReport | null>(null);
  
  const gesturePlayRef = useRef<((name: string) => void) | null>(null);
  const attentionChangeRef = useRef<((target: 'user' | 'center' | 'away') => void) | null>(null);
  const [cameraApi, setCameraApi] = useState<{ set: (c: object) => void; get: () => object } | null>(null);
  const [lightingApi, setLightingApi] = useState<{ set: (c: object) => void; get: () => object } | null>(null);
  const [avatarApi, setAvatarApi] = useState<{ set: (c: object) => void; get: () => object } | null>(null);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const lastSpeakTimeRef = useRef<number>(0);
  const isTTSActiveRef = useRef<boolean>(false);
  const stateRef = useRef(state);

  const [sessionState, setSessionState] = useState<SessionState>('IDLE');
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurn[]>([]);

  useEffect(() => {
    return conversationSessionInstance.subscribe((s) => setSessionState(s));
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const selectedPersona = getPersonaById(state.selectedPersonaId);

  // Theme Toggle
  const toggleTheme = () => {
    setState((prev) => {
      const nextTheme: ThemeMode = prev.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('persona_theme', nextTheme);
      return { ...prev, theme: nextTheme };
    });
  };

  // Drawer Mutual Exclusion Handlers
  const togglePersonasDrawer = () => {
    setIsPersonasDrawerOpen((prev) => {
      const next = !prev;
      if (next) setIsAgentDrawerOpen(false);
      return next;
    });
  };

  const toggleAgentDrawer = () => {
    setIsAgentDrawerOpen((prev) => {
      const next = !prev;
      if (next) setIsPersonasDrawerOpen(false);
      return next;
    });
  };

  const handleCloseDrawers = () => {
    if (isPersonasDrawerOpen) setIsPersonasDrawerOpen(false);
    if (isAgentDrawerOpen) setIsAgentDrawerOpen(false);
  };

  const handleSelectPersona = (persona: PersonaConfig) => {
    if (persona.status === 'available') {
      setState((prev) => ({
        ...prev,
        activePersonaId: persona.id,
        selectedPersonaId: persona.id,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        selectedPersonaId: persona.id,
      }));
    }
    // Close drawer & return focus to main character
    setIsPersonasDrawerOpen(false);
  };

  const handleStartConversation = useCallback(() => {
    conversationSessionInstance.startSession();

    if (!isSpeechRecognitionSupported()) {
      conversationSessionInstance.onMicError('Speech Recognition API is unavailable in this browser.');
      setState((prev) => ({
        ...prev,
        micError: 'Speech Recognition API is unavailable in this browser.',
      }));
      return;
    }

    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }

    const recognizer = new SpeechRecognizer(
      (interimText) => {
        if (isTTSActiveRef.current) {
          voiceEngine.stop();
          isTTSActiveRef.current = false;
        }
        setState((p) => ({
          ...p,
          status: 'listening',
          interimTranscript: interimText,
        }));
      },
      (finalText) => {
        if (!finalText.trim()) return;
        if (isTTSActiveRef.current) {
          voiceEngine.stop();
          isTTSActiveRef.current = false;
        }

        const newTurn: TranscriptTurn = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'user',
          text: finalText,
          timestamp: new Date().toLocaleTimeString(),
        };
        setTranscriptTurns((prev) => [...prev, newTurn]);

        conversationSessionInstance.onUserSpeechCaptured(finalText);
        setState((p) => ({
          ...p,
          status: 'agent_processing',
          userTranscript: p.userTranscript ? `${p.userTranscript} ${finalText}` : finalText,
          pendingUserUtterance: finalText,
          utteranceId: p.utteranceId + 1,
          interimTranscript: '',
        }));

        activeAgentAdapter.onUserSpeech(finalText);
      },
      (listening) => {
        setState((p) => ({
          ...p,
          isListening: listening,
          status: listening ? (p.status === 'speaking' ? 'speaking' : 'listening') : (p.status === 'speaking' ? 'speaking' : 'idle'),
          ...(listening ? { micError: null } : { interimTranscript: '' }),
        }));
        if (listening) {
          conversationSessionInstance.onMicGranted();
        }
      },
      (errorMsg) => {
        conversationSessionInstance.onMicError(errorMsg);
        setState((p) => ({
          ...p,
          micError: errorMsg,
          isListening: false,
          status: 'idle',
        }));
      },
      () => {
        if (isTTSActiveRef.current) return;
      }
    );

    recognizerRef.current = recognizer;
    const started = recognizer.start();

    if (!started) {
      conversationSessionInstance.onMicError('Failed to start speech recognition.');
      setState((prev) => ({
        ...prev,
        micError: 'Failed to start speech recognition.',
        isListening: false,
      }));
    }
  }, []);

  const handleStopConversation = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    voiceEngine.stop();
    isTTSActiveRef.current = false;
    conversationSessionInstance.stopSession();
    setState((prev) => ({
      ...prev,
      status: 'idle',
      isListening: false,
      interimTranscript: '',
    }));
  }, []);

  const handleToggleListening = useCallback(() => {
    if (conversationSessionInstance.isSessionActive()) {
      handleStopConversation();
    } else {
      handleStartConversation();
    }
  }, [handleStartConversation, handleStopConversation]);

  const handleClearTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      userTranscript: '',
      pendingUserUtterance: '',
      utteranceId: 0,
      interimTranscript: '',
    }));
    setTranscriptTurns([]);
  }, []);

  const handleSpeak = useCallback((text: string, emotion: Emotion, source: 'WebMCP' | 'Manual' = 'WebMCP') => {
    lastSpeakTimeRef.current = Date.now();
    isTTSActiveRef.current = true;
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }

    setState((prev) => ({
      ...prev,
      status: 'speaking',
      isListening: false,
      interimTranscript: '',
      emotion,
      dialogue: text,
      lastToolCall: {
        tool: `speak() [${source}]`,
        timestamp: new Date().toLocaleTimeString(),
        args: { text, emotion },
      },
    }));

    const success = voiceEngine.speak({
      text,
      emotion,
      genderPreference: selectedPersona.genderPreference,
      onStart: () => {
        isTTSActiveRef.current = true;
        conversationSessionInstance.onAgentSpeechStart(text);
        setTranscriptTurns((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            role: 'persona',
            text,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setState((prev) => ({ ...prev, status: 'speaking', isListening: false }));
      },
      onEnd: () => {
        isTTSActiveRef.current = false;
        setState((prev) => (prev.status === 'speaking' ? { ...prev, status: 'idle' } : prev));
        conversationSessionInstance.onAgentSpeechEnd();

        // Automatically resume listening if session is still active
        if (conversationSessionInstance.isSessionActive() && recognizerRef.current) {
          setTimeout(() => {
            if (conversationSessionInstance.isSessionActive()) {
              recognizerRef.current?.start();
            }
          }, 300);
        }
      },
      onError: () => {
        isTTSActiveRef.current = false;
        setState((prev) => (prev.status === 'speaking' ? { ...prev, status: 'idle' } : prev));
        conversationSessionInstance.onAgentSpeechEnd();
      },
    });

    if (!success) {
      isTTSActiveRef.current = false;
      setSpeechWarning('Speech synthesis unavailable in this browser.');
      setTimeout(() => {
        setState((prev) => (prev.status === 'speaking' ? { ...prev, status: 'idle' } : prev));
      }, 2000);
    } else {
      setSpeechWarning(null);
    }
  }, [selectedPersona.genderPreference]);

  const handleResetIdle = () => {
    voiceEngine.stop();
    setState((prev) => ({
      ...prev,
      status: 'idle',
    }));
  };

  const handleSetActivity = useCallback((status: import('./types/persona').AvatarStatus) => {
    voiceEngine.stop();
    setState((prev) => ({ ...prev, status }));
  }, []);

  const handleEmotionChange = useCallback((emotion: Emotion) => {
    setState((prev) => ({
      ...prev,
      emotion,
      lastToolCall: {
        tool: 'set_expression() [WebMCP]',
        timestamp: new Date().toLocaleTimeString(),
        args: { emotion },
      },
    }));
  }, []);

  useEffect(() => {
    return () => {
      voiceEngine.stop();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    registerWebMcpTools(
      ({ text, emotion }) => {
        handleSpeak(text, emotion, 'WebMCP');
      },
      () => {
        const curr = stateRef.current;
        const pending = curr.pendingUserUtterance;
        const hasNewInput = Boolean(pending.trim());
        if (hasNewInput) {
          setState((prev) => ({
            ...prev,
            pendingUserUtterance: '',
          }));
        }
        return {
          transcript: pending,
          hasNewInput,
          utteranceId: curr.utteranceId,
          isListening: curr.isListening,
        };
      },
      (gesture) => {
        gesturePlayRef.current?.(gesture);
      },
      (expression) => {
        handleEmotionChange(expression);
      },
      (target) => {
        attentionChangeRef.current?.(target);
      }
    ).then((mcpStatus) => {
      if (isMounted) {
        setState((prev) => ({
          ...prev,
          webMcpAvailable: mcpStatus.available,
          webMcpRegistered: mcpStatus.registered,
        }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [handleSpeak, handleEmotionChange]);

  const deriveBehavioralState = (): { bState: import('./types/persona').AgentBehavioralState; attention: number; action: string } => {
    if (state.status === 'speaking') {
      return { bState: 'RESPONDING', attention: 96, action: 'Communicating speech response...' };
    }
    if (state.status === 'listening') {
      return { bState: 'LISTENING', attention: 92, action: 'Listening to human speech utterance...' };
    }
    if (state.status === 'agent_processing') {
      return { bState: 'THINKING', attention: 72, action: 'Reasoning about intent & memory...' };
    }
    const lastTool = state.lastToolCall?.tool || '';
    if (lastTool.includes('create_task')) {
      return { bState: 'PLANNING', attention: 88, action: 'Creating actionable mission task...' };
    }
    if (lastTool.includes('update_task') || lastTool.includes('complete_task')) {
      return { bState: 'EXECUTING', attention: 84, action: 'Adapting mission task state...' };
    }
    if (lastTool.includes('get_tasks')) {
      return { bState: 'EVALUATING', attention: 80, action: 'Evaluating mission progress...' };
    }
    if (lastTool.includes('show_result')) {
      return { bState: 'COMPLETED', attention: 95, action: 'Presenting structured result card...' };
    }
    return { bState: 'WAITING', attention: 90, action: 'Awaiting agent tool call or user input...' };
  };

  const bStateInfo = deriveBehavioralState();

  return (
    <div className="persona-app-container" data-theme={state.theme}>
      {/* DYNAMIC PERSONA BACKGROUND OVERLAY */}
      {selectedPersona.bgUrl && (
        <div
          className="persona-bg-layer"
          style={{ backgroundImage: `url(${selectedPersona.bgUrl})` }}
        />
      )}

      {/* TOP HEADER — GLASSMORPHIC BAR */}
      <header className="persona-header glassmorphic-bar">
        <div className="header-brand-left">
          <img src="/persona.png" alt="Persona Logo" className="brand-logo-img" />
          <div className="brand-text-group">
            <h1 className="brand-wordmark">PERSONA</h1>
            <span className="brand-subtext">EMBODIED WEBMCP AGENT</span>
          </div>
        </div>

        <div className="header-controls-right">
          {/* DARK / LIGHT MODE TOGGLE */}
          <button
            type="button"
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title="Toggle Light / Dark Mode"
          >
            <span className="theme-icon">{state.theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="theme-text">{state.theme === 'light' ? 'DARK MODE' : 'LIGHT MODE'}</span>
          </button>

          <div className={`connection-pill ${state.webMcpRegistered ? 'is-connected' : 'is-offline'}`}>
            <span className="status-dot">●</span>
            <span className="status-text">{state.webMcpRegistered ? 'WEBMCP CONNECTED' : 'WEBMCP OFFLINE'}</span>
            <span className="agent-badge">AGENTS ACTIVE</span>
          </div>
        </div>
      </header>

      {speechWarning && (
        <div className="speech-warning-banner">
          ⚠️ {speechWarning}
        </div>
      )}

      {/* MAIN WORKSPACE & CENTER STAGE */}
      <main className="persona-workspace">
        {/* BACKDROP FOR CLICK-OUTSIDE TO CLOSE DRAWERS */}
        {(isPersonasDrawerOpen || isAgentDrawerOpen) && (
          <div className="drawers-backdrop" onClick={handleCloseDrawers} />
        )}

        {/* LEFT COLLAPSIBLE SIDE DRAWER — PERSONAS */}
        <aside className={`side-drawer left-drawer ${isPersonasDrawerOpen ? 'is-expanded' : 'is-collapsed'}`}>
          {/* Collapsed Flap / Edge Tab */}
          {!isPersonasDrawerOpen && (
            <button
              type="button"
              className="drawer-edge-tab left-tab"
              onClick={togglePersonasDrawer}
              title="Open Personas"
            >
              <span className="tab-label">PERSONAS</span>
              <span className="tab-chevron">▶</span>
            </button>
          )}

          {/* Expanded Content */}
          <div className="drawer-inner-panel">
            <div className="drawer-header-bar">
              <h2 className="panel-title-tag">PERSONAS</h2>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsPersonasDrawerOpen(false)}
                title="Collapse Personas panel"
              >
                ◀
              </button>
            </div>

            <div className="personas-list-container">
              <div className="persona-section-group">
                <span className="persona-group-label">AVAILABLE</span>
                {PERSONAS.filter(p => p.status === 'available').map((p) => {
                  const isSelected = p.id === state.selectedPersonaId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`persona-item-btn ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectPersona(p)}
                    >
                      <div className="item-left">
                        <span className="item-bullet">▶</span>
                        <div className="item-text-stack">
                          <span className="item-mode">{p.mode}</span>
                          {p.subtitle && <span className="item-sub">{p.subtitle}</span>}
                        </div>
                      </div>
                      {isSelected && <span className="item-active-pill">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>

              <div className="persona-section-group">
                <span className="persona-group-label">COMING SOON</span>
                {PERSONAS.filter(p => p.status === 'coming-soon').map((p) => {
                  const isSelected = p.id === state.selectedPersonaId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`persona-item-btn is-coming-soon ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectPersona(p)}
                    >
                      <div className="item-left">
                        <span className="item-bullet">○</span>
                        <div className="item-text-stack">
                          <span className="item-mode">{p.mode}</span>
                          {p.subtitle && <span className="item-sub">{p.subtitle}</span>}
                        </div>
                      </div>
                      <span className="badge-coming-soon">SOON</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER — PERSONA HERO STAGE (DOMINANT AVATAR FOCUS) */}
        <section className="workspace-center-stage">
          <div className="persona-avatar-hero-container">
            {selectedPersona.modelUrl ? (
              <PersonaAvatar
                key={selectedPersona.modelUrl}
                modelUrl={selectedPersona.modelUrl}
                status={state.status}
                emotion={state.emotion}
                onValidationReport={setVrmReport}
                onGestureRef={(fn) => { gesturePlayRef.current = fn; }}
                onAttentionRef={(fn) => { attentionChangeRef.current = fn; }}
                onCameraRef={(api) => { setCameraApi(api as typeof cameraApi); }}
                onLightingRef={(api) => { setLightingApi(api as typeof lightingApi); }}
                onAvatarRef={(api) => { setAvatarApi(api as typeof avatarApi); }}
              />
            ) : (
              <div className="persona-coming-soon-hero">
                <div className="coming-soon-hero-badge">COMING SOON</div>
                <h2 className="coming-soon-hero-title">{selectedPersona.mode}</h2>
                <div className="coming-soon-hero-subtitle">{selectedPersona.name}</div>
                <p className="coming-soon-hero-desc">{selectedPersona.description}</p>
                <div className="coming-soon-hero-card-footer">
                  🎭 3D Avatar Model & Persona Mode Coming Soon
                </div>
              </div>
            )}

            {/* CHAT RESPONSE BUBBLE (POSITIONED SLIGHTLY DOWN & TO THE SIDE OF MODEL) */}
            {state.status === 'speaking' && (
              <div className="persona-response-bubble">
                <div className="bubble-arrow-left" />
                <div className="bubble-tag-header">
                  <span>PERSONA / SPEAKING</span>
                  <span className="bubble-emotion-tag">{state.emotion.toUpperCase()}</span>
                </div>
                <p className="bubble-text-content">"{state.dialogue}"</p>
              </div>
            )}

            {/* PRODUCTION CONVERSATION CONTROLS */}
            <ConversationControls
              sessionState={sessionState}
              onStartSession={handleStartConversation}
              onStopSession={handleStopConversation}
              micError={state.micError}
            />
          </div>
        </section>

        {/* RIGHT COLLAPSIBLE SIDE DRAWER — AGENT CAPABILITIES */}
        <aside className={`side-drawer right-drawer ${isAgentDrawerOpen ? 'is-expanded' : 'is-collapsed'}`}>
          {/* Collapsed Flap / Edge Tab */}
          {!isAgentDrawerOpen && (
            <button
              type="button"
              className="drawer-edge-tab right-tab"
              onClick={toggleAgentDrawer}
              title="Open Agent Capabilities"
            >
              <span className="tab-chevron">◀</span>
              <span className="tab-label">TOOLS</span>
            </button>
          )}

          {/* Expanded Content */}
          <div className="drawer-inner-panel">
            <div className="drawer-header-bar">
              <h2 className="panel-title-tag">AGENT CAPABILITIES</h2>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsAgentDrawerOpen(false)}
                title="Collapse Agent Capabilities panel"
              >
                ▶
              </button>
            </div>

            <div className="drawer-scroll-body">
              {/* AGENT MISSION & TASKS SYSTEM */}
              <AgentMissionPanel
                behavioralState={bStateInfo.bState}
                attentionPercentage={bStateInfo.attention}
                behavioralAction={bStateInfo.action}
                emotion={state.emotion}
              />

              <h2 className="panel-title-tag" style={{ marginTop: '12px' }}>WEBMCP TOOL REGISTRY (10)</h2>
              <div className="capabilities-stack">
                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">speak()</span>
                    {state.lastToolCall?.tool.includes('speak') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Make Persona speak with audio and emotion.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">get_user_transcript()</span>
                    {state.lastToolCall?.tool.includes('get_user_transcript') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Read latest human speech utterance.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">perform_gesture()</span>
                    {state.lastToolCall?.tool.includes('perform_gesture') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Trigger body gestures (nod, head tilt, lean, etc.).</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">set_expression()</span>
                    {state.lastToolCall?.tool.includes('set_expression') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Change facial expression and emotion.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">set_attention()</span>
                    {state.lastToolCall?.tool.includes('set_attention') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Direct avatar gaze and eye contact.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">create_task()</span>
                    {state.lastToolCall?.tool.includes('create_task') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Create actionable mission task item.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">update_task()</span>
                    {state.lastToolCall?.tool.includes('update_task') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Adapt task status, priority, or details.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">get_tasks()</span>
                    {state.lastToolCall?.tool.includes('get_tasks') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Retrieve current list of mission tasks.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">complete_task()</span>
                    {state.lastToolCall?.tool.includes('complete_task') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Mark a specific task as completed.</p>
                </div>

                <div className="capability-row">
                  <div className="cap-head">
                    <span className="cap-name">show_result()</span>
                    {state.lastToolCall?.tool.includes('show_result') && (
                      <span className="cap-badge-called">✓ CALLED</span>
                    )}
                  </div>
                  <p className="cap-desc">Present outcome summary & result card.</p>
                </div>
              </div>

              <div className="panel-card-mini agent-activity-block">
                <h2 className="panel-title-tag">AGENT ACTIVITY</h2>
                <div className="activity-feed">
                  {state.lastToolCall ? (
                    <div className="activity-item">
                      <span className="activity-time">{state.lastToolCall.timestamp}</span>
                      <div className="activity-tool-name">{state.lastToolCall.tool}</div>
                    </div>
                  ) : (
                    <div className="activity-placeholder">
                      Awaiting tool invocation...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* BOTTOM FOOTER — GLASSMORPHIC BAR */}
      <footer className="persona-footer glassmorphic-bar">
        <div className="footer-left-group">
          <button
            type="button"
            className="btn-settings-toggle"
            onClick={() => setIsManualOpen(!isManualOpen)}
            title="Settings & Avatar Calibration"
          >
            <span className="gear-icon">⚙</span>
            <span className="settings-text">Settings & Tuning</span>
          </button>

          {/* INLINE MICROPHONE TOGGLE FOR QUICK ACCESS */}
          <button
            type="button"
            className={`btn-mic-footer ${state.isListening ? 'is-active' : ''}`}
            onClick={handleToggleListening}
            title={state.isListening ? 'Stop listening' : 'Start speech recognition'}
          >
            {state.isListening ? '🔴 LISTENING...' : '🎙 START LISTENING'}
          </button>

          {/* USER SPEECH TRANSCRIPT DISPLAY */}
          {(state.userTranscript || state.interimTranscript || state.isListening) && (
            <div className="footer-transcript-pill">
              <span className="transcript-live-dot">
                {state.isListening ? '🔴 LIVE:' : '🎙️ USER:'}
              </span>
              <span className="transcript-text">
                "{state.interimTranscript || state.userTranscript}"
              </span>
              {state.pendingUserUtterance && (
                <span className="pending-utterance-badge">PENDING</span>
              )}
              {state.userTranscript && (
                <button
                  type="button"
                  className="btn-clear-transcript-mini"
                  onClick={handleClearTranscript}
                  title="Clear transcript"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        <div className="footer-right-group">
          {/* EXPRESSION BADGE (MOVED FROM TOP TO BOTTOM FOOTER) */}
          <div className="footer-expression-pill">
            <span className="expression-pill-icon">🎭</span>
            <span className="expression-pill-label">EXPRESSION:</span>
            <span className="expression-pill-val">{state.emotion.toUpperCase()}</span>
          </div>

          <div className="footer-turn-status">
            <span className={`live-status-dot status-${state.status}`}>
              {state.status === 'speaking'
                ? '● SPEAKING'
                : state.status === 'listening'
                ? '🔴 LISTENING'
                : state.status === 'user_finished'
                ? '✓ USER FINISHED'
                : state.status === 'agent_processing'
                ? '⚙ AGENT THINKING'
                : '● IDLE'}
            </span>
          </div>
        </div>
      </footer>

      {/* TUNING & DEV CONTROLS DRAWER MODAL */}
      {isManualOpen && (
        <div className="mc-drawer-overlay" onClick={() => setIsManualOpen(false)}>
          <div className="mc-drawer" onClick={e => e.stopPropagation()}>
            <div className="mc-drawer-header">
              <span>⚙ AVATAR TUNING & DEV CONTROLS</span>
              <button type="button" className="mc-drawer-close" onClick={() => setIsManualOpen(false)}>×</button>
            </div>
            <div className="mc-drawer-body">
              <ManualControls
                onManualSpeak={(text, emotion) => handleSpeak(text, emotion, 'Manual')}
                onResetIdle={handleResetIdle}
                onSetActivity={handleSetActivity}
                onPlayGesture={(name) => gesturePlayRef.current?.(name)}
                currentEmotion={state.emotion}
                currentStatus={state.status}
                vrmReport={vrmReport}
                cameraApi={cameraApi as Parameters<typeof ManualControls>[0]['cameraApi']}
                lightingApi={lightingApi as Parameters<typeof ManualControls>[0]['lightingApi']}
                avatarApi={avatarApi as Parameters<typeof ManualControls>[0]['avatarApi']}
              />
            </div>
          </div>
        </div>
      )}

      {/* LIGHTWEIGHT CONVERSATION TRANSCRIPT OVERLAY */}
      <ConversationTranscript turns={transcriptTurns} />

      {/* DEV MOCK AGENT OVERLAY (Only enabled when VITE_ENABLE_MOCK_AGENT=true — never in production) */}
      {import.meta.env.VITE_ENABLE_MOCK_AGENT === 'true' && (
        <MockAgentConsole />
      )}
    </div>
  );
}
