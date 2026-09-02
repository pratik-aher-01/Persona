export interface IConversationAgent {
  id: string;
  name: string;
  onUserSpeech(transcript: string): Promise<boolean>;
}

/**
 * Agent Adapter: Provides an abstract interface for the conversation UI session
 * to communicate with an agent.
 *
 * In PRODUCTION: user speech is handled by the external WebMCP agent (ChatGPT).
 *   The adapter is a no-op — the agent reads transcripts via get_user_transcript().
 *
 * In DEVELOPMENT (VITE_ENABLE_MOCK_AGENT=true): routes speech to MockAgent harness
 *   for local testing of the WebMCP tool boundary.
 */
export class AgentAdapter implements IConversationAgent {
  public id = 'default-adapter';
  public name = 'Persona Conversation Agent Adapter';

  public async onUserSpeech(transcript: string): Promise<boolean> {
    if (!transcript || !transcript.trim()) return false;

    // In development with mock agent enabled, process through the MockAgent test harness.
    // In production, the external WebMCP agent (ChatGPT) reads the transcript via
    // the get_user_transcript() tool and takes action through speak(), set_expression(), etc.
    if (import.meta.env.VITE_ENABLE_MOCK_AGENT === 'true') {
      const { mockAgentInstance } = await import('../dev/MockAgent');
      return await mockAgentInstance.handleUserSpeech(transcript);
    }

    // Production: no-op — the WebMCP agent reads the transcript asynchronously.
    return true;
  }
}

export const activeAgentAdapter = new AgentAdapter();
