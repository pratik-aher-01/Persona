# Persona — Release Checklist

Use this checklist before publishing the repository and submitting to Devpost.

---

## Development

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts the dev server at `http://localhost:5173`
- [ ] Avatar loads in the browser
- [ ] Voice (TTS) works
- [ ] Microphone (STT) works in Chrome
- [ ] Conversation flow works (start → speak → avatar responds → stop)
- [ ] `VITE_ENABLE_MOCK_AGENT=true` shows MockAgent console
- [ ] Mock Agent can complete a full conversation turn end-to-end

## Build & Lint

- [ ] `npm run build` exits with code 0
- [ ] `npm run lint` exits with no errors (warnings acceptable)
- [ ] `npm run preview` shows the production build correctly
- [ ] `dist/` contains `index.html`, `assets/`, and static files
- [ ] VRM models are NOT in `dist/` (they're served from `public/` as-is)
- [ ] Check `dist/` for any accidental secrets or local paths

## Production Verification

- [ ] MockAgent console is NOT visible on production build
- [ ] No development banners or debug UI visible
- [ ] Avatar loads from `/models/Alex0.1.vrm` (check Network tab)
- [ ] Background images load
- [ ] Logo loads
- [ ] No 404s for assets
- [ ] No fatal console errors
- [ ] WebMCP status pill shows (ONLINE if in supported browser, OFFLINE if not)

## WebMCP

- [ ] `document.modelContext` is available in WebMCP-enabled browser
- [ ] `await document.modelContext.getTools()` returns 5 tools
- [ ] Tool names: `speak`, `get_user_transcript`, `perform_gesture`, `set_expression`, `set_attention`
- [ ] `speak` tool successfully makes avatar speak
- [ ] `set_expression` tool changes avatar expression
- [ ] `set_attention` tool changes avatar gaze
- [ ] `perform_gesture` tool triggers avatar gesture
- [ ] `get_user_transcript` returns human speech after speaking

## Repository

- [ ] `.gitignore` ignores `node_modules/`, `dist/`, `.env`, scratch files
- [ ] `.env.example` present with safe placeholder values
- [ ] `LICENSE` (MIT) present at repository root
- [ ] `README.md` is complete and accurate
- [ ] `docs/DEPLOYMENT.md` is complete
- [ ] `docs/JUDGE_TESTING.md` is complete
- [ ] `docs/WEBMCP.md` is complete
- [ ] `docs/ARCHITECTURE.md` is complete
- [ ] `docs/CHANGELOG_HACKATHON.md` is complete
- [ ] No `.env` file with real secrets committed
- [ ] No `node_modules/` committed
- [ ] No scratch screenshots committed (`scratch_screenshot*.png`)
- [ ] No personal data in repository
- [ ] VRM files in `public/models/` are committed and tracked
- [ ] Background images in `public/background/` are committed and tracked
- [ ] `src/webmcp/registerTools.ts` is visible and uses real `registerTool()`

## Security

- [ ] No API keys in source
- [ ] No hardcoded secrets or tokens
- [ ] No absolute local paths (C:/, D:/, file://)
- [ ] No personal user directory paths
- [ ] Microphone usage is browser-native (no custom audio server)

## Deployment

- [ ] Repository is public on GitHub
- [ ] Live URL is accessible (HTTPS)
- [ ] Live URL serves the production build
- [ ] Avatar loads on the live URL
- [ ] Live URL has no CORS errors or missing assets
- [ ] Site is free to access (no login required)

## Devpost Submission

- [ ] Project name: Persona
- [ ] One-line description written
- [ ] WebMCP usage clearly explained in submission description
- [ ] Demo video link (YouTube, <3 minutes, with audio)
- [ ] Live URL provided
- [ ] Source code repository URL provided
- [ ] Judge testing instructions referenced (docs/JUDGE_TESTING.md)
- [ ] Hackathon changelog referenced (docs/CHANGELOG_HACKATHON.md)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ PASS | Verified working |
| ⚠️ PARTIAL | Works with limitations |
| ❌ BLOCKED | Cannot proceed without action |
| 🔲 NOT VERIFIED | Not yet tested |
