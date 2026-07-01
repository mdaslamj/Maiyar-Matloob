# Maiyaar Architecture Overview

## Product

**Maiyaar (معیار | محاسبۂ نفس)** is a local-first Urdu RTL self-assessment companion for continuous محاسبۂ نفس. Version 2.0 adds growth intelligence and continuous muhasabah without cloud dependency.

## Layered Architecture

```
Presentation (index.html, app.js, style.css)
        ↓
Application Layer (src/core/application.js)
        ↓
Engines (assessment, report, history, trend, action, feedback, journal, …)
        ↓
Storage Adapters (localStorage default; Firestore disabled)
```

## Core Principles

- **Local-first** — all user data stays in the browser by default
- **Frozen methodology** — questionnaire, scoring, report math, history schema, trend/action/feedback calculations are protected
- **Engine isolation** — UI never imports engines directly
- **Immutable history** — assessment snapshots are read-only for intelligence engines
- **DomainResult** — engines return structured success/failure objects

## Intelligence Pipeline

```
History snapshots (read-only)
  → Trend Engine
  → Action Engine
  → Reassessment Planner
  → Feedback Engine
  → Dashboard / Timeline / Insights builders
```

Cached in `ApplicationService._getGrowthPipeline()` and batched via `getGrowthBundle()`.

## Optional Infrastructure

Firebase/Firestore adapters exist but are disabled via feature flags (`USE_FIREBASE: false`).

## Version

Application version: **2.0.0**
