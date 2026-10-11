# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A student-only, front-end-only prototype of the **AI Tutor** (a Socratic tutor launched from Moodle), built as an Expo SDK 57 / React Native 0.86 app that is run and shipped **as a web app** (react-native-web). Everything is dummy data in `data/`; nothing talks to a backend.

This folder lives inside a git worktree whose own git repo is messy and unrelated (it tracks files from `Downloads/`). Do not commit from here. See "Shipping" below.

## Commands

```bash
npm install
npm run web          # expo start --web, port 8081 (launch config: ../.claude/launch.json, name "student-portal")
npm run build        # expo export --platform web --output-dir dist   (what Vercel runs)
npx expo export --platform web --output-dir /tmp/sp-dist   # quick "does it still compile" check
```

There is no test runner and no linter. "Verify" means a clean export plus looking at it in the browser. In the Claude browser pane the viewport can render tiny and animation timers are throttled: use `resize_window` with an explicit width and read the DOM with JS for layout facts, and expect Reveal/fade-ins to look half-drawn in screenshots.

## Architecture

**No router library.** `store/portal.js` holds `route` (`{ name, ...params }`) and `go(name, params)`. `App.js` maps `route.name` to a screen in the `SCREENS` object, so adding a screen means registering it there. Route, progress, stats, chosen mascot, exam attempts and similar survive reloads through localStorage key `amity-portal-v1` (web only). The same provider holds the "how you're doing" tallies the tutor reads.

**Shell** (`ui/Shell.js`) is the signed-in frame: sidebar (the `NAV` array is the tab list), a tab bar under 640px, a scrolling centre column and an optional right rail (rail only at 1180px and up; below that it is stacked under the page). Props that matter: `rail`, `railFill` (rail fills the height instead of scrolling), `autoCollapse` (focused screens such as exercises hide the sidebar), `header`. Rails in use: `screens/Rail.js` (the tutor chat, `ui/FeedbackChat.js`), `ui/UploadsRail.js` (Uploads tab), and `ui/TutorDock.js` (the tutor inside an exercise, `screens/Task.js`).

**The tutor is scripted, not an LLM.** `tutor/engine.js` + `tutor/copy.js` drive exercise hints and replies; `tutor/feedback.js` answers the progress chat from real numbers in the store. Hints per level are fixed (`maxHintsFor`: Warm Up 3, Stretch 2, Challenge 1). The product rule is that the tutor never gives the answer.

**Design system** lives in `brand/` (colour, spacing, radii, motion tokens, `Typescale.js` with the three loaded fonts) and `theme/`:
- `theme/type.js`: the only text styles to use for content (`TITLE`, `SUB`, `H2`, `PAGE_TITLE`).
- `theme/fluid.js`: `fs(n)` / `lh(n)` give fluid font sizes and line heights on web (clamp between about 88% and 110%, never under 15px). Use them for any literal size.
- `StyleSheet` values are baked at import time, so switching light/dark reloads the page.
- Only Medium, Demi and Bold are loaded (`FontFamilies.heavy` is Bold, `demi` is semi-bold).

**Overlays and menus: reuse, don't hand-roll.**
- `ui/Sheet.js` is the modal (scrim, rise-in, Escape, focus return). On web it portals into `<body>` because `position: fixed` breaks inside transformed ancestors (the rail animates in). Props `tall` and `fill` make it page-sized; on a phone it goes edge to edge.
- `ui/Dropdown.js` is every dropdown/filter. Under 640px it automatically becomes a bottom sheet over a soft scrim; supports `iconOnly`, `tinted` and per-option `leading` icons.
- `components/Button.js`, `components/Input.js`, `ui/icons.js` (all icons are Lucide data drawn through Morphicons; add new ones there).

**Mascots**: `ui/Mascot.js` draws the characters as SVG with live idle/gesture animation (`live`, `gesture={{ name, id }}`); `MASCOT_TONE` maps each to an accent colour. The student's pick (`mascot` in the store) drives the tutor avatar, banners and favicon.

**Web-only DOM code**: drag and drop (`Draggable`/`DropZone` in `screens/Task.js`, the upload zone in `screens/Material.js`) and scroll reveals (`ui/InView.js`) attach real DOM listeners to RN views; guard with `Platform.OS === 'web'`.

## Standing product and design rules (from the owner)

- Duolingo-like branding with small tweaks; no glow effects anywhere; no text under 15px.
- Buttons use Title Case. Text on blue fills is dark blue (`Colors.brand.onPrimary`), not white.
- Copy is short: a title plus one subtext, about five words, sentence case outside buttons.
- Only animate `transform` and `opacity`; respect reduced motion (`useReducedMotion`); no animation on keyboard-initiated actions.
- Three type weights on purpose: Medium for reading, Demi for anything scanned, Bold only for page titles and big numbers.
- Icons are for navigation, icon-only buttons and state changes, not decoration beside titles (see the header comment in `ui/icons.js`).
- Small phones matter: check layouts at about 390px as well as desktop.

## Shipping

Deployed on Vercel from `vercel.json` (build `npx expo export --platform web --output-dir dist`, output `dist`, SPA rewrite to `/index.html`). Pushes go through a **clean scratch git repo**, not this worktree's git: rsync the project folder (excluding `node_modules`, `dist`, `.expo`, `.vercel`, `.env.local`), commit, push to `github.com/ruchitrshah/AI-Tutor`.

Two variants exist as sibling folders:
- `student-portal/` (this one): mascot version, branch `main`, Vercel project `ai-tutor` (git-connected, auto-deploys).
- `student-portal-saas/`: duplicate being redesigned toward a no-mascot, SaaS-style UI, branch `saas-ui`, Vercel project `ai-tutor-saas` (not git-connected: run `vercel deploy --prod --yes` from that folder). Edit only the folder that matches the version you were asked about.
