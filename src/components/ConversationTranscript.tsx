import React from 'react';
import { User, Bot } from 'lucide-react';

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
  if (turns.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        bottom: '20px',
        width: '320px',
        maxHeight: '260px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
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
      <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Conversation History
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

