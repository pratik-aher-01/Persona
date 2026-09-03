import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, Circle, Target } from 'lucide-react';
import { taskStore } from '../tasks/taskStore';
import type { TaskItem, TaskPriority, TaskStatus } from '../tasks/taskTypes';
import type { AgentBehavioralState, Emotion } from '../types/persona';
import { ResultDisplayCard } from './ResultDisplayCard';
import { AgentStateCard } from './AgentStateCard';

interface AgentMissionPanelProps {
  behavioralState?: AgentBehavioralState;
  attentionPercentage?: number;
  behavioralAction?: string;
  emotion?: Emotion;
}

export const AgentMissionPanel: React.FC<AgentMissionPanelProps> = ({
  behavioralState = 'WAITING',
  attentionPercentage = 92,
  behavioralAction = 'Awaiting agent or human action...',
  emotion = 'neutral',
}) => {
  const [missionState, setMissionState] = useState(taskStore.getState());

  useEffect(() => {
    return taskStore.subscribe(() => {
      setMissionState(taskStore.getState());
    });
  }, []);

  const progress = taskStore.getProgressPercentage();
  const tasks = missionState.tasks;
  const activeResult = missionState.activeResult;

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <span className="status-icon icon-completed" title="Completed"><CheckCircle2 size={16} style={{ color: '#10b981' }} /></span>;
      case 'in_progress':
        return <span className="status-icon icon-progress" title="In Progress"><Clock size={16} style={{ color: '#f59e0b' }} /></span>;
      case 'cancelled':
        return <span className="status-icon icon-cancelled" title="Cancelled"><XCircle size={16} style={{ color: '#ef4444' }} /></span>;
      default:
        return <span className="status-icon icon-pending" title="Pending"><Circle size={16} style={{ color: '#94a3b8' }} /></span>;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const pClass = `priority-${priority}`;
    return <span className={`priority-badge ${pClass}`}>{priority.toUpperCase()}</span>;
  };

  return (
    <div className="agent-mission-panel">
      {/* AGENT BEHAVIORAL STATE INDICATOR */}
      <AgentStateCard
        behavioralState={behavioralState}
        attentionPercentage={attentionPercentage}
        behavioralAction={behavioralAction}
        emotion={emotion}
      />

      {/* PANEL HEADER */}
      <div className="mission-panel-header">
        <div className="mission-header-left">
          <span className="mission-title-tag">AGENT MISSION</span>
          <h3 className="mission-main-title">{missionState.title}</h3>
        </div>
        {tasks.length > 0 && (
          <button
            type="button"
            className="btn-clear-mission"
            onClick={() => taskStore.clearMission()}
            title="Reset Mission"
          >
            Reset
          </button>
        )}
      </div>

      {/* MISSION PROGRESS BAR */}
      <div className="mission-progress-block">
        <div className="progress-label-row">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-percentage">{progress}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ACTIVE RESULT CARD (If available) */}
      {activeResult && <ResultDisplayCard result={activeResult} />}

      {/* TASKS LIST */}
      <div className="mission-tasks-block">
        <div className="tasks-block-header">
          <span className="tasks-count-label">TASKS ({tasks.length})</span>
        </div>

        {tasks.length === 0 ? (
          <div className="mission-empty-state">
            <Target size={28} className="empty-icon" style={{ color: '#6366f1', marginBottom: '8px' }} />
            <p className="empty-text">
              No active mission tasks. The AI Agent can create and manage actionable tasks during your interaction.
            </p>
          </div>
        ) : (
          <div className="tasks-scroll-list">
            {tasks.map((task: TaskItem) => (
              <div key={task.id} className={`task-item-card status-${task.status}`}>
                <div className="task-item-main">
                  {getStatusIcon(task.status)}
                  <div className="task-info">
                    <span className={`task-title ${task.status === 'completed' ? 'is-completed' : ''}`}>
                      {task.title}
                    </span>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                  </div>
                  {getPriorityBadge(task.priority)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

