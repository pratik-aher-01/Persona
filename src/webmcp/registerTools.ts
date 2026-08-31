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

export async function registerWebMcpTools(
  onSpeak: (args: SpeakArgs) => void,
  onGetUserTranscript: () => UserTranscriptData
): Promise<{ available: boolean; registered: boolean }> {
  activeOnSpeak = onSpeak;
  activeOnGetUserTranscript = onGetUserTranscript;

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
            enum: ['neutral', 'warm', 'skeptical', 'impressed', 'stern'],
            description: 'The emotional expression of the virtual interviewer while speaking.'
          }
        },
        required: ['text', 'emotion']
      },
      execute: (inputObject: Record<string, unknown>) => {
        const text = typeof inputObject.text === 'string' ? inputObject.text : String(inputObject.text || '');
        const rawEmotion = typeof inputObject.emotion === 'string' ? inputObject.emotion : 'neutral';
        const validEmotions: Emotion[] = ['neutral', 'warm', 'skeptical', 'impressed', 'stern'];
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

    await modelContext.registerTool(speakTool);
    await modelContext.registerTool(getUserTranscriptTool);

    isRegistered = true;
    isRegistering = false;

    console.log('[WebMCP] Tools "speak" and "get_user_transcript" registered successfully.');
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

