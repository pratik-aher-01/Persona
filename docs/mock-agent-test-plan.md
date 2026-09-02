# Persona WebMCP Mock Agent Test Plan & Architecture Map

## 1. Existing Architecture & Components Map

| Component | File Path | Description |
| :--- | :--- | :--- |
| **App Entry Point** | [`src/App.tsx`](file:///d:/HACKATHONS%20projects/Persona/persona/src/App.tsx) | Main application state container (`status`, `dialogue`, `userTranscript`, speech handlers). |
| **Persona Avatar Wrapper** | [`src/avatar/PersonaAvatar.tsx`](file:///d:/HACKATHONS%20projects/Persona/persona/src/avatar/PersonaAvatar.tsx) | React component wrapping Three.js VRM rendering and syncing status props. |
| **Avatar Runtime Engine** | [`src/avatar/PersonaAvatarRuntime.ts`](file:///d:/HACKATHONS%20projects/Persona/persona/src/avatar/PersonaAvatarRuntime.ts) | Core 60 FPS animation loop driving THREE.js VRM instance, humanization, gaze, idle, and gestures. |
| **WebMCP Tool Registry** | [`src/webmcp/registerTools.ts`](file:///d:/HACKATHONS%20projects/Persona/persona/src/webmcp/registerTools.ts) | Registers `speak`, `get_user_transcript`, `perform_gesture`, `set_expression`, and `set_attention` onto `document.modelContext`. |
| **Voice Engine (TTS)** | [`src/voice/BrowserVoiceEngine.ts`](file:///d:/HACKATHONS%20projects/Persona/persona/src/voice/BrowserVoiceEngine.ts) | Web SpeechSynthesis wrapper with gender-aware voice selection. |
| **STT (Speech Recognition)** | [`src/utils/stt.ts`](file:///d:/HACKATHONS%20projects/Persona/persona/src/utils/stt.ts) | `webkitSpeechRecognition` wrapper delivering user voice transcripts. |
| **Humanization Engine** | [`src/avatar/behavior/humanizationEngine.ts`](file:///d:/HACKATHONS%20projects/Persona/persona/src/avatar/behavior/humanizationEngine.ts) | Micro-behaviors (blinking, breathing, posture adjustments, subtle head sways). |
| **Behavior Orchestrator** | [`src/avatar/behavior/behaviorOrchestrator.ts`](file:///d:/HACKATHONS%20projects/Persona/persona/src/avatar/behavior/behaviorOrchestrator.ts) | State transition logger and high-level semantic behavior dispatcher. |

---

## 2. Existing 5 WebMCP Tools

1. **`get_user_transcript`**: Retrieves latest user speech utterance.
2. **`speak`**: Triggers TTS speech with specified text and emotion (`neutral`, `warm`, `skeptical`, `impressed`, `stern`, `concerned`, `surprised`, `thinking`).
3. **`perform_gesture`**: Triggers body/arm/head gesture (`nod`, `shake_head`, `head_tilt`, `acknowledge`, `agree`, `disagree`, `thinking`, `lean_forward`, `lean_back`).
4. **`set_expression`**: Changes facial expression morph targets (`neutral`, `warm`, `skeptical`, `impressed`, `stern`, `concerned`, `surprised`, `thinking`).
5. **`set_attention`**: Directs gaze target (`user`, `center`, `away`).

---

## 3. Mock Agent Integration Plan

```
USER SPEAKS (STT)
      ↓
userTranscript state updated in App.tsx
      ↓
MockAgent inspects transcript via get_user_transcript WebMCP tool
      ↓
MockAgent deterministic reasoning engine evaluates intent & memory
      ↓
MockAgent produces structured decision (intent, emotion, expression, gesture, attention, response)
      ↓
MockAgent invokes EXISTING WebMCP tools sequentially:
   - set_expression(expression)
   - set_attention(attention)
   - perform_gesture(gesture)
   - speak(text, emotion)
      ↓
Persona Avatar executes actions through standard WebMCP handlers
      ↓
Conversation Memory updated (turns, facts, topics)
```

---

## 4. Files to be Created & Modified

### New Files
- **`docs/mock-agent-test-plan.md`**: (This document) Architecture map and mock agent test plan.
- **`src/dev/MockAgent.ts`**: Offline deterministic agent reasoning, structured memory, WebMCP tool invoker, and demo script execution.
- **`src/dev/MockAgentConsole.tsx`**: Collapsible dev console UI overlay showing agent status, reasoning pipeline, tool execution log, memory inspector, event log, manual/auto controls, and test assertions.
- **`docs/MOCK_AGENT_TESTING.md`**: Complete step-by-step testing guide.

### Modified Files
- **`src/webmcp/registerTools.ts`**: Export a local tool invocation helper `invokeWebMcpTool(name, args)` so the development mock agent can invoke the exact registered WebMCP tools cleanly in environments where external Chrome extension injected `document.modelContext` is not present.
- **`src/App.tsx`**: Mount `<MockAgentConsole />` overlay when `VITE_ENABLE_MOCK_AGENT` or dev toggle is active.

---

## 5. Unchanged Files
- All VRM models (`/public/models/*.vrm`)
- Core Avatar runtime (`PersonaAvatarRuntime.ts`, `idle.ts`, `gestures.ts`, `expressions.ts`, `gaze.ts`)
- Humanization Engine (`humanizationEngine.ts`)
- Browser Voice Engine (`BrowserVoiceEngine.ts`)
- Speech Recognition (`stt.ts`)
