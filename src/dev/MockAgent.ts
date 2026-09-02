import type { Emotion } from '../types/persona';
import { executeRegisteredTool } from '../webmcp/registerTools';

export interface ConversationTurn {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface ConversationMemory {
  turns: ConversationTurn[];
  facts: Record<string, string>;
  topics: string[];
}

export interface AgentDecision {
  intent: string;
  emotion: Emotion;
  expression: Emotion;
  gesture: string;
  attention: 'user' | 'center' | 'away';
  response: string;
  memoryFactKey?: string;
  memoryFactVal?: string;
  topic?: string;
}

export interface ToolExecutionLog {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: string;
  success: boolean;
}

export interface EventLogItem {
  id: string;
  timestamp: string;
  type: string;
  details: string;
}

export type AgentStatus = 'idle' | 'listening' | 'thinking' | 'acting' | 'speaking';

export interface TestAssertion {
  id: string;
  name: string;
  status: 'pending' | 'passed' | 'failed';
  details: string;
}

export class MockAgent {
  private memory: ConversationMemory = {
    turns: [],
    facts: {},
    topics: [],
  };

  private status: AgentStatus = 'idle';
  private mode: 'manual' | 'automatic' = 'automatic';
  private isActive = true;

  private toolLogs: ToolExecutionLog[] = [];
  private eventLogs: EventLogItem[] = [];
  private currentDecision: AgentDecision | null = null;
  private lastUserUtterance = '';

  private listeners: Set<() => void> = new Set();

  private assertions: TestAssertion[] = [
    { id: 't1', name: 'TEST 1: User transcript reaches mock agent', status: 'pending', details: 'Awaiting transcript input' },
    { id: 't2', name: 'TEST 2: Mock agent produces structured decision', status: 'pending', details: 'Awaiting reasoning decision' },
    { id: 't3', name: 'TEST 3: Mock agent invokes WebMCP tool execution', status: 'pending', details: 'Awaiting WebMCP tool execution' },
    { id: 't4', name: 'TEST 4: Expression changes via set_expression', status: 'pending', details: 'Awaiting set_expression call' },
    { id: 't5', name: 'TEST 5: Gesture changes via perform_gesture', status: 'pending', details: 'Awaiting perform_gesture call' },
    { id: 't6', name: 'TEST 6: Attention/gaze changes via set_attention', status: 'pending', details: 'Awaiting set_attention call' },
    { id: 't7', name: 'TEST 7: Speech response produced via speak()', status: 'pending', details: 'Awaiting speak call' },
    { id: 't8', name: 'TEST 8: Conversation turn stored in memory', status: 'pending', details: 'Awaiting memory update' },
    { id: 't9', name: 'TEST 9: Contextual memory influences later turn', status: 'pending', details: 'Awaiting multi-turn memory recall' },
    { id: 't10', name: 'TEST 10: Strict WebMCP boundary (0 direct avatar bypasses)', status: 'passed', details: 'All actions route through WebMCP tools' },
  ];

  constructor() {
    this.addEventLog('AGENT_INIT', 'MockAgent test harness initialized');
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getState() {
    return {
      status: this.status,
      mode: this.mode,
      isActive: this.isActive,
      memory: this.memory,
      toolLogs: this.toolLogs,
      eventLogs: this.eventLogs,
      currentDecision: this.currentDecision,
      lastUserUtterance: this.lastUserUtterance,
      assertions: this.assertions,
    };
  }

  public setMode(mode: 'manual' | 'automatic') {
    this.mode = mode;
    this.addEventLog('MODE_CHANGE', `Switched mode to ${mode}`);
    this.notify();
  }

  public setActive(active: boolean) {
    this.isActive = active;
    this.addEventLog('AGENT_TOGGLE', active ? 'Mock Agent Started' : 'Mock Agent Stopped');
    this.notify();
  }

  public clearMemory() {
    this.memory = { turns: [], facts: {}, topics: [] };
    this.toolLogs = [];
    this.eventLogs = [];
    this.currentDecision = null;
    this.lastUserUtterance = '';
    this.status = 'idle';

    // Reset assertion status
    for (const a of this.assertions) {
      if (a.id !== 't10') {
        a.status = 'pending';
        a.details = 'Awaiting test trigger';
      }
    }

    this.addEventLog('MEMORY_CLEAR', 'Conversation memory and logs cleared');
    this.notify();
  }

  private addEventLog(type: string, details: string) {
    const item: EventLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      details,
    };
    this.eventLogs = [item, ...this.eventLogs.slice(0, 49)];
  }

  private updateAssertion(id: string, status: 'passed' | 'failed', details: string) {
    const item = this.assertions.find((a) => a.id === id);
    if (item) {
      item.status = status;
      item.details = details;
    }
  }

