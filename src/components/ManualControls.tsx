import React, { useState } from 'react';
import type { Emotion } from '../types/persona';

interface ManualControlsProps {
  onManualSpeak: (text: string, emotion: Emotion) => void;
  onResetIdle: () => void;
  currentEmotion: Emotion;
}

const EMOTIONS: { key: Emotion; label: string }[] = [
  { key: 'neutral', label: 'Neutral' },
  { key: 'warm', label: 'Warm' },
  { key: 'skeptical', label: 'Skeptical' },
  { key: 'impressed', label: 'Impressed' },
  { key: 'stern', label: 'Stern' },
];

export const ManualControls: React.FC<ManualControlsProps> = ({
  onManualSpeak,
  onResetIdle,
  currentEmotion,
}) => {
  const [text, setText] = useState('Good morning. Tell me about your background.');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>(currentEmotion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onManualSpeak(text.trim(), selectedEmotion);
    }
  };

  return (
    <div className="manual-controls-panel">
      <div className="manual-controls-header">
        <span className="manual-tag">DEV TOOL</span>
        <h3>Manual Fallback Control</h3>
      </div>
      <p className="manual-desc">
        Test webpage state changes manually without WebMCP / ChatGPT.
      </p>

      <form onSubmit={handleSubmit} className="manual-form">
        <div className="form-group">
          <label className="form-label">Select Emotion:</label>
          <div className="emotion-buttons">
            {EMOTIONS.map((emp) => (
              <button
                key={emp.key}
                type="button"
                className={`emotion-btn btn-${emp.key} ${selectedEmotion === emp.key ? 'active' : ''}`}
                onClick={() => setSelectedEmotion(emp.key)}
              >
                {emp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="manual-text-input" className="form-label">
            Dialogue Text:
          </label>
          <input
            id="manual-text-input"
            type="text"
            className="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type text for the avatar to speak..."
          />
        </div>

        <div className="button-row">
          <button type="submit" className="btn-primary">
            Test speak() manually
          </button>
          <button type="button" className="btn-secondary" onClick={onResetIdle}>
            Reset to Idle
          </button>
        </div>
      </form>
    </div>
  );
};
