# Release Checklist

**Project:** Maiyaar (معیار)  
**Purpose:** Gate checklist before every production release  
**Aligns with:** [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)

Complete all items before tagging and deploying to production. A failed blocking item stops the release until resolved or explicitly waived by the project maintainer with documented rationale.

---

## Pre-Release Scope

- [ ] Release version number agreed (`vMAJOR.MINOR.PATCH`)
- [ ] Release branch or `main` contains only intended changes for this version
- [ ] All related pull requests merged and linked
- [ ] Release notes draft prepared

---

## Quality Assurance

- [ ] Full [QA Checklist](./qa-checklist.md) completed on release candidate
- [ ] QA sign-off recorded (tester, date, environment)
- [ ] All **Critical** and **High** defects resolved or explicitly deferred with waiver
- [ ] Regression spot-check on previous release defect fixes (if applicable)

---

## Technical Verification

- [ ] **No console errors** during standard user flow (welcome → 50 questions → report → print → restart)
- [ ] **Responsive verified** at mobile (375px), tablet (768px), and desktop (1024px+)
- [ ] **Print verified** — print preview shows report only; layout acceptable on A4
- [ ] Application loads correctly over HTTPS on target hosting
- [ ] `questionnaire.json` fetch succeeds in production environment
- [ ] Fonts and static assets load without 404

---

## Assessment Integrity

- [ ] **Assessment integrity preserved** — 50 questions, stable identifiers, expected response scale
- [ ] No unapproved changes to `questionnaire.json` in this release *(or approval documented)*
- [ ] No unapproved scoring or methodology changes *(or approval documented with user disclosure)*
- [ ] Section registry / report mapping verified if sections or scoring touched
- [ ] Spot-check: known answer fixture produces expected overall and section behavior

---

## Constitution Compliance

- [ ] **Constitution compliance** reviewed against [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)
- [ ] Privacy-first posture maintained (no new data collection without disclosure)
- [ ] Reflection-first UX preserved
- [ ] Islamic design principles respected in new copy or features
- [ ] Protected asset changes have documented approval

---

## Documentation

- [ ] **Documentation updated** for user-visible or contributor-visible changes
- [ ] [Testing Strategy](./testing-strategy.md) still accurate (or updated)
- [ ] [Branching Strategy](./branching-strategy.md) still accurate (or updated)
- [ ] README updated if setup/deploy steps changed *(when README exists)*

---

## Version and Changelog

- [ ] **Version updated** in application metadata (e.g., app header comment, report footer, content metadata if applicable)
- [ ] **Changelog updated** with version, date, and categorized changes (Added, Fixed, Changed, Governance)
- [ ] Breaking changes explicitly called out with migration notes if any

---

## Git and Deploy

- [ ] All commits on release branch reviewed
- [ ] Git tag created: `vX.Y.Z` on release commit
- [ ] Tag pushed to remote
- [ ] Production deployment executed from tagged commit
- [ ] Post-deploy smoke test on production URL (welcome → one question → back to welcome or full flow if time permits)
- [ ] Rollback plan confirmed (previous tag identified)

---

## Communication

- [ ] Release notes published (GitHub Release or equivalent)
- [ ] Stakeholders notified if assessment methodology or content changed
- [ ] Known issues documented in release notes if any low-severity items deferred

---

## Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| QA | | | [ ] |
| Maintainer / Architect | | | [ ] |

**Release version:** `v________`  
**Production URL:**  
**Previous version (rollback):** `v________`

---

## Post-Release

- [ ] Monitor for user-reported issues first 24–48 hours
- [ ] Release branch deleted if used
- [ ] Backlog updated with deferred items and follow-ups

---

## Related Documents

- [QA Checklist](./qa-checklist.md)
- [Testing Strategy](./testing-strategy.md)
- [Branching Strategy](./branching-strategy.md)
- [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)
