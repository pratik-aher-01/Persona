# Persona WebMCP Mock Agent Test Harness Manual

This document explains how to test the complete end-to-end agent interaction loop locally using the built-in development Mock Agent test harness.

---

## 1. How to Start the App

1. Open your terminal in the `persona` project directory:
   ```bash
   npm run dev
   ```
2. Open your browser to `http://localhost:5173/`.

---

## 2. Opening the Mock Agent Console Overlay

In the bottom right corner of the screen, click the **`🛠️ DEVELOPMENT — MOCK AGENT`** panel button to expand the Mock Agent Console overlay.

The panel features 4 tabs:
- **`PIPELINE`**: Shows real-time agent status (`LISTENING`, `THINKING`, `ACTING`, `SPEAKING`), last user transcript, agent intent/emotion decisions, and WebMCP tool execution logs (`set_expression`, `set_attention`, `perform_gesture`, `speak`).
- **`MEMORY`**: Shows extracted conversation facts (e.g. `project: BAVIS`, `domain: CCTV / video analytics`) and stored conversation turns.
- **`EVENTS`**: Shows a real-time chronological event log (`USER_SPEECH`, `TRANSCRIPT_READY`, `AGENT_THINKING`, `DECISION`, `TOOL_CALL`, `AGENT_COMPLETE`).
- **`TESTS`**: Shows real-time automated test assertion pass/fail badges for Tests 1 through 10.

---

## 3. How to Run the 5-Turn Automated Demo Script

1. Open the **`🛠️ DEVELOPMENT — MOCK AGENT`** console.
2. Click the **`Run Demo`** button.
3. The mock agent will automatically execute the deterministic 5-turn conversation sequence:

| Turn | Simulated User Speech | Agent Intent | Expected Expression | Expected Gesture | Expected Speech & Memory |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Turn 1** | *"Hey, I just finished my AI project."* | `achievement` | `impressed` | `acknowledge` | *"That's great! What was the most challenging part of the project?"* |
| **Turn 2** | *"It was really difficult. I almost gave up."* | `struggle` | `concerned` | `thinking` | *"That sounds tough. What helped you keep going when it got frustrating?"* |
| **Turn 3** | *"The hardest part was getting the model to work."* | `technical_discussion` | `thinking` | `explain_hand` | *"Getting AI models to perform reliably can be tricky..."* |
| **Turn 4** | *"The project is called BAVIS."* | `fact_store` | `warm` | `nod` | *"BAVIS is a great name! What does BAVIS do?"* <br/>*(Fact stored: `project: BAVIS`)* |
| **Turn 5** | *"It analyzes CCTV footage."* | `context_retrieval` | `impressed` | `hand_emphasis` | *"So BAVIS analyzes CCTV footage. What kind of specific events or anomalies are you trying to detect?"* <br/>*(Fact recalled: `BAVIS` + `CCTV`)* |

---

## 4. How to Run Manual and Automatic Speech Modes

### Automatic Mode
1. Click **`Mode: AUTOMATIC`**.
2. Click **`START LISTENING`** in the main Persona UI or speak into your microphone.
3. As soon as a user utterance completes, the mock agent automatically:
   - Captures transcript via `get_user_transcript`
   - Decides intent and emotion
   - Executes `set_expression`, `set_attention`, `perform_gesture`, and `speak` WebMCP tools sequentially
   - Updates memory and plays avatar response

### Manual Mode
1. Click **`Mode: MANUAL`**.
2. Speak into the microphone or enter a user transcript.
3. The transcript will be captured and displayed in the console under **`LAST USER TRANSCRIPT`**.
4. Click **`[ Process Turn ]`** to trigger agent reasoning and WebMCP tool executions on demand.

---

## 5. Verification Checklist (Tests 1–10)

- **Test 1**: User transcript reaches mock agent (`[✓] PASSED`).
- **Test 2**: Mock agent produces structured decision (`[✓] PASSED`).
- **Test 3**: Mock agent invokes WebMCP tool execution (`[✓] PASSED`).
- **Test 4**: Expression changes via `set_expression` (`[✓] PASSED`).
- **Test 5**: Gesture changes via `perform_gesture` (`[✓] PASSED`).
- **Test 6**: Attention/gaze changes via `set_attention` (`[✓] PASSED`).
- **Test 7**: Speech response produced via `speak()` (`[✓] PASSED`).
- **Test 8**: Conversation turn stored in memory (`[✓] PASSED`).
- **Test 9**: Contextual memory influences later turn (`[✓] PASSED`).
- **Test 10**: Strict WebMCP boundary with 0 direct avatar bypasses (`[✓] PASSED`).

---

## 6. Troubleshooting

- **No speech audio heard**: Ensure browser sound is unmuted and SpeechSynthesis permissions are granted.
- **Microphone error**: Verify Web Speech API microphone permissions in Chrome.
- **WebMCP Tool Log Empty**: Click `[ Run Demo ]` or speak a sentence while `Agent Active` is enabled.
