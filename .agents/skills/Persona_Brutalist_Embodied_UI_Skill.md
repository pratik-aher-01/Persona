# Persona — Brutalist Embodied UI Skill

## Purpose
Design Persona as an **embodied interface for an external AI agent**, not as a dashboard or chatbot. The virtual character is the hero; WebMCP capabilities are visible proof of agent control.

## Visual language
- Pure white canvas: `#FFFFFF`
- Structural ink: `#191817`
- IBM Blue: `#0F62FE`
- Pale blue surface tint: `#F5F8FF`
- Crisp 2px black borders
- 2–4px hard offset shadows, zero/very little blur
- Serif display typography: Fraunces / Playfair Display / Georgia
- IBM Plex Sans for body
- IBM Plex Mono for technical labels
- Minimal palette
- Subtle 3D depth
- No glassmorphism
- No neon cyberpunk
- No generic SaaS dashboard
- No generic ChatGPT clone

## Hierarchy
1. Large virtual Persona
2. Human voice interaction
3. Agent capabilities/activity
4. System chrome

Persona should occupy roughly 60–70% of the desktop visual attention.

## Layout
Desktop:
- Top: minimal `PERSONA` wordmark + `WEBMCP CONNECTED`
- Left rail: `SCENARIO` with Interview / Language / Rehearsal
- Center: dominant Persona stage, avatar, speech bubble, state animation
- Right: `AGENT CAPABILITIES` and `AGENT ACTIVITY`
- Bottom: voice input + current turn status

On small screens, collapse the side rails while keeping Persona large.

## Persona stage
The center is a stage, not a small card.
- Make avatar large and expressive.
- Preserve existing avatar functionality and emotion states.
- Add restrained dimensional depth/platform.
- Speech bubble should visually originate from Persona.
- Speaking/listening/thinking states must be obvious.

States:
- `IDLE`
- `LISTENING`
- `AGENT THINKING`
- `SPEAKING`

## Scenario rail
Use compact brutalist controls:
- `🎤 INTERVIEW`
- `◉ LANGUAGE`
- `🎭 REHEARSAL`

Selected = blue fill, white text, hard shadow.
Inactive = white, black border, black text.

These are UI modes only unless behavior already exists. Do not invent backend/agent behavior.

## Agent capabilities
Right panel title: `AGENT CAPABILITIES`

Show only real WebMCP capabilities. Current tools:
- `SPEAK` — Make Persona speak
- `GET USER TRANSCRIPT` — Read the latest human utterance

When a real tool call occurs, show a small `✓ CALLED` / `CALLED JUST NOW` state.

Do not fake calls.

## Agent activity
Show safe action summaries using real application state where available:
- `READ — get_user_transcript`
- `ACT — speak()`
- `PERSONA SPEAKING`

Never expose private chain-of-thought. Show actions, not hidden reasoning.

## Human voice input
Make the user feel like they are talking to a person, not typing to ChatGPT.
- Idle: `🎙 START LISTENING`
- Active: `🔴 LISTENING...`
- Show `YOU SAID` and the transcript.
- Preserve interim transcript support.
- Keep input visually secondary to Persona.

## Top bar
Keep minimal:
`PERSONA` / `EMBODIED AGENT`
and `● WEBMCP CONNECTED`

## Bottom status
Show current state:
`● IDLE`, `● LISTENING`, `◌ AGENT THINKING`, `● SPEAKING`

## 3D/brutalism rules
Use depth selectively on:
- avatar/platform
- speech bubble
- primary buttons
- selected scenario

Do not make every element a floating 3D card.

## Engineering rules
Preserve all existing functionality:
- WebMCP `speak()`
- WebMCP `get_user_transcript()`
- SpeechSynthesis audio
- SpeechRecognition microphone
- `pendingUserUtterance`
- `utteranceId`
- turn states
- microphone muting during Persona speech
- existing WebMCP registration

Do not add:
- LLM API
- backend
- authentication
- fake tools
- fake agent activity
- MCP configuration changes

## Quality test
A judge seeing the page for three seconds should understand:
**“This is a virtual person I can talk to, and an AI agent can control through WebMCP.”**

The character is the hero. The tools are the proof. The UI is the stage.
