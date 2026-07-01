# Developer Onboarding

## Prerequisites

- Modern browser with ES modules and localStorage
- Static file server (e.g. `npx serve .`) — no bundler required

## Quick Start

1. Clone the repository
2. Serve the project root over HTTP (required for `fetch("questionnaire.json")`)
3. Open in browser — app loads from `app.js`

## Architecture Rules

1. **UI changes** → `app.js`, `index.html`, `style.css` only
2. **New orchestration** → `src/core/application.js`
3. **Never modify** without explicit approval:
   - `questionnaire.json`
   - `src/assessment/assessment.js`
   - `src/report/report.js` (calculations)
   - History snapshot schema
   - Trend / Action / Feedback engine logic

## Adding a Screen

1. Add `<section id="...">` shell in `index.html`
2. Register ID in `SCREEN_IDS` in `app.js`
3. Use `activateScreen()` for navigation
4. Call `application.*` methods — never import engines in UI

## Growth Data Access

Prefer a single render pass:

```javascript
const bundle = application.getGrowthBundle();
const dashboard = bundle.dashboard?.data;
```

Do not call `getDashboard()`, `getPersonalInsights()`, and `getReassessmentPlan()` separately in one screen.

## Storage Debugging

- Keys prefixed `mahasaba-nafs-*`
- Corruption/quota surfaced via `getLastStorageIssue()` from `src/storage/storage.js`
- Journal is independent from history keys

## Documentation Index

- `docs/architecture-overview.md`
- `docs/v2-domain-model-and-engine-contracts.md`
- `docs/v2-growth-intelligence-platform.md`
- `docs/v2-continuous-muhasabah.md`
- `docs/qa-checklist.md`

## Version

Current release: **2.0.0**
