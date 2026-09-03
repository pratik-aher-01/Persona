import React, { useState, useEffect } from 'react';
import { Wrench, X, Check } from 'lucide-react';
import { mockAgentInstance } from './MockAgent';
import type { AgentStatus } from './MockAgent';

export const MockAgentConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'memory' | 'events' | 'tests'>('pipeline');
  const [agentState, setAgentState] = useState(mockAgentInstance.getState());

  useEffect(() => {
    const unsubscribe = mockAgentInstance.subscribe(() => {
      setAgentState(mockAgentInstance.getState());
    });
    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'listening':
        return <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>● LISTENING</span>;
      case 'thinking':
        return <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>● THINKING</span>;
      case 'acting':
        return <span style={{ background: '#8b5cf6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>● ACTING</span>;
      case 'speaking':
        return <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>● SPEAKING</span>;
      default:
        return <span style={{ background: '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>● IDLE</span>;
    }
  };

  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999 }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '8px',
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Wrench size={14} /> DEVELOPMENT — MOCK AGENT
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '420px',
        maxHeight: '620px',
        background: '#0f172a',
        color: '#f8fafc',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(90deg, #1e293b, #0f172a)',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={14} /> DEVELOPMENT — MOCK AGENT
          </span>
          {getStatusBadge(agentState.status)}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Control Toolbar */}
      <div
        style={{
          padding: '8px 12px',
          background: '#1e293b',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => mockAgentInstance.setActive(!agentState.isActive)}
          style={{
            background: agentState.isActive ? '#059669' : '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {agentState.isActive ? 'Agent Active' : 'Agent Stopped'}
        </button>

        <button
          onClick={() => mockAgentInstance.setMode(agentState.mode === 'automatic' ? 'manual' : 'automatic')}
          style={{
            background: '#334155',
            color: '#38bdf8',
            border: '1px solid #475569',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          Mode: {agentState.mode.toUpperCase()}
        </button>

        {agentState.mode === 'manual' && (
          <button
            onClick={() => mockAgentInstance.processTurn()}
            disabled={!agentState.lastUserUtterance}
            style={{
              background: '#8b5cf6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: agentState.lastUserUtterance ? 'pointer' : 'not-allowed',
              opacity: agentState.lastUserUtterance ? 1 : 0.5,
              fontWeight: 600,
            }}
          >
            Process Turn
          </button>
        )}

        <button
          onClick={() => mockAgentInstance.runDemoScript()}
          style={{
            background: 'linear-gradient(90deg, #d97706, #b45309)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Run Demo
        </button>

        <button
          onClick={() => mockAgentInstance.clearMemory()}
          style={{
            background: '#475569',
            color: '#cbd5e1',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {(['pipeline', 'memory', 'events', 'tests'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '6px 0',
              background: activeTab === tab ? '#1e293b' : 'transparent',
              color: activeTab === tab ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #38bdf8' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '10px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* PIPELINE TAB */}
        {activeTab === 'pipeline' && (
          <>
            <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px' }}>
              <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600 }}>LAST USER TRANSCRIPT</div>
              <div style={{ color: '#e2e8f0', marginTop: '2px', fontStyle: agentState.lastUserUtterance ? 'normal' : 'italic' }}>
                {agentState.lastUserUtterance ? `"${agentState.lastUserUtterance}"` : 'No transcript recorded yet.'}
              </div>
            </div>

            {agentState.currentDecision && (
              <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ color: '#f59e0b', fontSize: '10px', fontWeight: 700 }}>AGENT DECISION & REASONING</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Intent:</span> {agentState.currentDecision.intent}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Emotion:</span> {agentState.currentDecision.emotion}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Expression:</span> {agentState.currentDecision.expression}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Gesture:</span> {agentState.currentDecision.gesture}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Gaze Target:</span> {agentState.currentDecision.attention}
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px' }}>
              <div style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700, marginBottom: '6px' }}>WEBMCP TOOL EXECUTION LOG</div>
              {agentState.toolLogs.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>No tool executions yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                  {agentState.toolLogs.map((log, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#0f172a',
                        padding: '6px',
                        borderRadius: '4px',
                        borderLeft: log.success ? '3px solid #10b981' : '3px solid #ef4444',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#e2e8f0' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} style={{ color: '#10b981' }} /> WebMCP.{log.tool}()
                        </span>
                        <span style={{ color: '#64748b', fontSize: '10px' }}>{log.timestamp}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px', wordBreak: 'break-word' }}>
                        Input: {JSON.stringify(log.args)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}


        {/* MEMORY TAB */}
        {activeTab === 'memory' && (
          <>
            <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px' }}>
              <div style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>KNOWN FACTS</div>
              {Object.keys(agentState.memory.facts).length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>No structured facts stored yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(agentState.memory.facts).map(([k, v]) => (
                    <div key={k} style={{ background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>
                      <strong style={{ color: '#f59e0b' }}>{k}:</strong> <span style={{ color: '#f8fafc' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px' }}>
              <div style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>CONVERSATION TURNS</div>
              {agentState.memory.turns.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>No conversation turns yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {agentState.memory.turns.map((t) => (
                    <div key={t.id} style={{ background: t.role === 'user' ? '#1e1b4b' : '#064e3b', padding: '6px', borderRadius: '4px' }}>
                      <strong style={{ color: t.role === 'user' ? '#818cf8' : '#34d399' }}>{t.role.toUpperCase()}:</strong>{' '}
                      <span style={{ color: '#f1f5f9' }}>{t.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px' }}>
            <div style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700, marginBottom: '6px' }}>CHRONOLOGICAL EVENT LOG</div>
            {agentState.eventLogs.length === 0 ? (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>No events recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
                {agentState.eventLogs.map((ev) => (
                  <div key={ev.id} style={{ background: '#0f172a', padding: '4px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    <span style={{ color: '#64748b', marginRight: '6px' }}>{ev.timestamp}</span>
                    <strong style={{ color: '#38bdf8', marginRight: '6px' }}>[{ev.type}]</strong>
                    <span style={{ color: '#cbd5e1' }}>{ev.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TESTS TAB */}
        {activeTab === 'tests' && (
          <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px' }}>
            <div style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700, marginBottom: '6px' }}>TEST ASSERTIONS CHECKLIST</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
              {agentState.assertions.map((a) => (
                <div key={a.id} style={{ background: '#0f172a', padding: '6px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{a.name}</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 700,
                        background: a.status === 'passed' ? '#10b981' : a.status === 'failed' ? '#ef4444' : '#f59e0b',
                        color: '#fff',
                      }}
                    >
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>{a.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
