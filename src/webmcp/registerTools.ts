import type { Emotion } from '../types/persona';

export interface SpeakArgs {
  text: string;
  emotion: Emotion;
}

export interface UserTranscriptData {
  transcript: string;
  hasNewInput: boolean;
  utteranceId: number;
  isListening: boolean;
}

let isRegistered = false;
let isRegistering = false;
let activeOnSpeak: ((args: SpeakArgs) => void) | null = null;
let activeOnGetUserTranscript: (() => UserTranscriptData) | null = null;
let activeOnPerformGesture: ((gesture: string) => void) | null = null;
let activeOnSetExpression: ((expression: Emotion) => void) | null = null;
let activeOnSetAttention: ((target: 'user' | 'center' | 'away') => void) | null = null;

export async function registerWebMcpTools(
  onSpeak: (args: SpeakArgs) => void,
  onGetUserTranscript: () => UserTranscriptData,
  onPerformGesture?: (gesture: string) => void,
  onSetExpression?: (expression: Emotion) => void,
  onSetAttention?: (target: 'user' | 'center' | 'away') => void
): Promise<{ available: boolean; registered: boolean }> {
  activeOnSpeak = onSpeak;
  activeOnGetUserTranscript = onGetUserTranscript;
  if (onPerformGesture) {
    activeOnPerformGesture = onPerformGesture;
  }
  if (onSetExpression) {
    activeOnSetExpression = onSetExpression;
  }
  if (onSetAttention) {
    activeOnSetAttention = onSetAttention;
  }

  // Safe check across possible injection points
  const docMC = (document as unknown as { modelContext?: WebMCP.ModelContext }).modelContext;
  const navMC = (navigator as unknown as { modelContext?: WebMCP.ModelContext }).modelContext;
  const winMC = (window as unknown as { modelContext?: WebMCP.ModelContext }).modelContext;
  
  const modelContext = docMC || navMC || winMC;

  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    console.log('[WebMCP] WebMCP API unavailable in this browser environment.');
    return { available: false, registered: false };
  }

  if (isRegistered || isRegistering) {
    return { available: true, registered: true };
  }

  isRegistering = true;

  try {
    const speakTool: WebMCP.ModelContextTool = {
      name: 'speak',
      title: 'Speak',
      description: 'Make the virtual interviewer speak with a specified text and emotional expression.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The dialogue text for the virtual interviewer to speak.'
          },
          emotion: {
            type: 'string',
            enum: ['neutral', 'warm', 'skeptical', 'impressed', 'stern', 'concerned', 'surprised', 'thinking'],
            description: 'The emotional expression of the virtual interviewer while speaking.'
          }
        },
        required: ['text', 'emotion']
      },
      execute: (inputObject: Record<string, unknown>) => {
        const text = typeof inputObject.text === 'string' ? inputObject.text : String(inputObject.text || '');
        const rawEmotion = typeof inputObject.emotion === 'string' ? inputObject.emotion : 'neutral';
        const validEmotions: Emotion[] = ['neutral', 'warm', 'skeptical', 'impressed', 'stern', 'concerned', 'surprised', 'thinking'];
        const emotion: Emotion = validEmotions.includes(rawEmotion as Emotion) ? (rawEmotion as Emotion) : 'neutral';

        console.log(`[WebMCP] speak()\ntext: ${text}\nemotion: ${emotion}`);

        if (activeOnSpeak) {
          activeOnSpeak({ text, emotion });
        }

        return {
          success: true,
          message: `Virtual interviewer speaking with emotion ${emotion}`,
          text,
          emotion
        };
      }
    };

    const getUserTranscriptTool: WebMCP.ModelContextTool = {
      name: 'get_user_transcript',
      title: 'Get User Transcript',
      description: 'Retrieve the latest human speech utterance captured by Persona and waiting for the AI agent.',
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        type: 'object',
        properties: {},
      },
      execute: () => {
        const data = activeOnGetUserTranscript
          ? activeOnGetUserTranscript()
          : { transcript: '', hasNewInput: false, utteranceId: 0, isListening: false };

        console.log('[WebMCP] get_user_transcript()', data);

        return {
          success: true,
          transcript: data.transcript,
          hasNewInput: data.hasNewInput,
          utteranceId: data.utteranceId,
          isListening: data.isListening,
        };
      },
    };

    const performGestureTool: WebMCP.ModelContextTool = {
      name: 'perform_gesture',
      title: 'Perform Gesture',
      description: 'Make the virtual interviewer perform a body gesture.',
      inputSchema: {
        type: 'object',
        properties: {
          gesture: {
            type: 'string',
            enum: ['nod', 'shake_head', 'head_tilt', 'acknowledge', 'agree', 'disagree', 'thinking', 'lean_forward', 'lean_back'],
            description: 'The body gesture for the virtual interviewer to perform.'
          }
        },
        required: ['gesture']
      },
      execute: (inputObject: Record<string, unknown>) => {
        const rawGesture = typeof inputObject.gesture === 'string' ? inputObject.gesture : String(inputObject.gesture || '');
        const validGestures = ['nod', 'shake_head', 'head_tilt', 'acknowledge', 'agree', 'disagree', 'thinking', 'lean_forward', 'lean_back'];

        if (!validGestures.includes(rawGesture)) {
          return {
            success: false,
            error: 'UnsupportedGesture',
            message: `Gesture '${rawGesture}' is not supported.`
          };
        }

        console.log(`[WebMCP] perform_gesture()\ngesture: ${rawGesture}`);

        if (activeOnPerformGesture) {
          activeOnPerformGesture(rawGesture);
        }

        return {
          success: true,
          gesture: rawGesture
        };
      }
    };

    const setExpressionTool: WebMCP.ModelContextTool = {
      name: 'set_expression',
      title: 'Set Expression',
      description: 'Change the facial expression of the virtual interviewer.',
      inputSchema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            enum: ['neutral', 'warm', 'skeptical', 'impressed', 'stern', 'concerned', 'surprised', 'thinking'],
            description: 'The facial expression for the virtual interviewer to display.'
          }
        },
        required: ['expression']
      },
      execute: (inputObject: Record<string, unknown>) => {
        const rawExpr = typeof inputObject.expression === 'string' ? inputObject.expression : String(inputObject.expression || '');
        const validExpressions: Emotion[] = ['neutral', 'warm', 'skeptical', 'impressed', 'stern', 'concerned', 'surprised', 'thinking'];

        if (!validExpressions.includes(rawExpr as Emotion)) {
          return {
            success: false,
            error: 'UnsupportedExpression',
            message: `Expression '${rawExpr}' is not supported.`
          };
        }

        const expression = rawExpr as Emotion;
        console.log(`[WebMCP] set_expression()\nexpression: ${expression}`);

        if (activeOnSetExpression) {
          activeOnSetExpression(expression);
        }

        return {
          success: true,
          expression
        };
      }
    };

    const setAttentionTool: WebMCP.ModelContextTool = {
      name: 'set_attention',
      title: 'Set Attention',
      description: 'Direct the gaze and eye-contact attention target of the virtual interviewer.',
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['user', 'center', 'away'],
            description: 'The gaze target position: "user" (look at user), "center" (look at scene center), or "away" (look away thoughtfully).'
          }
        },
        required: ['target']
      },
      execute: (inputObject: Record<string, unknown>) => {
        const rawTarget = typeof inputObject.target === 'string' ? inputObject.target : String(inputObject.target || '');
        const validTargets = ['user', 'center', 'away'];

        if (!validTargets.includes(rawTarget)) {
          return {
            success: false,
            error: 'UnsupportedTarget',
            message: `Attention target '${rawTarget}' is not supported.`
          };
        }

        const target = rawTarget as 'user' | 'center' | 'away';
        console.log(`[WebMCP] set_attention()\ntarget: ${target}`);

        if (activeOnSetAttention) {
          activeOnSetAttention(target);
        }

        return {
          success: true,
          target
        };
      }
    };

    await modelContext.registerTool(speakTool);
    await modelContext.registerTool(getUserTranscriptTool);
    await modelContext.registerTool(performGestureTool);
    await modelContext.registerTool(setExpressionTool);
    await modelContext.registerTool(setAttentionTool);

    isRegistered = true;
    isRegistering = false;

    console.log('[WebMCP] 5 Tools ("speak", "get_user_transcript", "perform_gesture", "set_expression", "set_attention") registered successfully.');
    return { available: true, registered: true };
  } catch (err) {
    isRegistering = false;
    const errString = String(err);
    if (errString.includes('Duplicate tool name') || errString.includes('InvalidStateError')) {
      isRegistered = true;
      console.log('[WebMCP] Tools already registered.');
      return { available: true, registered: true };
    }
    console.error('[WebMCP] Exception during tool registration:', err);
    return { available: true, registered: false };
  }
}

