import React from 'react';

interface MicControlProps {
  isListening: boolean;
  userTranscript: string;
  pendingUserUtterance: string;
  utteranceId: number;
  interimTranscript: string;
  micError: string | null;
  supported: boolean;
  onToggleListening: () => void;
  onClearTranscript: () => void;
}

export const MicControl: React.FC<MicControlProps> = ({
  isListening,
  userTranscript,
  pendingUserUtterance,
  utteranceId,
  interimTranscript,
  micError,
  supported,
  onToggleListening,
  onClearTranscript,
}) => {
  return (
    <div className="mic-control-panel">
      <div className="mic-control-header">
        <span className="mic-tag">SPEECH-TO-TEXT</span>
        <h3>Human Voice Input (Microphone)</h3>
      </div>
      <p className="mic-desc">
        Speak into your microphone to test browser Web Speech Recognition.
      </p>

      {!supported && (
        <div className="mic-warning">
          ⚠️ Speech Recognition API is unavailable in this browser.
        </div>
      )}

      {micError && (
        <div className="mic-error">
          ⚠️ {micError}
        </div>
      )}

      <div className="mic-action-row">
        <button
          type="button"
          className={`btn-mic ${isListening ? 'listening' : ''}`}
          onClick={onToggleListening}
          disabled={!supported}
        >
          {isListening ? '🔴 Stop Listening' : '🎙️ Start Listening'}
        </button>

        {userTranscript && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onClearTranscript}
          >
            Clear User Transcript
          </button>
        )}
      </div>

      {/* Transcript Display Box */}
      <div className="user-transcript-box">
        <div className="transcript-label">User Said (History):</div>
        {userTranscript ? (
          <p className="user-transcript-text">"{userTranscript}"</p>
        ) : (
          <p className="user-transcript-empty">
            {isListening
              ? 'Listening for speech...'
              : 'No user speech captured yet. Click "Start Listening" to speak.'}
          </p>
        )}

        {pendingUserUtterance && (
          <div className="pending-utterance-box">
            <div className="pending-label">
              <span>Latest Utterance (Agent Queue):</span>
              <span className="utterance-id-badge">ID: #{utteranceId}</span>
            </div>
            <p className="pending-text">"{pendingUserUtterance}"</p>
          </div>
        )}

        {/* Interim Speech Stream */}
        {isListening && interimTranscript && (
          <div className="interim-transcript-row">
            <span className="interim-label">Hearing:</span>
            <span className="interim-text">"{interimTranscript}..."</span>
          </div>
        )}
      </div>
    </div>
  );
};
