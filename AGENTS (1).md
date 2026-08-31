# PERSONA — AGENTS.md

## 1. Project Identity

**Project:** Persona  
**Tagline:** Give a ChatGPT agent a body. Practice a hard conversation with it.

Persona is a WebMCP-native embodied-agent experience. The ChatGPT agent is the mind; the web application is the embodied environment; a 2D virtual interviewer is the visible body/persona. A real human interacts with the agent through ChatGPT voice or text, while the agent uses WebMCP tools exposed by Persona to control the virtual person's speech, emotion, interview progression, difficulty, and session state.

## 2. Non-Negotiable Product Definition

The product is NOT:
- a generic chatbot
- an AI avatar demo
- a contract/dashboard app
- a custom LLM wrapper
- a conventional voice assistant
- a collection of unrelated AI features

The product IS:
> A human and a ChatGPT agent sharing a live interview environment, where the agent embodies a consistent virtual interviewer and visibly changes its behavior through WebMCP.

Core loop:

Human ↔ ChatGPT Agent ↔ WebMCP ↔ Persona Webpage ↔ Virtual Interviewer

The webpage is the agent's body/environment. WebMCP is the action interface.

## 3. Scope Lock — DO NOT VIOLATE

For the 4-day hackathon MVP:

- ONE scenario: Technical Interview Rehearsal.
- ONE interviewer persona.
- ONE 2D animated avatar.
- 5–6 clearly distinguishable visual states.
- No 3D avatar.
- No photorealistic avatar.
- No database.
- No authentication.
- No multi-user system.
- No custom STT pipeline.
- No custom TTS pipeline.
- No bespoke backend LLM integration unless a specific implementation blocker requires it.
- ChatGPT owns the human↔agent conversational/voice interface.
- The webpage renders and manages state resulting from WebMCP tool calls.
- Session state may live in React state/localStorage for the demo.
- No language-learning café.
- No presentation audience.
- No multi-persona library.
- No rewind/branching in v1.
- Do not add features simply because they sound impressive.

If a proposed feature does not improve the core human-agent embodied interaction, reject it.

## 4. Primary Hackathon Goal

Optimize for the judging criteria:
1. Strong and unmistakable WebMCP leverage.
2. High execution quality.
3. Real-world impact.
4. Creativity/novelty.

The winning moment is not visual polish alone.

The winning moment is:
> The judge watches the interviewer visibly change expression/behavior and questioning style because the ChatGPT agent decided to react to the human's answer.

WebMCP must be load-bearing.

Kill test:
> If WebMCP were removed, would the core experience lose something important?

If NO, rethink the implementation.

## 5. Product Promise

Persona lets people rehearse difficult conversations with an AI person that behaves like a participant rather than replying like a chatbot.

For v1, the difficult conversation is a technical interview.

The interviewer should have:
- a role
- personality
- goal
- hidden evaluation objective
- emotional state
- behavior rules
- adaptive difficulty
- conversational memory

## 6. Persona State Model

```ts
type PersonaState = {
  role: string;
  personality: string[];
  goal: string;
  difficulty: number; // 1–10
  emotionalState: {
    trust: number;       // 0–100
    curiosity: number;   // 0–100
    frustration: number; // 0–100
    confidence: number;  // 0–100
  };
  behaviorRules: string[];
};
```

Example persona:

- Role: Senior Engineering Manager
- Personality: professional, skeptical, fair, observant
- Goal: evaluate technical reasoning and communication under pressure
- Hidden objective: determine whether the candidate can remain clear and structured when challenged
- Rules:
  - Never insult the candidate.
  - Ask follow-ups when answers are vague.
  - Increase difficulty after strong answers.
  - Do not reveal hidden evaluation criteria.
  - Maintain professional respect.
  - Adapt based on previous answers.

Emotional state must affect future behavior. Do not implement random emotional changes.

## 7. WebMCP Tool Contract

Use only these 8 initial tools unless explicitly approved:

### 1. speak
Purpose: make the virtual interviewer speak.

Input:
- text: string
- emotion: neutral | warm | skeptical | impressed | stern

Visible result:
- avatar enters speaking state
- matching expression/state
- transcript receives the line

### 2. set_emotion
Purpose: update persistent emotional state.

Input:
- trust: 0–100
- curiosity: 0–100
- frustration: 0–100
- confidence: 0–100

Visible result:
- avatar/state changes appropriately
- small live meters may update

### 3. next_question
Purpose: advance interview.

Input:
- topic: string
- difficulty: 1–10

Visible result:
- progress tracker advances
- current question/topic updates

### 4. flag_moment
Purpose: record a meaningful strong/weak moment.

Input:
- note: string
- severity: minor | major

Visible result:
- scorecard/session log updates

### 5. set_difficulty
Purpose: change interview difficulty.

Input:
- level: 1–10

May be called by:
- agent adaptation
- human Director Mode

### 6. get_session_state
Purpose: provide current session state and working memory to the agent.

Returns:
- transcript
- emotional history
- questions/topics
- flagged moments
- difficulty
- session status

### 7. end_session
Purpose: close the interview and trigger readiness report.

Input:
- summary: string

Visible result:
- session closes
- report becomes available/exportable

### 8. get_persona_definition
Purpose: provide role/personality/goal/rules so the agent can stay consistent.

## 8. Architecture

Frontend:
- React
- TypeScript
- Vite
- clean component architecture
- WebMCP registration in browser
- local state/localStorage only

Runtime relationship:

```text
Human
  ↕ voice/text
ChatGPT
  ↓ reasoning
WebMCP tool calls
  ↓
Persona webpage
  ↓
React state
  ↓
2D virtual interviewer
  ↓
visible speech/emotion/behavior
```

