# Persona — Embodied WebMCP Agent

> Give a ChatGPT agent a body. Practice a difficult conversation with it.

Persona is a browser-native embodied interface for AI agents. The web page is the agent's body — a 3D VRM avatar with voice, facial expressions, gaze, and gestures. An AI agent (ChatGPT) interacts with the avatar through structured **WebMCP tools**, making the avatar speak, react, and respond in real time.

The result: a shared environment where humans and agents practice difficult conversations together in a way that was impossible without WebMCP.

---

## What is Persona?

Persona is an **agent-native web application** for rehearsing high-stakes conversations with an AI that behaves like a real participant — not a chatbot.

The architecture is:

```
Human
  ↓  (speaks naturally)
Persona page
  ↓  (STT via Web Speech API)
get_user_transcript() — WebMCP tool
  ↓  (agent reads transcript)
ChatGPT Agent
  ↓  (reasons, decides action)
WebMCP tools:
  ├── set_expression(expression)
  ├── set_attention(target)
  ├── perform_gesture(gesture)
  └── speak(text, emotion)
  ↓
Persona Runtime
  ↓
VRM Avatar + Browser TTS
  ↓
Human sees and hears the response
```

The agent does not control the browser. It calls structured tools that the page exposes via `document.modelContext`. The page handles all rendering and audio.

---

## Why WebMCP?

Without WebMCP, an AI agent has no structured way to control a web page. It can only generate text. WebMCP gives the agent a typed, discoverable action interface — the agent can:

- **Read** what the human said via `get_user_transcript`
- **Change** the avatar's expression via `set_expression`
- **Direct** the avatar's gaze via `set_attention`
- **Trigger** a body gesture via `perform_gesture`
- **Make the avatar speak** with a specified emotion via `speak`

This creates genuine agent–embodiment coupling: the agent decides what to do, the page executes it visibly. Remove WebMCP and the experience collapses — the agent would have no action interface and the avatar would be inert.

---

## WebMCP Tools

All tools are registered via `document.modelContext.registerTool(...)`. See [`src/webmcp/registerTools.ts`](src/webmcp/registerTools.ts) for the full implementation.

### `get_user_transcript`

Read the latest human speech utterance waiting for the agent.

```json
{
  "name": "get_user_transcript",
  "inputSchema": { "type": "object", "properties": {} }
}
```

**Returns:** `{ transcript, hasNewInput, utteranceId, isListening }`

---

### `speak`

Make the avatar speak with a specified text and emotional expression.

```json
{
  "name": "speak",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": { "type": "string" },
      "emotion": {
        "type": "string",
        "enum": ["neutral", "warm", "skeptical", "impressed", "stern", "concerned", "surprised", "thinking"]
      }
    },
    "required": ["text", "emotion"]
  }
}
```

**Effect:** Avatar enters speaking state, browser TTS plays audio, expression changes.

---

### `set_expression`

Change the avatar's facial expression.

```json
{
  "name": "set_expression",
  "inputSchema": {
    "type": "object",
    "properties": {
      "expression": {
        "type": "string",
        "enum": ["neutral", "warm", "skeptical", "impressed", "stern", "concerned", "surprised", "thinking"]
      }
    },
    "required": ["expression"]
  }
}
```

**Effect:** Avatar blends to the target expression via the VRM expression system.

---

### `perform_gesture`

Make the avatar perform a body gesture.

```json
{
  "name": "perform_gesture",
  "inputSchema": {
    "type": "object",
    "properties": {
      "gesture": {
        "type": "string",
        "enum": ["nod", "shake_head", "head_tilt", "acknowledge", "agree", "disagree", "thinking", "lean_forward", "lean_back"]
      }
    },
    "required": ["gesture"]
  }
}
```

**Effect:** Avatar performs the corresponding head/body animation.

---

### `set_attention`

Direct the avatar's gaze to a specific target.

```json
{
  "name": "set_attention",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target": {
        "type": "string",
        "enum": ["user", "center", "away"]
      }
    },
    "required": ["target"]
  }
}
```

**Effect:** Avatar gaze system smoothly moves to the specified attention target.

---

## Example Agent Interaction

```
Human: "I just finished my AI project."

Agent calls:
  set_expression({ expression: "impressed" })
  set_attention({ target: "user" })
  perform_gesture({ gesture: "nod" })
  speak({
    text: "That's great! What was the most challenging part?",
    emotion: "warm"
  })

Avatar: nods, looks at user, smiles warmly, speaks the text aloud.
```

The agent selects all of these actions. The page executes them.

