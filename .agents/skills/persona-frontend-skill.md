# Persona Frontend Skill
## Clean, Calm, ChatGPT-Inspired Interface

### Purpose

Build Persona with a premium, minimal interface inspired by the clarity and restraint of modern ChatGPT—not a visual clone.

The UI should feel:
- calm
- intelligent
- focused
- spacious
- trustworthy
- responsive
- deliberate

The virtual interviewer is the primary visual focus.

---

## 1. Design Philosophy

### Do
- use generous whitespace
- establish a strong typographic hierarchy
- use neutral surfaces
- use subtle borders/dividers
- keep controls obvious but quiet
- use animation only when it communicates state
- make the interview feel like a focused workspace
- prioritize readability

### Don't
- use neon gradients
- overuse glassmorphism
- create card grids everywhere
- use huge decorative illustrations
- add floating widgets without purpose
- use excessive shadows
- use flashy AI imagery
- use "dashboard" aesthetics
- imitate ChatGPT branding/logo directly

---

## 2. Visual Hierarchy

Priority order:

1. Virtual interviewer
2. Current conversational state
3. User/Director controls
4. Small supporting session metrics
5. Transcript/session details

The page should immediately communicate:

> "I am in a live interview with an AI person."

---

## 3. Layout

Preferred desktop structure:

```text
┌────────────────────────────────────────────────────────────┐
│ Persona                                  Interview • 07:32 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                 VIRTUAL INTERVIEWER                       │
│                                                            │
│                    [ AVATAR ]                              │
│                                                            │
│               "Tell me about a project..."                │
│                                                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Session     Question 4/8     Difficulty 6                 │
│                                                            │
│ [ Director Mode ]                     [ End Interview ]    │
└────────────────────────────────────────────────────────────┘
```

Avoid making every region a separate rounded card.

Use grouping, whitespace, and subtle separators instead.

---

## 4. Color System

Use a restrained neutral palette.

Suggested semantic roles:

```css
--background
--surface
--surface-subtle
--border
--text-primary
--text-secondary
--text-muted
--accent
--success
--warning
--danger
```

Do not hardcode colors throughout components.

Use CSS variables/tokens.

Accent color should be used sparingly for:
- active controls
- progress
- selected state
- important actions

Emotions may have subtle visual distinctions, but never turn the entire UI into a rainbow.

---

## 5. Typography

Prefer a clean system/sans-serif stack.

Example:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Hierarchy:

- page title: strong but not oversized
- section title: medium
- body: highly readable
- metadata: small and muted
- avatar dialogue: prominent

Do not use decorative fonts.

---

## 6. Avatar Design

The avatar is a 2D animated character.

Required states:

```text
idle
listening
thinking
speaking
skeptical
impressed
stern
warm
```

Not every state needs a unique asset.

States may be composed from:
- SVG layers
- CSS transforms
- facial elements
- subtle motion
- expression changes

The important requirement:

> A judge must immediately see that the agent changed the person's behavior.

Animation guidelines:
- 150–400ms transitions for ordinary changes
- speaking can use subtle mouth animation
- emotion changes should be visible but not cartoonish
- avoid constant motion
- avoid bouncing UI

---

## 7. Emotional State Visualization

Emotional meters are secondary.

Use a compact section such as:

```text
Trust       ━━━━━━━━── 78
Curiosity   ━━━━━━━━━─ 84
Frustration ━━━─────── 28
Confidence  ━━━━━━━─── 71
```

Keep it visually quiet.

Do not make the app look like a game HUD.

---

## 8. Director Mode

Director Mode is the main human-control mechanism.

Preferred interaction:

```text
Director Mode
────────────────────────
Difficulty

  1  2  3  4  5  6  7  8  9  10

Behavior
  [ Collaborative ] [ Neutral ] [ Aggressive ]

              [ Apply ]
```

Use a modal/sheet/popover only if it genuinely improves focus.

The user should understand:
> "I can change how the agent behaves."

---

## 9. Transcript

Transcript should be compact and readable.

Example:

```text
INTERVIEW

Alex
Tell me about a technical project you built.

You
I built a recommendation system...

Alex
What part did you personally implement?

────────────────────────────
Flagged moment • Major
Answer lacked implementation detail.
```

Do not make the transcript look like a generic messaging app.

The stage is primary.

---

## 10. Session Header

