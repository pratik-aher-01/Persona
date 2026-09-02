import React from 'react';
import type { SessionState } from '../session/ConversationSession';

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
          ⚠️ {micError}
        </div>
      )}

      {/* ACTIVE SESSION STATUS BADGE */}
      {isSessionActive && (
        <div className="conv-session-status-badge">
          {sessionState === 'REQUESTING_MIC' && (
            <span className="conv-status-text text-warning">
              🟡 Requesting Microphone Access...
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
            <span className="conv-status-text text-info">
              • • • Thinking...
            </span>
          )}

          {sessionState === 'SPEAKING' && (
            <span className="conv-status-text text-success">
              🔊 Persona Speaking...
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
          <span className="btn-conv-icon">🎙</span>
          <span>Start Conversation</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onStopSession}
          aria-label="Stop conversation"
          className="btn-stop-conversation-corner"
        >
          <span>⏹</span>
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

