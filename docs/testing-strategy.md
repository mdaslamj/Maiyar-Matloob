# Testing Strategy

**Project:** Maiyaar (معیار)  
**Version scope:** 1.x  
**Status:** Manual testing only  
**Aligns with:** [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)

This document defines the testing approach for Maiyaar Version 1.x. Automated testing is **not required** at this stage but may be introduced in Version 2 per the project roadmap. Until then, quality is assured through structured manual testing.

---

## Objectives

1. Verify the core user journey works reliably across browsers and devices.
2. Protect assessment integrity — scoring, sections, and report content must be trustworthy.
3. Catch regressions before production release.
4. Provide repeatable test coverage without automated tooling overhead for v1.x.

---

## Testing Principles

- **User-journey first** — Test flows real users follow, not isolated clicks alone.
- **Integrity-sensitive** — Scoring and section behavior receive extra scrutiny.
- **Document results** — Use [qa-checklist.md](./qa-checklist.md) sign-off for releases.
- **No silent methodology change** — If scoring behavior differs from expected, treat as defect or governed change, not informal adjustment.
- **Manual is authoritative for v1.x** — Pass/fail is determined by human verification.

---

## Test Environments

| Environment | Use |
|-------------|-----|
| **Local** | Developer verification; `npx serve`, `python -m http.server`, or equivalent |
| **Staging** | Optional pre-production URL mirroring production hosting |
| **Production** | Post-deploy smoke test only |

**Important:** Do not rely on opening `index.html` via `file://` as the sole test — `fetch('questionnaire.json')` may fail depending on browser security policy. Always test over HTTP.

---

## 1. Functional Testing

Validate that each feature behaves as specified.

### Welcome Screen

- Load application; verify welcome content and start button.
- Confirm RTL layout and Urdu rendering.

### Questionnaire

- Start assessment; verify first question renders.
- Select answers; navigate forward and backward.
- Confirm answer persistence when returning to a previous question.
- Verify required-answer validation blocks Finish/Next where applicable.
- Expand and collapse question explanations.
- Complete all 50 questions with varied answers.

### Report

- Submit on last question; verify dashboard/report renders.
- Confirm overall percentage, level, and date appear.
- Verify each report section card (cover, overall, sections, strengths, growth, weak questions, action plan, reflection, du'a).
- Expand growth question groups; verify insight content.

### Actions

- Restart assessment; confirm storage cleared and questionnaire resets.
- Print report; confirm print layout.

### Edge Cases (Functional)

- Refresh page mid-questionnaire *(document expected v1 behavior)*.
- Complete with all minimum answers (value 1) vs all maximum (value 4).
- Rapid Next/Previous clicking does not corrupt state.

---

## 2. Regression Testing

Run before every release and after any change to `app.js`, `index.html`, `style.css`, or governed content.

### Core Regression Path (Minimum)

1. Clear `localStorage`.
2. Load app → Start → Answer Q1–Q50 (use mixed values) → Finish.
3. Scan report sections for missing or 0% sections erroneously.
4. Print preview.
5. Restart → confirm question 1 with empty answers.

### Integrity Regression (When Scoring or Sections Touched)

- All-max answers → expect high overall percentage and Excellent/Very Good level.
- All-min answers → expect low overall percentage and Critical/Needs Improvement level.
- Compare section list in report against canonical section order.
- Verify weak-question section populates when low answers given.

### Copy Regression

- No English placeholders in primary Urdu UI (except known navigation labels pending localization).
- Question count remains 50 on welcome and progress.

---

## 3. Responsive Testing

Test at representative viewport widths:

| Width | Device class |
|-------|--------------|
| 375px | Small mobile |
| 768px | Tablet portrait |
| 1024px | Tablet landscape / small laptop |
| 1280px+ | Desktop |

### Focus Areas

- Welcome card layout and info boxes
- Questionnaire shell height and scroll behavior
- Answer option tap targets
- Navigation button stacking on mobile
- Report section grid reflow
- Question insight meta layout

---

## 4. Browser Testing

Test latest stable versions available to the team.

### Desktop

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari (macOS, if available)

### Mobile

- Chrome on Android
- Safari on iOS (if available)

### Browser-Specific Checks

- `localStorage` persistence
- Print dialog and print CSS
- Font loading (Google Fonts)
- CSS `:has()` for selected radio styling (verify fallback acceptable if unsupported)

Record results in the QA checklist browser compatibility table.

---

## 5. Print Testing

Print testing is mandatory for every release — the report is a primary deliverable.

### Procedure

1. Complete assessment and reach report.
2. Open print dialog (button or Ctrl/Cmd+P).
3. Verify in print preview:
   - Welcome and questionnaire hidden
   - Navigation buttons hidden
   - Report cards visible sequentially
   - Text not truncated unreadably
   - Page breaks acceptable

### Physical Print (Optional)

- Print one copy to A4; verify readability in grayscale.

---

## Test Documentation

| Activity | Document |
|----------|----------|
| Full release QA | [qa-checklist.md](./qa-checklist.md) |
| Pre-commit developer check | [coding-checklist.md](./coding-checklist.md) |
| Pre-release gate | [release-checklist.md](./release-checklist.md) |
| Defect reporting | [Bug report template](../.github/ISSUE_TEMPLATE/bug_report.md) |

---

## Defect Severity Guide

| Severity | Examples | Release blocking? |
|----------|----------|-------------------|
| **Critical** | Cannot finish assessment; report blank; data corruption | Yes |
| **High** | Wrong section scores; print unusable; broken navigation | Yes |
| **Medium** | UI glitch with workaround; partial mobile layout issue | Usually no |
| **Low** | Cosmetic; minor copy | No |

---

## What Is Out of Scope for v1.x

The following are **not** required for Version 1.x testing strategy:

- Automated unit or E2E test suites
- CI test gates
- Performance benchmarking tools
- Cross-browser automation (Playwright, Cypress, etc.)

These may be introduced in Version 2 Sprint 1 per the project constitution roadmap.

---

## Related Documents

- [QA Checklist](./qa-checklist.md)
- [Release Checklist](./release-checklist.md)
- [Coding Checklist](./coding-checklist.md)
- [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)