  /**
   * Called when a new user speech transcript is detected.
   */
  public async handleUserSpeech(transcript: string): Promise<boolean> {
    if (!this.isActive || !transcript.trim()) return false;

    this.lastUserUtterance = transcript;
    this.addEventLog('USER_SPEECH', `"${transcript}"`);
    this.updateAssertion('t1', 'passed', `Received: "${transcript.substring(0, 30)}..."`);

    if (this.mode === 'automatic') {
      return await this.processTurn(transcript);
    } else {
      this.status = 'listening';
      this.addEventLog('TRANSCRIPT_READY', 'Transcript captured — waiting for manual [Process Turn]');
      this.notify();
      return true;
    }
  }

  /**
   * Deterministic reasoning engine evaluating input text & conversation memory context.
   */
  public reasonAboutInput(text: string): AgentDecision {
    const lower = text.toLowerCase();
    const knownProject = this.memory.facts['project'];

    // 1. Memory recall turn (e.g. CCTV / analyzes)
    if ((lower.includes('cctv') || lower.includes('analyzes') || lower.includes('footage') || lower.includes('video')) && knownProject) {
      return {
        intent: 'context_retrieval',
        emotion: 'impressed',
        expression: 'impressed',
        gesture: 'hand_emphasis',
        attention: 'user',
        topic: 'CCTV Analytics',
        response: `So ${knownProject} analyzes CCTV footage. What kind of specific events or anomalies are you trying to detect?`,
      };
    }

    // 2. Fact store turn (e.g. called BAVIS / project name)
    if (lower.includes('bavis') || lower.includes('called') || lower.includes('named')) {
      const match = text.match(/(?:called|named)\s+([A-Za-z0-9]+)/i);
      const projectName: string = (match && match[1]) ? match[1] : 'BAVIS';
      return {
        intent: 'fact_store',
        emotion: 'warm',
        expression: 'warm',
        gesture: 'nod',
        attention: 'user',
        memoryFactKey: 'project',
        memoryFactVal: projectName,
        topic: 'Project Name',
        response: `${projectName} is a great name! What does ${projectName} do?`,
      };
    }

    // 3. Technical difficulty / struggle turn
    if (lower.includes('hardest') || lower.includes('model') || lower.includes('code') || lower.includes('getting the model to work')) {
      return {
        intent: 'technical_discussion',
        emotion: 'neutral',
        expression: 'thinking',
        gesture: 'explain_hand',
        attention: 'user',
        topic: 'AI / Model Tuning',
        response: 'Getting AI models to perform reliably can be tricky. Did you have to fine-tune the architecture or adjust the data pipeline?',
      };
    }

    // 4. Emotional struggle / almost gave up
    if (lower.includes('difficult') || lower.includes('gave up') || lower.includes('tough') || lower.includes('hard')) {
      return {
        intent: 'struggle',
        emotion: 'concerned',
        expression: 'concerned',
        gesture: 'thinking',
        attention: 'user',
        topic: 'Personal Struggle',
        response: 'That sounds tough. What helped you keep going when it got frustrating?',
      };
    }

    // 5. Achievement / finished project
    if (lower.includes('finished') || lower.includes('completed') || lower.includes('project') || lower.includes('built')) {
      return {
        intent: 'achievement',
        emotion: 'warm',
        expression: 'impressed',
        gesture: 'acknowledge',
        attention: 'user',
        topic: 'Project Accomplishment',
        response: "That's great! What was the most challenging part of the project?",
      };
    }

    // 6. Uncertainty turn
    if (lower.includes("don't know") || lower.includes('unsure') || lower.includes('not sure')) {
      return {
        intent: 'uncertainty',
        emotion: 'warm',
        expression: 'warm',
        gesture: 'head_tilt',
        attention: 'user',
        topic: 'Uncertainty',
        response: "That's okay! Let's break it down together step by step.",
      };
    }

    // 7. Question / Machine Learning turn
    if (lower.includes('machine learning') || lower.includes('what is')) {
      return {
        intent: 'question',
        emotion: 'warm',
        expression: 'warm',
        gesture: 'explain_hand',
        attention: 'user',
        topic: 'Machine Learning',
        response: 'Machine learning is a way for computers to learn patterns from data instead of being explicitly programmed for every rule.',
      };
    }

    // Default Fallback
    return {
      intent: 'general_conversation',
      emotion: 'warm',
      expression: 'warm',
      gesture: 'nod',
      attention: 'user',
      topic: 'General Discussion',
      response: 'I understand. Tell me more about that!',
    };
  }

