# Persona — Judge Testing Guide

## Overview

This guide explains how to test Persona as a judge for the WebMCP Challenge.

**What you are testing:**
- A 3D animated avatar that an AI agent (ChatGPT) controls via WebMCP
- The human speaks → the agent reads transcript → the agent makes the avatar respond

---

## Option A — ChatGPT In-App Browser (Preferred)

This is the primary judging environment.

1. Open ChatGPT (web or desktop)
2. Start a conversation with ChatGPT
3. Paste the live URL into the chat and ask ChatGPT to open it
4. ChatGPT's built-in browser will open Persona
5. Ask ChatGPT: *"What tools does this page expose?"*
6. ChatGPT will discover the WebMCP tools and list them
7. Ask ChatGPT to invoke them (see test flows below)

---

## Option B — Chrome with WebMCP Flag

For manual browser-based testing:

### Setup

1. Install Chrome 131+
2. Open `chrome://flags/#enable-webmcp-testing`
3. Set to **Enabled**
4. Click **Relaunch**
5. Open the Persona live URL

### Verify WebMCP is active

Open Chrome DevTools (F12) → Console:

```javascript
document.modelContext
// Should return: ModelContext { registerTool: f, getTools: f, ... }
// If undefined: WebMCP flag is not enabled in this browser
```

### Discover the registered tools

```javascript
const tools = await document.modelContext.getTools();
tools.forEach(t => console.log(t.name, '-', t.description));
```

Expected output:
```
speak - Make the virtual interviewer speak with a specified text and emotional expression.
get_user_transcript - Retrieve the latest human speech utterance captured by Persona...
perform_gesture - Make the virtual interviewer perform a body gesture.
set_expression - Change the facial expression of the virtual interviewer.
set_attention - Direct the gaze and eye-contact attention target...
```

---

## Test Flows

### Test 1 — Basic Avatar Response

1. Open the live URL
2. Allow microphone if prompted
3. Click **START LISTENING** (bottom left)
4. Say: *"Hello, I just finished my AI project"*
5. Observe the transcript appear at the bottom
6. The WebMCP agent (or Mock Agent in dev) picks this up and the avatar responds

### Test 2 — Direct Tool Invocation (Chrome with DevTools)

Open DevTools console and run:

```javascript
// Make the avatar speak with a warm expression
const tools = await document.modelContext.getTools();
const speak = tools.find(t => t.name === 'speak');
await document.modelContext.executeTool(speak, JSON.stringify({
  text: "That's a fascinating project! Tell me more about the technical challenges.",
  emotion: "impressed"
}));
```

Expected: Avatar begins speaking, speech bubble appears, expression changes to "impressed".

```javascript
// Change the expression
const expr = tools.find(t => t.name === 'set_expression');
await document.modelContext.executeTool(expr, JSON.stringify({
  expression: "skeptical"
}));
```

Expected: Avatar expression shifts to skeptical.

```javascript
// Change gaze
const attn = tools.find(t => t.name === 'set_attention');
await document.modelContext.executeTool(attn, JSON.stringify({
  target: "away"
}));
```

Expected: Avatar looks away thoughtfully.

```javascript
// Perform a gesture
const gesture = tools.find(t => t.name === 'perform_gesture');
await document.modelContext.executeTool(gesture, JSON.stringify({
  gesture: "nod"
}));
```

Expected: Avatar nods.

```javascript
// Read the user transcript
const transcript = tools.find(t => t.name === 'get_user_transcript');
const result = await document.modelContext.executeTool(transcript, JSON.stringify({}));
console.log(result);
```

Expected: Returns the last thing the human said.

---

### Test 3 — Full Conversation via ChatGPT

1. Open Persona in ChatGPT's in-app browser
2. Click **START LISTENING**
3. Say: *"I'm applying for a senior engineering role and I want to practice"*
4. The avatar should listen, then respond through the agent
5. Continue the conversation for 2–3 turns
6. Observe: expression changes, gaze shifts, gestures during responses

---

## What to Look For

| Behavior | What it proves |
|----------|---------------|
| Avatar speaks in response to your words | `get_user_transcript` + `speak` working |
| Expression changes during speech | `set_expression` working |
| Avatar looks at/away from camera | `set_attention` working |
| Avatar nods or tilts head | `perform_gesture` working |
| WebMCP CONNECTED badge in header | `document.modelContext.registerTool` succeeded |

---

## Settings & Manual Controls

Click the **⚙ Settings & Tuning** button (bottom left) to open the avatar calibration panel.

From here you can:
- Manually trigger any expression
- Manually trigger any gesture
- Manually make the avatar speak a test phrase
- Adjust camera, lighting, and avatar position

This is useful for verifying the avatar is working without a WebMCP agent.

---

## Personas

Click the **PERSONAS** tab (left edge) to switch between:

- **Alex** — Technical Interview
- **Ken** — Language Coach
- **Steve** — Presentation Coach
- **Harry** — Debate Partner

Each persona loads a different VRM model and voice preference.

---

## Known Limitations for Judges

- **STT is Chrome-only:** Microphone capture (Web Speech API) may not work in all browsers. Chrome is recommended.
- **Voice quality:** Browser TTS voice quality varies by OS. On Windows, voices may sound robotic; on macOS, voices are generally higher quality.
- **WebMCP availability:** The WebMCP status badge in the top-right shows ONLINE/OFFLINE. OFFLINE means this browser does not expose `document.modelContext`. In that case, use the manual controls or switch to a WebMCP-enabled environment.
- **VRM load time:** VRM files are 14–16 MB. Allow 5–10 seconds on first load for the avatar to appear.

---

## Questions?

See:
- [`docs/WEBMCP.md`](WEBMCP.md) — WebMCP implementation details
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — System architecture
- [`src/webmcp/registerTools.ts`](../src/webmcp/registerTools.ts) — Tool registration source code
