# Persona End-to-End Conversation Architecture

This document describes the user-facing conversation lifecycle, state machine, agent abstraction layer, and WebMCP tool boundary.

---

## 1. System Architecture Map

```
               USER (Human Speaker)
                        ↓
             MICROPHONE INPUT (STT)
                        ↓
            FINAL TRANSCRIPT CREATED
                        ↓
            CONVERSATION AGENT ADAPTER
      ┌─────────────────┴─────────────────┐
      │                                   │
      ▼                                   ▼
 [Dev Mock Agent]            [External WebMCP Agent]
 (Deterministic Offline)     (Chrome Extension / Host API)
      │                                   │
      └─────────────────┬─────────────────┘
                        ↓
            WEBMCP TOOL REGISTRATION
     (document.modelContext.registerTool)
                        ↓
             WEBMCP TOOL EXECUTION
     ├── get_user_transcript()
     ├── set_expression(expression)
     ├── set_attention(target)
     ├── perform_gesture(gesture)
     └── speak(text, emotion)
                        ↓
            PERSONA AVATAR RUNTIME
      ├── 3D Three.js VRM Rendering
      ├── Expressions & Lip-Sync (TTS)
      ├── Gestures & Gaze Controller
      └── Humanization & Micro-Behaviors
```

---

## 2. Conversation State Machine

The conversation session is managed by an explicit, clean state machine:

```
                  ┌──────────────┐
                  │     IDLE     │
                  └──────┬───────┘
                         │ (Click "Start Conversation")
                         ▼
                  ┌──────────────┐
                  │REQUESTING_MIC│
                  └──────┬───────┘
                         │ (Mic Access Granted)
                         ▼
            ┌─────────► LISTENING ◄─────────┐
            │             │                 │
            │             │ (User Speaks)   │
            │             ▼                 │
            │        PROCESSING             │ (TTS Finished)
            │             │                 │
            │             │ (Agent Speaks)  │
            │             ▼                 │
            └────────── SPEAKING ───────────┘
                         │
                         │ (Click "Stop Conversation")
                         ▼
                  ┌──────────────┐
                  │ ENDED / IDLE │
                  └──────────────┘
```

### State Definitions:
- **`IDLE`**: Initial state before starting session. Avatar displays base idle animation.
- **`REQUESTING_MIC`**: Requesting microphone permissions from browser.
- **`LISTENING`**: STT active, waiting for human user speech.
- **`PROCESSING`**: Final transcript captured; agent evaluates reasoning and triggers WebMCP tool executions.
- **`SPEAKING`**: Persona is speaking dialogue via TTS while displaying facial expressions and body gestures.
- **`ENDED`**: Session stopped by user.
- **`ERROR`**: Graceful error state handling mic denial or browser API limitations.

---

## 3. WebMCP Tool Boundary & Agent Abstraction

The UI layer **NEVER** directly mutates avatar expressions, gestures, gaze targets, or speech. All avatar control strictly flows through the registered WebMCP tools:

1. **`get_user_transcript`**: Exposes user speech transcript.
2. **`set_expression`**: Changes avatar facial expression.
3. **`set_attention`**: Changes avatar gaze target (`user`, `center`, `away`).
4. **`perform_gesture`**: Triggers body/arm/head gesture.
5. **`speak`**: Triggers spoken response via TTS.

### Agent Interface Abstraction (`src/agent/ConversationAgent.ts`):
```typescript
export interface IConversationAgent {
  id: string;
  name: string;
  onUserSpeech(transcript: string): Promise<boolean>;
}
```
- In development/test mode (`VITE_ENABLE_MOCK_AGENT=true`), `MockAgent` implements `IConversationAgent`.
- In production, an external WebMCP-capable agent discovers and invokes tools registered on `document.modelContext`.

---

## 4. Development vs Production Behavior

- **Production Mode (`VITE_ENABLE_MOCK_AGENT=false`)**: Clean character-focused UI with "Start Conversation" / "Stop Conversation" controls and secondary lightweight transcript. Development overlays, debug logs, and mock agent consoles are completely hidden.
- **Development Mode (`VITE_ENABLE_MOCK_AGENT=true`)**: Renders `<MockAgentConsole />` overlay for local testing, demo scripts, and WebMCP verification assertions.
