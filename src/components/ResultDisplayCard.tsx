import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import type { ResultObject } from '../tasks/taskTypes';
import { taskStore } from '../tasks/taskStore';

interface ResultDisplayCardProps {
  result: ResultObject;
}

export const ResultDisplayCard: React.FC<ResultDisplayCardProps> = ({ result }) => {
  const getTypeBadgeClass = (type: ResultObject['type']) => {
    switch (type) {
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'error':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  const getTypeIcon = (type: ResultObject['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'error':
        return <XCircle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  return (
    <div className={`result-card-container ${getTypeBadgeClass(result.type)}`}>
      <div className="result-card-header">
        <div className="result-title-group">
          <span className="result-type-icon">{getTypeIcon(result.type)}</span>
          <span className="result-tag-label">ACTIVE RESULT</span>
          <span className={`result-type-pill ${getTypeBadgeClass(result.type)}`}>
            {result.type.toUpperCase()}
          </span>
        </div>
        <button
          type="button"
          className="result-dismiss-btn"
          onClick={() => taskStore.dismissResult()}
          title="Dismiss Result"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={14} />
        </button>
      </div>

      <h3 className="result-card-title">{result.title}</h3>

      <div className="result-card-summary">
        <p>{result.summary}</p>
      </div>

      {result.data && Object.keys(result.data).length > 0 && (
        <div className="result-card-data-block">
          <div className="data-block-label">STRUCTURED OUTCOME DATA</div>
          <pre className="result-json-view">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="result-card-footer">
        <span className="result-timestamp">Generated at {new Date(result.createdAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