Do not accidentally replace this with:
```text
Browser → our backend → OpenAI API → avatar
```

That is not the intended hackathon architecture.

## 9. Day-by-Day Build Priorities

### Day 1 — Prove the WebMCP Loop
Highest priority.

Build:
- basic React page
- primitive avatar state machine
- `speak()` WebMCP tool
- ChatGPT discovery/call test

Acceptance:
ChatGPT can discover and invoke `speak()` and the webpage visibly changes.

If this fails, stop feature work and troubleshoot WebMCP compatibility.

### Day 2 — Persona + Full Tools
Build:
- persona definition
- emotional state
- remaining 7 tools
- interview progression
- scorecard
- session log

### Day 3 — Director Mode + Report
Build:
- user difficulty/aggression override
- live state visualization
- final readiness report
- export

### Day 4 — Freeze + De-risk
No major new features.

Do:
- fresh-browser testing
- deployed WebMCP testing
- bug fixing
- accessibility/basic UX polish
- public GitHub repository
- open-source license
- README
- demo recording under challenge limit
- exact live demo rehearsal
- text-input fallback

## 10. UI Principles

The UI should feel like a calm, premium ChatGPT-like product:
- minimal
- spacious
- strong typography
- restrained visual hierarchy
- subtle borders
- soft surfaces
- no visual clutter
- no unnecessary gradients
- no dashboard overload
- no "AI slop" aesthetics
- no excessive glassmorphism
- no giant hero section inside the interview
- no excessive animations

Primary focus:
1. virtual interviewer
2. conversation/session state
3. unobtrusive controls
4. Director Mode
5. final report

The avatar is the visual focal point, but the interface must communicate that it is an agent-controlled persona.

## 11. Frontend Engineering Rules for Antigravity

You are the implementation agent. Behave like a senior frontend engineer, not a feature generator.

Before changing code:
- inspect the current project structure
- inspect relevant files
- understand existing state flow
- do not blindly rewrite files
- do not introduce a framework migration
- do not add dependencies unless justified

During implementation:
- prefer small, reversible changes
- keep components focused
- use TypeScript types
- avoid duplicated state
- centralize persona/session state
- keep WebMCP registration isolated from presentation components
- make tool handlers deterministic and testable
- use semantic HTML
- preserve responsive behavior
- keep console clean
- avoid hardcoded state scattered across components

Never:
- invent APIs without checking the current project/docs
- create a backend just because it feels more "professional"
- install libraries to solve problems that can be solved with existing code
- build speculative features
- refactor unrelated code during feature work
- replace working implementation merely for stylistic reasons

## 12. WebMCP Safety Rules

WebMCP tool descriptions must be explicit and meaningful.

Each tool should have:
- clear name
- precise description
- strict input schema
- deterministic webpage-side behavior

Tool calls should produce visible, explainable changes.

Do not create fake tool calls solely for visual effects.

The page must remain usable if tools are unavailable.

Provide manual fallback controls for local testing where practical, but the final demo must demonstrate actual agent invocation.

## 13. State/Behavior Rules

State transitions should be believable.

Example:
- vague answer → curiosity may rise, trust may fall, skepticism may rise
- strong answer → trust/interest may rise, difficulty may increase
- repeated poor answers → frustration can rise gradually
- recovery → confidence/trust can recover

Do not expose hidden evaluation criteria during the interview.

Do not make emotion meters the product. They are supporting visualization.

Behavior should be driven by persona state and agent tool calls, not random timers.

## 14. Report Requirements

The final readiness report should contain:
- session summary
- transcript
- emotional-state timeline
- flagged moments
- strengths
- weaknesses
- readiness score
- actionable recommendations

The report is an artifact of the session, not merely a decorative result screen.

## 15. Demo Priority

The ideal demo sequence:

1. Open Persona.
2. Start technical interview.
3. ChatGPT agent interacts with the page through WebMCP.
4. Human answers.
5. Agent detects a weak/vague answer.
6. Agent calls emotion/flag/next-question tools.
7. Avatar visibly becomes more skeptical and asks a sharper follow-up.
8. Human answers again.
9. Human uses Director Mode to increase difficulty.
10. Interview ends.
11. Readiness report appears.

The "wow" should happen early.

## 16. Decision Rule

When uncertain between:
- impressive vs reliable → choose reliable
- more features vs polished core → choose polished core
- complex architecture vs simple architecture → choose simple architecture
- realistic avatar vs clear state change → choose clear state change
- speculative improvement vs tested behavior → choose tested behavior

## 17. Antigravity Working Style

Operate in this order:

1. Inspect.
2. Plan briefly.
3. Implement the smallest useful change.
4. Run/check it.
5. Fix errors.
6. Report exactly what changed and what was verified.
7. Stop.

Do not continuously expand scope.

When a blocker appears:
- identify the blocker
- test the smallest hypothesis
- report evidence
- propose the minimum next action

Do not hide failures.

Do not claim WebMCP works unless it has actually been tested.

## 18. Definition of Done for MVP

Persona is MVP-ready when:
- live page loads reliably
- WebMCP tools are registered
- ChatGPT can discover/call them in a supported environment
- `speak()` visibly controls the avatar
- emotional state visibly changes
- interview progresses
- difficulty can change
- moments can be flagged
- session state is retrievable
- final report renders
- the experience works on the deployed URL
- public repo has an open-source license
- demo is reproducible from a clean environment

## 19. What NOT to Optimize

Do not optimize for:
- maximum number of tools
- maximum number of personas
- maximum animation complexity
- maximum number of scenarios
- maximum backend sophistication
- maximum AI buzzwords

Optimize for:
> **One unmistakable human + agent interaction that could not exist in the same form without WebMCP.**
