import React from 'react';

interface MicControlProps {
  isListening: boolean;
  userTranscript: string;
  micError: string | null;
  supported: boolean;
  onToggleListening: () => void;
  onClearTranscript: () => void;
}

export const MicControl: React.FC<MicControlProps> = ({
  isListening,
  userTranscript,
  micError,
  supported,
  onToggleListening,
  onClearTranscript,
}) => {
  return (
    <div className="mic-brutalist-card">
      <div className="mic-card-header">
        <span className="mic-mono-tag">HUMAN VOICE INPUT</span>
        {userTranscript && (
          <button
            type="button"
            className="btn-clear-link"
            onClick={onClearTranscript}
          >
            CLEAR
          </button>
        )}
      </div>

      {!supported && (
        <div className="mic-alert-warning">
          ⚠️ Speech Recognition API unavailable.
        </div>
      )}

      {micError && (
        <div className="mic-alert-error">
          ⚠️ {micError}
        </div>
      )}

      <div className="mic-controls-row">
        <button
          type="button"
          className={`btn-mic-toggle ${isListening ? 'is-active' : ''}`}
          onClick={onToggleListening}
          disabled={!supported}
        >
          {isListening ? '🔴 LISTENING...' : '🎙 START LISTENING'}
        </button>
      </div>
    </div>
  );
};
