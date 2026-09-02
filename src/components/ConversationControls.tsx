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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        margin: '16px 0',
        zIndex: 10,
      }}
    >
      {/* ERROR DISPLAY */}
      {micError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          ⚠️ {micError}
        </div>
      )}

      {/* ACTIVE SESSION STATUS BADGE */}
      {isSessionActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '10px 20px',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {sessionState === 'REQUESTING_MIC' && (
            <span style={{ color: '#fba518', fontWeight: 600, fontSize: '14px' }}>
              🟡 Requesting Microphone Access...
            </span>
          )}

          {sessionState === 'LISTENING' && (
            <>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 10px #ef4444',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>
                Listening... <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>"Speak naturally"</span>
              </span>
            </>
          )}

          {sessionState === 'PROCESSING' && (
            <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '14px' }}>
              • • • Thinking...
            </span>
          )}

          {sessionState === 'SPEAKING' && (
            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
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
          style={{
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '32px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🎙 Start Conversation
        </button>
      ) : (
        <button
          type="button"
          onClick={onStopSession}
          aria-label="Stop conversation"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '32px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ⏹ Stop Conversation
        </button>
      )}

      {!isSessionActive && (
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
          Talk naturally with Persona • Continuous Session
        </span>
      )}
    </div>
  );
};