---

## Embodiment Capabilities

Persona uses **VRM 1.0** avatars rendered with Three.js and `@pixiv/three-vrm`.

- **Expressions**: 8 named emotional states with morph-target blending
- **Gaze**: Dynamic eye-tracking toward user, scene center, or away
- **Gestures**: Head and body animations (nod, tilt, lean, etc.)
- **Idle Humanization**: Continuous breathing, blinking, and micro-movements
- **Lip sync**: Approximated mouth movement during TTS (phoneme-level sync is not available via browser TTS)
- **Voice selection**: Gender preference per persona (browser SpeechSynthesis API)
- **Multiple personas**: Alex (Technical Interview), Ken (Language Coach), Steve (Presentation Coach), Harry (Debate Partner)

---

## Human Experience

1. Open the live URL in a supported browser
2. Click **START LISTENING** or **Start Conversation**
3. Speak naturally — Persona transcribes your speech in real time
4. Your speech becomes available to the AI agent via `get_user_transcript`
5. The agent calls WebMCP tools to respond
6. The avatar speaks, changes expression, and gestures
7. Listening resumes automatically after the avatar finishes speaking

Interruption handling: STT is paused while TTS is playing to prevent feedback loops.

---

## Architecture

```
src/
  webmcp/        → WebMCP tool registration (registerTools.ts)
  avatar/        → VRM runtime, expressions, gaze, gestures, humanization
  voice/         → Browser TTS engine (BrowserVoiceEngine.ts)
  session/       → Conversation session state machine
  agent/         → Agent adapter (no-op in production, MockAgent in dev)
  config/        → Persona definitions (name, model URL, voice preference)
  components/    → UI components (ConversationControls, Transcript, ManualControls)
  dev/           → Development-only: MockAgent + MockAgentConsole
  types/         → Shared TypeScript types
  utils/         → STT utilities

public/
  models/        → VRM model files (Alex0.1.vrm, Ken0.1.vrm, etc.)
  background/    → Persona background images
  persona.png    → App logo
```

The `src/dev/` directory is **development-only**. It is compiled into the bundle but never rendered unless `VITE_ENABLE_MOCK_AGENT=true` is explicitly set.

---

## Local Development

### Prerequisites

- Node.js 18 or higher
- npm

### Install & Run

```bash
git clone <repository-url>
cd persona
npm install
npm run dev
```

