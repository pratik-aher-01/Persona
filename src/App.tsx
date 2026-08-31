import { useEffect, useState, useCallback, useRef } from 'react';
import { Avatar2D } from './components/Avatar2D';
import { ManualControls } from './components/ManualControls';
import { MicControl } from './components/MicControl';
import { registerWebMcpTools } from './webmcp/registerTools';
import { speakUtterance, stopSpeech } from './utils/speech';
import { isSpeechRecognitionSupported, SpeechRecognizer } from './utils/stt';
import type { DemoState, Emotion } from './types/persona';
import './App.css';

export default function App() {
  const [state, setState] = useState<DemoState>({
    status: 'idle',
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
  });
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const handleToggleListening = useCallback(() => {
    setState((prev) => {
      if (prev.isListening) {
        if (recognizerRef.current) {
          recognizerRef.current.stop();
        }
        return {
          ...prev,
          isListening: false,
          interimTranscript: '',
        };
      }

      if (!isSpeechRecognitionSupported()) {
        return {
          ...prev,
          micError: 'Speech Recognition API is unavailable in this browser.',
        };
      }

      const recognizer = new SpeechRecognizer(
        (interimText) => {
          setState((p) => ({ ...p, interimTranscript: interimText }));
        },
        (finalText) => {
          setState((p) => {
            const nextId = p.utteranceId + 1;
            return {
              ...p,
              userTranscript: p.userTranscript
                ? `${p.userTranscript} ${finalText}`
                : finalText,
              pendingUserUtterance: finalText,
              utteranceId: nextId,
              interimTranscript: '',
            };
          });
        },
        (listening) => {
          setState((p) => ({
            ...p,
            isListening: listening,
            ...(listening ? { micError: null } : { interimTranscript: '' }),
          }));
        },
        (errorMsg) => {
          setState((p) => ({
            ...p,
            micError: errorMsg,
            isListening: false,
            interimTranscript: '',
          }));
        }
      );

      recognizerRef.current = recognizer;
      const started = recognizer.start();

      if (!started) {
        return {
          ...prev,
          micError: 'Failed to start speech recognition.',
          isListening: false,
        };
      }

      return {
        ...prev,
        micError: null,
      };
    });
  }, []);

  const handleClearTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      userTranscript: '',
      pendingUserUtterance: '',
      utteranceId: 0,
      interimTranscript: '',
    }));
  }, []);

  const handleSpeak = useCallback((text: string, emotion: Emotion, source: 'WebMCP' | 'Manual' = 'WebMCP') => {
    // Stop active microphone recognition to prevent Persona's audio from being captured as input
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

    const success = speakUtterance(
      text,
      emotion,
      () => {
        setState((prev) => ({ ...prev, status: 'speaking', isListening: false }));
      },
      () => {
        setState((prev) => ({ ...prev, status: 'idle' }));
      },
      () => {
        setState((prev) => ({ ...prev, status: 'idle' }));
      }
    );

    if (!success) {
      setSpeechWarning('Speech synthesis unavailable in this browser.');
      setTimeout(() => {
        setState((prev) => ({ ...prev, status: 'idle' }));
      }, 2000);
    } else {
      setSpeechWarning(null);
    }
  }, []);

  const handleResetIdle = () => {
    stopSpeech();
    setState((prev) => ({
      ...prev,
      status: 'idle',
    }));
  };

  useEffect(() => {
    return () => {
      stopSpeech();
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
        return {
          transcript: curr.pendingUserUtterance,
          hasNewInput: Boolean(curr.pendingUserUtterance.trim()),
          utteranceId: curr.utteranceId,
          isListening: curr.isListening,
        };
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
  }, [handleSpeak]);

  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-logo">🎭</span>
          <div className="brand-titles">
            <h1 className="brand-title">Persona</h1>
            <span className="brand-subtitle">WebMCP Connection Test</span>
          </div>
        </div>

        {/* WebMCP Connection Status Banner */}
        <div
          className={`webmcp-status-banner ${
            state.webMcpRegistered
              ? 'status-registered'
              : state.webMcpAvailable
              ? 'status-available'
              : 'status-unavailable'
          }`}
        >
          <span className="status-dot">●</span>
          {state.webMcpRegistered
            ? 'WebMCP Tools "speak" & "get_user_transcript" Registered'
            : state.webMcpAvailable
            ? 'WebMCP API Detected'
            : 'WebMCP unavailable in this browser (Manual mode active)'}
        </div>

        {speechWarning && (
          <div className="speech-warning-banner">
            ⚠️ {speechWarning}
          </div>
        )}
      </header>

      <main className="app-main">
        {/* Central Display Container */}
        <div className="avatar-stage-card">
          {/* Avatar Graphic */}
          <Avatar2D status={state.status} emotion={state.emotion} />

          {/* Dialogue Speech Box */}
          <div className="dialogue-box">
            <div className="dialogue-label">Spoken Dialogue:</div>
            <p className="dialogue-text">"{state.dialogue}"</p>
          </div>

          {/* Last Tool Invocation Logger */}
          <div className="action-log-box">
            <div className="action-log-header">
              <span className="log-title">Last WebMCP Action</span>
              {state.lastToolCall && (
                <span className="log-time">{state.lastToolCall.timestamp}</span>
              )}
            </div>
            {state.lastToolCall ? (
              <div className="log-details">
                <div className="log-tool-name">{state.lastToolCall.tool}</div>
                <pre className="log-json">
                  {JSON.stringify(state.lastToolCall.args, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="log-empty">No tool invocations recorded yet.</div>
            )}
          </div>
        </div>

        {/* Development Manual Test Control Panel */}
        <ManualControls
          onManualSpeak={(text, emotion) => handleSpeak(text, emotion, 'Manual')}
          onResetIdle={handleResetIdle}
          currentEmotion={state.emotion}
        />

        {/* Human Microphone & Speech Recognition Panel */}
        <MicControl
          isListening={state.isListening}
          userTranscript={state.userTranscript}
          pendingUserUtterance={state.pendingUserUtterance}
          utteranceId={state.utteranceId}
          interimTranscript={state.interimTranscript}
          micError={state.micError}
          supported={isSpeechRecognitionSupported()}
          onToggleListening={handleToggleListening}
          onClearTranscript={handleClearTranscript}
        />
      </main>

      <footer className="app-footer">
        <span>Persona WebMCP Proof of Concept — Phase 3B</span>
      </footer>
    </div>
  );
}

