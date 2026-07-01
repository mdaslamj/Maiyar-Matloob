# Coding Checklist

**Project:** Maiyaar (معیار)  
**Audience:** Developers and AI assistants before commit or pull request  
**Aligns with:** [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)

Complete this checklist before committing code or opening a pull request. Not every item applies to documentation-only changes — use judgment and note exceptions in the PR.

---

## Scope and Intent

- [ ] Change addresses a defined task or issue; no unrelated drive-by edits
- [ ] Smallest adequate diff; no speculative features beyond scope
- [ ] Architectural reasoning understood (read affected files before editing)

---

## Code Quality

- [ ] Functions are small and single-purpose (readable without excessive scrolling)
- [ ] Names are descriptive (English for code identifiers; Urdu for user-facing content)
- [ ] No duplicated logic introduced (existing duplication not expanded without justification)
- [ ] No dead code added (remove unused variables, functions, and unreachable paths)
- [ ] No unnecessary dependencies (vanilla web platform preferred)
- [ ] No magic strings for storage keys, section IDs, or thresholds without central definition
- [ ] Error handling does not silently swallow failures
- [ ] Comments explain non-obvious business rules only; code is self-explanatory where possible

---

## Assessment Protection

- [ ] `questionnaire.json` **not modified** unless explicit approval documented
- [ ] Scoring logic **not modified** unless explicit approval documented
- [ ] Question identifiers (`id`, `standardId`) **not renamed or deleted**
- [ ] Assessment questions **not deleted**
- [ ] Section definitions changed only with registry/alias strategy and approval
- [ ] Functionality **extended** rather than assessment redesigned

---

## User Experience

- [ ] Urdu and RTL layout preserved or improved
- [ ] Reflection-first flow not disrupted (welcome → questionnaire → report)
- [ ] Navigation labels and copy consistent with product tone
- [ ] Touch targets and focus states maintained for interactive elements
- [ ] `aria-live` and accessibility patterns preserved on dynamic content

---

## Local Verification

- [ ] Tested locally via HTTP server (not only `file://` if fetch is involved)
- [ ] Full flow: welcome → start → answer questions → finish → report
- [ ] Previous / Next navigation works; required-question guard behaves correctly
- [ ] Explanation toggles and growth-group toggles work on report
- [ ] Restart clears session and starts fresh questionnaire
- [ ] **Console clean** — no errors during normal user flow
- [ ] Responsive behavior checked at mobile and tablet widths
- [ ] Print preview verified for report output

---

## Documentation

- [ ] Documentation updated if behavior, setup, or process changed
- [ ] PR description includes test plan and constitution compliance note
- [ ] Protected asset approval table completed in PR if applicable

---

## Git Hygiene

- [ ] Commit messages follow [branching-strategy.md](./branching-strategy.md) conventions
- [ ] No secrets, credentials, or `.env` files committed
- [ ] Branch name matches purpose (`feature/*`, `hotfix/*`, `release/*`)

---

## Pre-Merge (Author)

- [ ] Self-review completed
- [ ] [Pull request template](../.github/PULL_REQUEST_TEMPLATE.md) checklist marked
- [ ] Ready for reviewer QA per [qa-checklist.md](./qa-checklist.md) if user-facing

---

## Related Documents

- [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)
- [Branching Strategy](./branching-strategy.md)
- [Testing Strategy](./testing-strategy.md)
- [QA Checklist](./qa-checklist.md)
