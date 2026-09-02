# Persona — Deployment Guide

## Overview

Persona is a **Vite static SPA** (Single Page Application). There is no backend server. Deployment means copying the `dist/` directory to a static hosting provider.

---

## Build

```bash
npm install
npm run build
```

Output directory: `dist/`

### Verify the build locally

```bash
npm run preview
```

Opens at `http://localhost:4173`.

Confirm before deploying:
- [ ] Avatar loads
- [ ] VRM model loads (Alex/Ken/Steve/Harry)
- [ ] UI renders correctly
- [ ] No console errors
- [ ] WebMCP status pill shows (ONLINE or OFFLINE depending on browser)

---

## Required Environment Variables

**None required for production.**

Do NOT set `VITE_ENABLE_MOCK_AGENT` in production. If unset, the MockAgent console is never rendered.

---

## Deployment Providers

### Option A — Vercel (Recommended)

1. Push repository to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repository
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click Deploy

No environment variables needed.

No rewrite rules needed (no client-side routing).

### Option B — Netlify

1. Push repository to GitHub
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Click Deploy

### Option C — Cloudflare Pages

1. Push repository to GitHub
2. Go to Cloudflare Dashboard → Pages → Create project → Connect to Git
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Click Save and Deploy

### Option D — GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

Or use GitHub Actions with the `peaceiris/actions-gh-pages` action.

Note: GitHub Pages may require `base: '/repo-name/'` in `vite.config.ts`. For root-domain or custom-domain deployments, no `base` change is needed.

---

## VRM Assets

VRM models and background images live in `public/models/` and `public/background/`. Vite copies everything in `public/` verbatim into `dist/` at build time.

These files are large (14–16 MB each). Static hosts serve them without special configuration, but ensure your host does not have a file size limit below 20 MB.

---

## SPA Routing

Persona does not use client-side routing. The app mounts at `index.html`. No URL rewrite rules are needed on any host.

---

## Production Verification Checklist

After deploying:

- [ ] Live URL loads the page
- [ ] Avatar appears (VRM loads from `/models/Alex0.1.vrm`)
- [ ] Background image loads
- [ ] Browser TTS works (click START LISTENING, let avatar speak)
- [ ] STT works (allow microphone, speak)
- [ ] `document.modelContext` is present in a WebMCP-enabled browser
- [ ] All 5 WebMCP tools are discoverable
- [ ] No console errors
- [ ] HTTPS served (required for microphone access)
- [ ] MockAgent console is NOT visible
