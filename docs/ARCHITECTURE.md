# Persona — System Architecture

## Overview

Persona is a client-only web application. There is no backend server, no custom LLM, and no database.

The architecture follows a strict separation:

- **Human** speaks and listens
- **Browser page** captures speech, renders avatar, plays TTS
- **WebMCP** is the only interface between the AI agent and the page
- **AI agent** (ChatGPT or similar) reasons and calls tools
- **Avatar** renders the result of tool calls

---

## System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     HUMAN                                │
│         (speaks, listens, observes avatar)               │
└───────────────────────┬──────────────────────────────────┘
                        │ voice / perception
                        │
┌───────────────────────▼──────────────────────────────────┐
│               PERSONA BROWSER PAGE                       │
│                                                          │
│  ┌──────────────┐   ┌──────────────────┐                │
│  │ Web Speech   │   │  Browser TTS     │                │
│  │ API (STT)    │   │  SpeechSynthesis │                │
│  └──────┬───────┘   └────────▲─────────┘                │
│         │                    │                           │
│  ┌──────▼────────────────────┴─────────────────────┐    │
│  │           React Application (App.tsx)            │    │
│  │                                                  │    │
│  │  pendingUserUtterance   ←  STT final result      │    │
│  │  emotion / expression   →  VRM expression        │    │
│  │  gesture trigger        →  VRM animation         │    │
│  │  attention target       →  VRM gaze              │    │
│  └──────────┬──────────────────────────────────────┘    │
│             │                                            │
│  ┌──────────▼──────────────────────────────────────┐    │
│  │         WebMCP Tool Registry                     │    │
│  │     (src/webmcp/registerTools.ts)                │    │
│  │                                                  │    │
│  │  document.modelContext.registerTool(...)         │    │
│  │                                                  │    │
│  │  Tools registered:                               │    │
│  │  ● get_user_transcript   (read-only)             │    │
│  │  ● speak                 (TTS + expression)      │    │
│  │  ● set_expression        (face morph)            │    │
│  │  ● set_attention         (gaze direction)        │    │
│  │  ● perform_gesture       (body animation)        │    │
│  └──────────┬──────────────────────────────────────┘    │
│             │                                            │
│  ┌──────────▼──────────────────────────────────────┐    │
│  │            VRM Avatar Runtime                    │    │
│  │     (src/avatar/PersonaAvatarRuntime.ts)         │    │
│  │                                                  │    │
│  │  Three.js scene + @pixiv/three-vrm               │    │
│  │  ● Expression blending (VRM morph targets)       │    │
│  │  ● Gaze system (eye/head tracking)               │    │
│  │  ● Gesture animations (head/body)                │    │
│  │  ● Idle humanization (blink, breathe, sway)      │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────┬──────────────────────────────────┘
                        │
                  WebMCP API
          (document.modelContext)
                        │
┌───────────────────────▼──────────────────────────────────┐
│                  AI AGENT (ChatGPT)                      │
│                                                          │
│  - Reads transcript via get_user_transcript              │
│  - Reasons about what to say/show                        │
│  - Calls speak(), set_expression(), etc.                 │
│  - Never accesses browser DOM directly                   │
│  - All reasoning happens outside the browser             │
└──────────────────────────────────────────────────────────┘
```

---

## Key Data Flows

### Human → Agent (Perception)

```
Human speaks
  → Web Speech API (browser) → SpeechRecognizer
  → finalText stored as pendingUserUtterance in React state
  → Agent calls get_user_transcript()
  → Returns { transcript, hasNewInput: true, utteranceId, isListening }
  → pendingUserUtterance is cleared (consumed)
```

### Agent → Avatar (Action)

```
Agent calls speak({ text, emotion })
  → voiceEngine.speak() → SpeechSynthesisUtterance
  → Avatar status → 'speaking'
  → Expression set to emotion
  → Speech bubble rendered in UI
  → On TTS end: status → 'idle', STT resumes

Agent calls set_expression({ expression })
  → React emotion state updated
  → PersonaAvatarRuntime reads emotion on next frame
  → VRM morph target blended to target expression

Agent calls set_attention({ target })
  → attentionChangeRef.current(target)
  → Gaze system in runtime updates lookAt target

Agent calls perform_gesture({ gesture })
  → gesturePlayRef.current(gesture)
  → Gesture animation system queues animation
```

---

## Module Breakdown

### `src/webmcp/registerTools.ts`
- Registers all 5 WebMCP tools via `document.modelContext.registerTool`
- Exports `executeRegisteredTool` for dev/MockAgent use
- Decoupled from React — uses callback arguments for all state access

### `src/avatar/PersonaAvatarRuntime.ts`
- Three.js render loop, VRM loading, expression blending, gaze, gestures
- Runs at 60fps, reads `emotion` and `status` props from React
- Exposes gesture and attention change callbacks via refs

### `src/avatar/behavior/humanizationEngine.ts`
- Continuous idle animation: breathing, blinking, micro head movement
- Runs independently of the agent — always makes the avatar feel alive

### `src/avatar/expression/`
- `expressionProfiles.ts` — maps named emotions to VRM morph target weights
- `vrmCapabilityDetector.ts` — detects which morph targets the loaded VRM supports

### `src/voice/BrowserVoiceEngine.ts`
- Wraps `window.speechSynthesis` with emotion-aware voice selection
- Handles voice pitch/rate variations per emotion
- Provides `onStart`, `onEnd`, `onError` callbacks for session state

### `src/session/ConversationSession.ts`
- Lightweight state machine: `IDLE → ACTIVE → IDLE`
- Tracks session phase (mic granted, user speaking, agent speaking)

### `src/agent/ConversationAgent.ts`
- Production: no-op adapter (agent is external ChatGPT via WebMCP)
- Development: dynamically imports MockAgent when `VITE_ENABLE_MOCK_AGENT=true`

### `src/dev/MockAgent.ts` + `MockAgentConsole.tsx`
- Local test harness simulating an AI agent
- Intercepts user speech, applies deterministic reasoning, calls WebMCP tools
- Console panel rendered only when `VITE_ENABLE_MOCK_AGENT=true`

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| 3D Runtime | Three.js 0.185 |
| VRM | @pixiv/three-vrm 3.5 |
| STT | Web Speech API (browser native) |
| TTS | SpeechSynthesis API (browser native) |
| WebMCP | webmcp-types 0.1 (type definitions) |
| Styling | Vanilla CSS with CSS variables |

No backend. No database. No authentication. No custom AI.

---

## Security & Privacy

- Microphone audio is processed by the browser's native Speech Recognition API
- No audio is sent to any custom server
- No conversation data is stored remotely
- No API keys or secrets exist in the codebase
- All state is ephemeral (React memory + localStorage for theme preference only)
