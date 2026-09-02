# Persona — WebMCP Implementation

## Overview

Persona registers **5 WebMCP tools** using `document.modelContext.registerTool(...)`.

Source file: [`src/webmcp/registerTools.ts`](../src/webmcp/registerTools.ts)

---

## Registration Pattern

Tools are registered at app startup using the standard WebMCP API:

```typescript
const modelContext = document.modelContext; // also checked on navigator, window

if (modelContext && typeof modelContext.registerTool === 'function') {
  await modelContext.registerTool({
    name: 'speak',
    title: 'Speak',
    description: '...',
    inputSchema: { type: 'object', properties: { ... }, required: [...] },
    execute: async (input) => { ... }
  });
}
```

This is real `document.modelContext.registerTool(...)` — not a simulation.

---

## Registered Tools

### 1. `speak`

```typescript
{
  name: 'speak',
  description: 'Make the virtual interviewer speak with a specified text and emotional expression.',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The dialogue text.' },
      emotion: {
        type: 'string',
        enum: ['neutral', 'warm', 'skeptical', 'impressed', 'stern', 'concerned', 'surprised', 'thinking']
      }
    },
    required: ['text', 'emotion']
  }
}
```

**Execute:** Calls `voiceEngine.speak()`, sets avatar status to `speaking`, updates UI expression.

---

### 2. `get_user_transcript`

```typescript
{
  name: 'get_user_transcript',
  description: 'Retrieve the latest human speech utterance captured by Persona.',
  annotations: { readOnlyHint: true },
  inputSchema: { type: 'object', properties: {} }
}
```

**Execute:** Returns `{ transcript, hasNewInput, utteranceId, isListening }`. Marks the utterance as consumed (`hasNewInput` returns `false` on re-poll until new speech).

---

### 3. `perform_gesture`

```typescript
{
  name: 'perform_gesture',
  description: 'Make the virtual interviewer perform a body gesture.',
  inputSchema: {
    type: 'object',
    properties: {
      gesture: {
        type: 'string',
        enum: ['nod', 'shake_head', 'head_tilt', 'acknowledge', 'agree', 'disagree', 'thinking', 'lean_forward', 'lean_back']
      }
    },
    required: ['gesture']
  }
}
```

**Execute:** Triggers the named gesture animation on the VRM avatar via the gesture animation system.

---

### 4. `set_expression`

```typescript
{
  name: 'set_expression',
  description: 'Change the facial expression of the virtual interviewer.',
  inputSchema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        enum: ['neutral', 'warm', 'skeptical', 'impressed', 'stern', 'concerned', 'surprised', 'thinking']
      }
    },
    required: ['expression']
  }
}
```

**Execute:** Updates the avatar expression state, which is consumed by the VRM expression blending system on the next render frame.

---

### 5. `set_attention`

```typescript
{
  name: 'set_attention',
  description: 'Direct the gaze and eye-contact attention target of the virtual interviewer.',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        enum: ['user', 'center', 'away']
      }
    },
    required: ['target']
  }
}
```

**Execute:** Changes the gaze system's target. The avatar smoothly interpolates eye and head rotation to point toward the target.

---

## Implementation Notes

### Idempotent Registration

The registration function uses `isRegistered` / `isRegistering` guards to prevent duplicate registrations on React re-renders. If the WebMCP host reports a `Duplicate tool name` error, it is caught and treated as already-registered.

### Injection Point Safety

The function checks `document.modelContext`, `navigator.modelContext`, and `window.modelContext` to be compatible with different WebMCP host implementations.

```typescript
const docMC = (document as unknown as { modelContext?: WebMCP.ModelContext }).modelContext;
const navMC = (navigator as unknown as { modelContext?: WebMCP.ModelContext }).modelContext;
const winMC = (window as unknown as { modelContext?: WebMCP.ModelContext }).modelContext;
const modelContext = docMC || navMC || winMC;
```

### Callback Architecture

Tool handlers are thin closures that delegate to React state setters and refs, keeping the WebMCP module decoupled from React internals:

```typescript
// In App.tsx
registerWebMcpTools(
  ({ text, emotion }) => handleSpeak(text, emotion, 'WebMCP'),
  () => ({ transcript: pendingUtterance, hasNewInput, ... }),
  (gesture) => gesturePlayRef.current?.(gesture),
  (expression) => handleEmotionChange(expression),
  (target) => attentionChangeRef.current?.(target)
);
```

### Development Adapter

`executeRegisteredTool()` is exported for the MockAgent test harness. It routes through `document.modelContext.executeTool()` if available, or falls back to direct handler dispatch. This ensures MockAgent and real WebMCP agents use the identical code path.

---

## Tool Discovery in Browser Console

```javascript
// List all tools
const tools = await document.modelContext.getTools();
console.log(tools.map(t => t.name));
// → ['speak', 'get_user_transcript', 'perform_gesture', 'set_expression', 'set_attention']

// Execute speak
const speak = tools.find(t => t.name === 'speak');
await document.modelContext.executeTool(speak, JSON.stringify({
  text: "Hello, let's begin your interview.",
  emotion: "warm"
}));
```

---

## What Makes This WebMCP-Native

- No agent code runs on the page. The page only exposes tools and executes them.
- The agent's reasoning (ChatGPT) happens entirely outside the page.
- All visible avatar behavior is a direct consequence of tool calls.
- `get_user_transcript` is the agent's only perception channel — no audio stream access.
- The page degrades gracefully when WebMCP is unavailable (manual controls remain usable).
