import React, { useState } from 'react';
import { User, Bot, EyeOff, MessageSquare } from 'lucide-react';

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'persona';
  text: string;
  timestamp: string;
}

interface ConversationTranscriptProps {
  turns: TranscriptTurn[];
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({ turns }) => {
  const [isHidden, setIsHidden] = useState(false);

  if (turns.length === 0) return null;

  if (isHidden) {
    return (
      <button
        type="button"
        onClick={() => setIsHidden(false)}
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '6px 14px',
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          zIndex: 99,
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          transition: 'all 0.2s ease',
        }}
        title="Click to show conversation history"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.95)';
          e.currentTarget.style.color = '#f8fafc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <MessageSquare size={13} style={{ color: '#38bdf8' }} />
        <span>History</span>
        <span
          style={{
            background: 'rgba(56, 189, 248, 0.2)',
            color: '#38bdf8',
            borderRadius: '10px',
            padding: '1px 6px',
            fontSize: '10px',
            fontWeight: 700,
          }}
        >
          {turns.length}
        </span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        bottom: '20px',
        width: '320px',
        maxHeight: '260px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        zIndex: 99,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '4px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            color: '#94a3b8',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <MessageSquare size={12} style={{ color: '#38bdf8' }} />
          <span>Conversation History</span>
        </div>
        <button
          type="button"
          onClick={() => setIsHidden(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f8fafc';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'transparent';
          }}
          title="Hide history"
        >
          <EyeOff size={12} />
          <span>Hide</span>
        </button>
      </div>
      {turns.slice(-6).map((turn) => (
        <div
          key={turn.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            background: turn.role === 'user' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(6, 78, 59, 0.6)',
            padding: '6px 10px',
            borderRadius: '8px',
            borderLeft: turn.role === 'user' ? '3px solid #38bdf8' : '3px solid #10b981',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600 }}>
            <span style={{ color: turn.role === 'user' ? '#38bdf8' : '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {turn.role === 'user' ? <User size={11} /> : <Bot size={11} />}
              {turn.role === 'user' ? 'You' : 'Persona'}
            </span>
            <span style={{ color: '#64748b' }}>{turn.timestamp}</span>
          </div>
          <div style={{ color: '#f8fafc', lineHeight: 1.4 }}>{turn.text}</div>
        </div>
      ))}
    </div>
  );
};


