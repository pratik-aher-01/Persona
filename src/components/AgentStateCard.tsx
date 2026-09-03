import React from 'react';
import type { AgentBehavioralState, Emotion } from '../types/persona';

interface AgentStateCardProps {
  behavioralState: AgentBehavioralState;
  attentionPercentage: number;
  behavioralAction: string;
  emotion: Emotion;
}

export const AgentStateCard: React.FC<AgentStateCardProps> = ({
  behavioralState,
  attentionPercentage,
  behavioralAction,
  emotion,
}) => {
  const getStatePillClass = (bState: AgentBehavioralState) => {
    switch (bState) {
      case 'RESPONDING':
        return 'state-responding';
      case 'THINKING':
      case 'PLANNING':
        return 'state-thinking';
      case 'EXECUTING':
      case 'EVALUATING':
        return 'state-executing';
      case 'COMPLETED':
        return 'state-completed';
      case 'LISTENING':
        return 'state-listening';
      default:
        return 'state-waiting';
    }
  };

  return (
    <div className="agent-state-card glassmorphic-card">
      <div className="state-card-header">
        <div className="state-pill-group">
          <span className={`behavior-pill ${getStatePillClass(behavioralState)}`}>
            ● {behavioralState}
          </span>
          <span className="mood-badge">MOOD: {emotion.toUpperCase()}</span>
        </div>
      </div>

      <div className="state-metrics-row">
        <div className="metric-item">
          <span className="metric-label">ATTENTION</span>
          <div className="attention-bar-wrapper">
            <div
              className="attention-bar-fill"
              style={{ width: `${attentionPercentage}%` }}
            />
          </div>
          <span className="metric-value">{attentionPercentage}%</span>
        </div>
      </div>

      <div className="state-action-line">
        <span className="action-bullet">→</span>
        <span className="action-text">{behavioralAction}</span>
      </div>
    </div>
  );
};
