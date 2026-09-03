import React from 'react';
import type { SessionState } from '../session/ConversationSession';
import { AlertTriangle, Loader2, Volume2, Brain, Mic, Square } from 'lucide-react';

interface ConversationControlsProps {
  sessionState: SessionState;
  onStartSession: () => void;
  onStopSession: () => void;
  micError?: string | null;
}

export const ConversationControls: React.FC<ConversationControlsProps> = ({
  sessionState,
  onStartSession,
  onStopSession,
  micError,
}) => {
  const isSessionActive = ['REQUESTING_MIC', 'LISTENING', 'PROCESSING', 'SPEAKING'].includes(sessionState);

  return (
    <div className="conversation-controls-widget">
      {/* ERROR DISPLAY */}
      {micError && (
        <div className="conv-mic-error-banner">
          <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
          {micError}
        </div>
      )}

      {/* ACTIVE SESSION STATUS BADGE */}
      {isSessionActive && (
        <div className="conv-session-status-badge">
          {sessionState === 'REQUESTING_MIC' && (
            <span className="conv-status-text text-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={14} className="animate-spin" />
              Requesting Microphone Access...
            </span>
          )}

          {sessionState === 'LISTENING' && (
            <>
              <span className="conv-pulse-dot" />
              <span className="conv-status-text">
                Listening... <span className="conv-sub-hint">"Speak naturally"</span>
              </span>
            </>
          )}

          {sessionState === 'PROCESSING' && (
            <span className="conv-status-text text-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Brain size={14} className="animate-pulse" />
              Thinking...
            </span>
          )}

          {sessionState === 'SPEAKING' && (
            <span className="conv-status-text text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={14} />
              Persona Speaking...
            </span>
          )}
        </div>
      )}

      {/* START / STOP ACTION BUTTONS */}
      {!isSessionActive ? (
        <button
          type="button"
          onClick={onStartSession}
          aria-label="Start conversation"
          className="btn-start-conversation-corner"
        >
          <span className="btn-conv-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Mic size={18} />
          </span>
          <span>Start Conversation</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onStopSession}
          aria-label="Stop conversation"
          className="btn-stop-conversation-corner"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Square size={14} fill="currentColor" />
          </span>
          <span>Stop Conversation</span>
        </button>
      )}

      {!isSessionActive && (
        <span className="conv-hint-label">
          Talk naturally • Continuous Session
        </span>
      )}
    </div>
  );
};


