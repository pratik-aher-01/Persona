# Persona — Hackathon Changelog

## Submission: WebMCP Challenge

This document distinguishes what existed before the hackathon from what was built or significantly extended during the hackathon submission period.

---

## PRE-HACKATHON FOUNDATION

The following existed before the hackathon submission period began:

- React + TypeScript + Vite project scaffold
- Three.js scene setup
- Initial `@pixiv/three-vrm` integration (basic VRM loading)
- Basic CSS/design system foundation
- Initial `index.html` and `main.tsx` entry point
- `webmcp-types` dependency added to `package.json`

---

## HACKATHON WebMCP WORK

Everything below was built or substantially completed during the hackathon submission period to extend the project with meaningful WebMCP integration.

### WebMCP Tool Registration

**File:** `src/webmcp/registerTools.ts`

- Implemented `registerWebMcpTools()` using real `document.modelContext.registerTool(...)`
- Registered 5 tools: `speak`, `get_user_transcript`, `perform_gesture`, `set_expression`, `set_attention`
- Implemented idempotent registration with `isRegistered` / `isRegistering` guards
- Added multi-injection-point detection (`document.modelContext`, `navigator.modelContext`, `window.modelContext`)
- Implemented `executeRegisteredTool()` development adapter for MockAgent
- Full TypeScript types for all tool schemas and return values

### Avatar Embodiment System

**Files:** `src/avatar/PersonaAvatarRuntime.ts`, `src/avatar/expressions.ts`, `src/avatar/gaze.ts`

- Complete VRM 1.0 avatar runtime with Three.js render loop
- Expression blending system mapping 8 named emotions to VRM morph targets
- Dynamic gaze system: `user` / `center` / `away` attention targets
- Gesture animation system: 9 named gestures (nod, shake_head, head_tilt, etc.)
- VRM capability detector for graceful degradation when morph targets are unavailable

**Files:** `src/avatar/behavior/humanizationEngine.ts`, `src/avatar/animation/idle.ts`

- Continuous idle humanization: breathing cycle, blink timing, micro head movement
- Gesture overlap handling and animation queuing

### Voice Integration

**Files:** `src/voice/BrowserVoiceEngine.ts`, `src/voice/VoiceTypes.ts`

- `BrowserVoiceEngine` wrapping `window.SpeechSynthesis`
- Emotion-aware voice parameter selection (pitch, rate variation per emotion)
- `onStart` / `onEnd` / `onError` callbacks for session lifecycle
- Gender preference per persona (male/female voice selection)
- STT protection during TTS (prevents feedback loops)

### Speech Recognition (STT)

**File:** `src/utils/stt.ts`

- `SpeechRecognizer` class wrapping Web Speech API
- Continuous speech recognition with interim and final transcript handling
- TTS-guard: STT paused during avatar speech, resumes on completion

### Conversation Session

**File:** `src/session/ConversationSession.ts`

- Lightweight session state machine: `IDLE → ACTIVE → IDLE`
- Session phase tracking (mic granted, user speaking, agent speaking)
- Observable subscription pattern for session state

### Agent Adapter

**File:** `src/agent/ConversationAgent.ts`

- Clean production no-op adapter (real agent is external ChatGPT via WebMCP)
- Dynamic import of MockAgent only when `VITE_ENABLE_MOCK_AGENT=true`
- Architectural separation between production WebMCP path and development testing path

### Mock Agent Test Harness

**Files:** `src/dev/MockAgent.ts`, `src/dev/MockAgentConsole.tsx`

- `MockAgent` class: deterministic reasoning engine simulating ChatGPT behavior
- Routes all actions through `executeRegisteredTool()` (same WebMCP code path as real agent)
- Conversation memory (turn history, key-value facts, topic tracking)
- 10 automated test assertions covering the full WebMCP boundary
- Demo script: 5-turn deterministic conversation sequence
- `MockAgentConsole`: floating dev panel with Pipeline / Memory / Events / Tests tabs
- Guarded behind `VITE_ENABLE_MOCK_AGENT=true` — never shown in production

### Multi-Persona System

**File:** `src/config/personas.ts`

- 4 VRM avatar personas: Alex (Technical Interview), Ken (Language Coach), Steve (Presentation Coach), Harry (Debate Partner)
- Each with model URL, background image, voice gender preference
- Collapsible persona selection drawer in UI
- 2 "Coming Soon" placeholders for future modes

### UI / UX

**Files:** `src/App.tsx`, `src/App.css`, `src/components/`

- Full glassmorphic UI with collapsible left/right drawers
- WebMCP connection status pill in header (CONNECTED / OFFLINE)
- Real-time conversation transcript overlay
- Expression and status indicators in footer
- Conversation start/stop controls
- Avatar response speech bubble (shown during `speaking` state)
- Light/dark mode toggle with `localStorage` persistence
- Agent Capabilities drawer showing live tool call activity

### 3D VRM Avatar Assets

**Directory:** `public/models/`

- Alex0.1.vrm (Technical Interviewer)
- Ken0.1.vrm (Language Coach)
- Steve0.1.vrm (Presentation Coach)
- Harry0.1.vrm (Debate Partner)

### Documentation (this hackathon submission)

- `README.md` — complete hackathon-quality README
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/JUDGE_TESTING.md`
- `docs/WEBMCP.md`
- `docs/CHANGELOG_HACKATHON.md` (this file)
- `docs/RELEASE_CHECKLIST.md`
- `.env.example`
- `LICENSE` (MIT)

---

## Git Evidence

```
49fa4dd  slight ui change
ebf3bf6  Working product
e5b87b9  milestone: end-to-end embodied agent conversation
```

The commit history reflects the hackathon development arc: WebMCP loop proven → full embodied experience → UI polish.

---

## Summary

The core hackathon contribution is the **WebMCP embodiment loop**:

1. Human speech is captured by the page (STT)
2. Agent reads it via `get_user_transcript` WebMCP tool
3. Agent decides how to respond (outside the page, in ChatGPT)
4. Agent calls `set_expression`, `set_attention`, `perform_gesture`, `speak` via WebMCP
5. Page executes all tool calls on the live VRM avatar

This loop could not exist before WebMCP. The entire visible behavior of the avatar is driven by structured agent tool calls.