Dev server: [http://localhost:5173](http://localhost:5173)

### Enable Mock Agent (optional, local testing only)

Create a `.env` file:

```bash
VITE_ENABLE_MOCK_AGENT=true
```

The Mock Agent console panel will appear in the browser, allowing you to simulate WebMCP tool calls without a real ChatGPT agent.

---

## Production Build

```bash
npm run build
```

Output: `dist/`

Preview locally:

```bash
npm run preview
```

Preview server: [http://localhost:4173](http://localhost:4173)

---

## Deployment

Persona is a **Vite static SPA** — no server required.

Deploy `dist/` to any static hosting provider:

| Provider        | Method                              |
|----------------|--------------------------------------|
| Vercel          | `vercel --prod` or GitHub integration |
| Netlify         | Drag-drop `dist/` or GitHub integration |
| Cloudflare Pages| GitHub integration, build cmd: `npm run build`, output: `dist` |
| GitHub Pages    | Use `gh-pages` or Actions workflow  |

**SPA routing:** The app uses no client-side routing, so no rewrite rules are required.

**Required environment variables for production:** None. Do not set `VITE_ENABLE_MOCK_AGENT` in production.

For full deployment instructions, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## WebMCP Testing

### Requirements

- Chrome 131+ with WebMCP enabled, **or**
- ChatGPT's in-app browser (preferred for judging)

### Enable WebMCP in Chrome (for local testing)

1. Open `chrome://flags/#enable-webmcp-testing`
2. Set to **Enabled**
3. Restart Chrome
4. Open the Persona URL
5. In the browser console, verify:
   ```javascript
   document.modelContext
   // → ModelContext { registerTool: f, ... }
   ```

### Discover registered tools

```javascript
const tools = await document.modelContext.getTools();
tools.forEach(t => console.log(t.name, '-', t.description));
// → speak - Make the virtual interviewer speak...
// → get_user_transcript - Retrieve the latest human speech...
// → perform_gesture - Make the virtual interviewer perform...
// → set_expression - Change the facial expression...
// → set_attention - Direct the gaze...
```

### Test a tool

```javascript
const tools = await document.modelContext.getTools();
const speak = tools.find(t => t.name === 'speak');
await document.modelContext.executeTool(speak, JSON.stringify({
  text: "Hello! I'm ready for your interview.",
  emotion: "warm"
}));
```

For complete judge testing instructions, see [`docs/JUDGE_TESTING.md`](docs/JUDGE_TESTING.md).

---

## Judge Testing (Quick Start)

1. Open the **live URL** in ChatGPT's in-app browser or Chrome with WebMCP enabled
2. Allow microphone access if prompted
3. Click **START LISTENING**
4. Say: *"I just finished my AI project"*
5. Observe the avatar listening, then responding
6. From ChatGPT, ask it to discover and invoke tools on the current page
7. Ask it to set the expression to `skeptical` and say *"Tell me more about that"*
8. Observe the avatar's expression change and hear the speech

---

## Development Mock Agent

The **Mock Agent** is a deterministic local test harness that simulates an AI agent without requiring ChatGPT or an internet connection.

- **Why it exists:** To test the WebMCP tool boundary end-to-end during local development
- **How to enable:** Set `VITE_ENABLE_MOCK_AGENT=true` in `.env`
- **What it does:** Intercepts user speech, runs a simple reasoning engine, and calls `speak`, `set_expression`, `perform_gesture`, and `set_attention` through the same tool handlers that a real WebMCP agent uses
- **It is NOT the production agent** — it is never shown on the live URL

---

## Known Limitations

- **Browser speech recognition:** Web Speech API (STT) is Chrome-only in most environments. Firefox and Safari may not support it.
- **Browser TTS voice availability:** `SpeechSynthesis` voices vary by OS/browser. The avatar always attempts to speak but the voice quality depends on the available voices.
- **Lip sync:** Mouth movement is approximated using audio timing, not phoneme data. Browser TTS does not expose phoneme-level timestamps.
- **WebMCP host requirement:** `document.modelContext` is only available in ChatGPT's in-app browser or Chrome with the WebMCP flag enabled. In other browsers, the WebMCP status shows "OFFLINE" and tools are not registered — the avatar is still functional via manual controls.
- **No persistent memory:** Conversation state lives in React memory only. Refreshing the page resets the session.

---

## Project Structure

```
persona/
├── src/
│   ├── agent/           Agent adapter (prod: no-op, dev: MockAgent)
│   ├── avatar/          VRM avatar runtime and humanization
│   │   ├── animation/   Gesture + idle animation systems
│   │   ├── behavior/    Humanization engine (blink, breathe, micro-move)
│   │   └── expression/  Expression profiles + VRM capability detection
│   ├── components/      UI components
│   ├── config/          Persona definitions
│   ├── dev/             Dev-only: MockAgent + MockAgentConsole
│   ├── session/         Conversation session state machine
│   ├── types/           Shared TypeScript types
│   ├── utils/           STT utilities
│   ├── voice/           Browser TTS engine
│   ├── webmcp/          WebMCP tool registration ← KEY FILE
│   ├── App.tsx          Main application
│   └── main.tsx         Entry point
├── public/
│   ├── models/          VRM avatar files (Alex0.1.vrm, Ken0.1.vrm, etc.)
│   ├── background/      Persona background images
│   └── persona.png      App logo
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── JUDGE_TESTING.md
│   ├── WEBMCP.md
│   ├── CHANGELOG_HACKATHON.md
│   └── RELEASE_CHECKLIST.md
├── .env.example         Safe environment variable template
├── LICENSE              MIT License
└── README.md            This file
```

---

## Hackathon: Why This is an Agent-Native Web App

Persona was built specifically for the **WebMCP Challenge**.

**The website is the agent's embodied environment.** The agent does not generate a web page — it inhabits one. The VRM avatar is the agent's visible body.

**WebMCP is the action interface.** Every visible behavior — speech, expression, gaze, gesture — is driven by a structured tool call from the agent. The agent decides what to do; the page executes it faithfully.

**The agent can perceive the human.** `get_user_transcript` gives the agent structured access to what the human said, without the agent needing to control the browser's audio stream.

**Humans remain active participants.** The human speaks naturally. The avatar responds in kind. The interaction is bidirectional and embodied — not a text exchange.

**What's possible now that wasn't before:**
- An AI agent can conduct a spoken conversation through a human-realistic avatar body
- The agent controls expression, attention, and speech as independent, composable actions
- Judges and users can observe the agent's reasoning expressed through visible avatar behavior
- No backend, no custom LLM, no authentication — just WebMCP + the browser

---

## License

MIT — see [LICENSE](LICENSE)