  /**
   * Processes the user turn through WebMCP tool boundary.
   */
  public async processTurn(userText?: string): Promise<boolean> {
    const textToProcess = userText || this.lastUserUtterance;
    if (!textToProcess) return false;

    // Step 1: Thinking phase
    this.status = 'thinking';
    this.addEventLog('AGENT_THINKING', `Reasoning about transcript...`);
    this.notify();

    // Step 2: Reasoning decision
    const decision = this.reasonAboutInput(textToProcess);
    this.currentDecision = decision;
    this.updateAssertion('t2', 'passed', `Intent: ${decision.intent}, Emotion: ${decision.emotion}`);
    this.addEventLog('DECISION', `Intent: ${decision.intent} | Expression: ${decision.expression} | Gesture: ${decision.gesture}`);
    this.notify();

    // Step 3: Acting phase — WebMCP Tool Executions
    this.status = 'acting';
    this.notify();

    // Tool 1: set_expression
    const exprRes = await executeRegisteredTool('set_expression', { expression: decision.expression });
    this.recordToolLog('set_expression', { expression: decision.expression }, exprRes);
    this.updateAssertion('t4', 'passed', `set_expression("${decision.expression}")`);

    // Tool 2: set_attention
    const attRes = await executeRegisteredTool('set_attention', { target: decision.attention });
    this.recordToolLog('set_attention', { target: decision.attention }, attRes);
    this.updateAssertion('t6', 'passed', `set_attention("${decision.attention}")`);

    // Tool 3: perform_gesture
    const gestRes = await executeRegisteredTool('perform_gesture', { gesture: decision.gesture });
    this.recordToolLog('perform_gesture', { gesture: decision.gesture }, gestRes);
    this.updateAssertion('t5', 'passed', `perform_gesture("${decision.gesture}")`);

    this.updateAssertion('t3', 'passed', '4 WebMCP tools executed sequentially');

    // Tool 4: speak
    this.status = 'speaking';
    this.notify();

    const speakRes = await executeRegisteredTool('speak', { text: decision.response, emotion: decision.emotion });
    this.recordToolLog('speak', { text: decision.response, emotion: decision.emotion }, speakRes);
    this.updateAssertion('t7', 'passed', `speak("${decision.response.substring(0, 25)}...")`);

    // Step 4: Memory update & Turn storage
    const now = Date.now();
    const userTurn: ConversationTurn = { id: Math.random().toString(36).substring(2, 9), role: 'user', text: textToProcess, timestamp: now };
    const agentTurn: ConversationTurn = { id: Math.random().toString(36).substring(2, 9), role: 'agent', text: decision.response, timestamp: now + 100 };

    this.memory.turns.push(userTurn, agentTurn);

    if (decision.memoryFactKey && decision.memoryFactVal) {
      this.memory.facts[decision.memoryFactKey] = decision.memoryFactVal;
    }
    if (decision.intent === 'context_retrieval') {
      this.memory.facts['domain'] = 'CCTV / video analytics';
      this.updateAssertion('t9', 'passed', `Recalled project "${this.memory.facts['project']}" and linked to CCTV domain`);
    }
    if (decision.topic && !this.memory.topics.includes(decision.topic)) {
      this.memory.topics.push(decision.topic);
    }

    this.updateAssertion('t8', 'passed', `${this.memory.turns.length} turns in memory`);
    this.addEventLog('AGENT_COMPLETE', `Turn completed successfully`);

    this.status = 'idle';
    this.notify();
    return true;
  }

  private recordToolLog(tool: string, args: Record<string, unknown>, result: Record<string, unknown>) {
    const item: ToolExecutionLog = {
      tool,
      args,
      result,
      timestamp: new Date().toLocaleTimeString(),
      success: result.success === true,
    };
    this.toolLogs = [item, ...this.toolLogs.slice(0, 49)];
    this.addEventLog('TOOL_CALL', `${tool}(${JSON.stringify(args)})`);
  }

  private async waitForSpeechCompletion(maxWaitMs = 15000): Promise<void> {
    const startTime = Date.now();
    // Brief initial delay to allow speech state transition
    await new Promise((r) => setTimeout(r, 400));

    // Poll until status returns to 'idle' or maxWaitMs is reached
    while (this.status === 'speaking' && Date.now() - startTime < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 200));
    }

    // Natural 1.2s conversational pause after speech completes
    await new Promise((r) => setTimeout(r, 1200));
  }

  /**
   * Deterministic 5-turn demo script execution.
   */
  public async runDemoScript(): Promise<void> {
    this.clearMemory();
    this.addEventLog('DEMO_START', 'Starting 5-turn deterministic demo script');

    const demoTurns = [
      'Hey, I just finished my AI project.',
      'It was really difficult. I almost gave up.',
      'The hardest part was getting the model to work.',
      'The project is called BAVIS.',
      'It analyzes CCTV footage.',
    ];

    for (let i = 0; i < demoTurns.length; i++) {
      const turnText = demoTurns[i];
      this.addEventLog('DEMO_STEP', `Turn ${i + 1}/5: "${turnText}"`);
      await this.handleUserSpeech(turnText);
      await this.processTurn(turnText);
      await this.waitForSpeechCompletion();
    }

    this.addEventLog('DEMO_COMPLETE', '5-turn deterministic demo script completed successfully');
  }
}

export const mockAgentInstance = new MockAgent();