/**
 * Development Adapter: Allows the MockAgent test harness to execute registered WebMCP tools
 * directly through the official WebMCP handlers without creating duplicate tool definitions.
 */
export async function executeRegisteredTool(
  toolName: string,
  args: Record<string, unknown> = {}
): Promise<{ success: boolean; [key: string]: unknown }> {
  // If modelContext exists on window/document, try standard executeTool first
  const mc = ((document as unknown as { modelContext?: unknown }).modelContext ||
    (window as unknown as { modelContext?: unknown }).modelContext) as {
    getTools?: () => Promise<Array<{ name: string }>>;
    executeTool?: (tool: unknown, input: string) => Promise<unknown>;
  } | undefined;

  if (mc && typeof mc.executeTool === 'function' && typeof mc.getTools === 'function') {
    try {
      const tools = await mc.getTools();
      const targetTool = tools.find((t) => t.name === toolName);
      if (targetTool) {
        const res = await mc.executeTool(targetTool, JSON.stringify(args));
        const parsed = typeof res === 'string' ? JSON.parse(res) : (res as Record<string, unknown>);
        return { success: true, ...parsed };
      }
    } catch (e) {
      console.warn('[WebMCP Adapter] Fallback to direct tool dispatcher:', e);
    }
  }

  // Direct dispatcher mapping to active registered WebMCP handlers
  switch (toolName) {
    case 'speak': {
      const text = String(args.text || '');
      const emotion = (args.emotion as Emotion) || 'neutral';
      if (activeOnSpeak) activeOnSpeak({ text, emotion });
      return { success: true, message: `Virtual interviewer speaking with emotion ${emotion}`, text, emotion };
    }
    case 'get_user_transcript': {
      const data = activeOnGetUserTranscript
        ? activeOnGetUserTranscript()
        : { transcript: '', hasNewInput: false, utteranceId: 0, isListening: false };
      return { success: true, ...data };
    }
    case 'perform_gesture': {
      const gesture = String(args.gesture || 'nod');
      if (activeOnPerformGesture) activeOnPerformGesture(gesture);
      return { success: true, gesture };
    }
    case 'set_expression': {
      const expression = (args.expression as Emotion) || 'neutral';
      if (activeOnSetExpression) activeOnSetExpression(expression);
      return { success: true, expression };
    }
    case 'set_attention': {
      const target = (args.target as 'user' | 'center' | 'away') || 'user';
      if (activeOnSetAttention) activeOnSetAttention(target);
      return { success: true, target };
    }
    default:
      return { success: false, error: 'UnknownTool', message: `Tool ${toolName} not found` };
  }
}