Keep the top bar minimal:

```text
Persona
Technical Interview
Question 4 / 8
07:32
```

Avoid:
- huge logos
- excessive navigation
- profile menus
- settings unrelated to the demo

---

## 11. Report Design

The readiness report should feel like a polished professional assessment.

Structure:

```text
Interview Readiness
────────────────────────────

Overall readiness
78 / 100

Communication      82
Technical depth    76
Clarity            71
Pressure handling  64

Strong moments
...

Needs attention
...

Emotional journey
[compact chart]

Recommended practice
1.
2.
3.

[ Export Report ]
```

Use whitespace and typography instead of excessive cards.

---

## 12. Responsive Behavior

Desktop is primary because the hackathon demo is desktop-first.

Still support:
- 1280px+
- 1024px
- tablet-ish widths

At narrow widths:
- stack avatar and session information
- keep controls reachable
- avoid horizontal scrolling
- preserve readable dialogue

---

## 13. Accessibility

Implement:
- semantic buttons
- visible focus states
- keyboard navigation
- sufficient text contrast
- `aria-label` where icon-only buttons are used
- reduced-motion support
- status announcements for important state changes where appropriate

Do not sacrifice accessibility for aesthetics.

---

## 14. Animation Rules

Animation should communicate:

- speaking
- listening
- thinking
- emotional change
- progress
- tool-driven state updates

Never animate:
- everything
- every button
- every card
- background decoration

Prefer:
```css
transition:
  transform 180ms ease,
  opacity 180ms ease,
  border-color 180ms ease;
```

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

---

## 15. Component Structure

Prefer something close to:

```text
src/
  components/
    avatar/
      Avatar.tsx
      AvatarState.ts
    interview/
      InterviewStage.tsx
      InterviewHeader.tsx
      Transcript.tsx
      SessionStatus.tsx
    director/
      DirectorMode.tsx
    report/
      ReadinessReport.tsx
  state/
    personaState.ts
    sessionState.ts
  webmcp/
    registerTools.ts
    toolHandlers.ts
    schemas.ts
  styles/
    tokens.css
    globals.css
  App.tsx
```

Adjust to the actual project structure rather than forcing this structure blindly.

---

## 16. State Architecture

Keep state centralized.

Suggested model:

```ts
type InterviewSession = {
  status: "idle" | "active" | "ended";
  questionIndex: number;
  questions: Question[];
  transcript: TranscriptEntry[];
  flaggedMoments: FlaggedMoment[];
  emotionalHistory: EmotionalSnapshot[];
  difficulty: number;
  persona: PersonaState;
};
```

WebMCP handlers should update this state through a controlled state layer.

Do not manipulate random DOM elements directly from WebMCP handlers.

React state should drive rendering.

---

## 17. WebMCP UI Feedback

Whenever a tool changes the page, make the change legible.

Example:

Agent calls:
```text
set_emotion(...)
```

UI:
- avatar expression changes
- small "Interviewer state changed" indication may appear

Agent calls:
```text
next_question(...)
```

UI:
- question progress changes

Agent calls:
```text
flag_moment(...)
```

UI:
- session log receives a flagged entry

Avoid intrusive toast spam.

---

## 18. Empty / Loading / Error States

Build graceful states.

### Waiting for agent

> Waiting for your interviewer…

### Thinking

> Alex is thinking…

### Tool unavailable

> Agent controls aren't available in this browser.

### Ended

> Interview complete.

Do not show raw stack traces or technical errors to users.

---

## 19. Copywriting Style

Use concise, human language.

Prefer:
- "Start interview"
- "Director Mode"
- "End interview"
- "Replay answer"
- "Interview complete"
- "Needs attention"

Avoid:
- "Initialize AI protocol"
- "Execute cognitive simulation"
- "Activate neural persona"
- "Deploy intelligence engine"

No buzzword soup.

---

## 20. Quality Bar

Before declaring a UI task complete, verify:

- layout feels intentional
- no accidental overflow
- buttons have clear hierarchy
- typography is consistent
- avatar is visually dominant
- emotion changes are obvious
- controls are not cluttered
- responsive layout works
- no console errors
- no unnecessary dependency was added
- interaction states work
- tool-driven changes are visible

The goal is not "lots of UI."

The goal is:

> **A polished stage where an AI agent visibly inhabits a person.**
