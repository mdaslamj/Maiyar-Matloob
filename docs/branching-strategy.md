# Branching Strategy

**Project:** Maiyaar (معیار)  
**Status:** Active  
**Aligns with:** [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)

This document defines a lightweight Git workflow suitable for a small static web application with governed assessment assets.

---

## Branch Overview

| Branch | Purpose | Lifetime | Merges into |
|--------|---------|----------|-------------|
| `main` | Production-ready code; always deployable | Permanent | — |
| `feature/*` | New features, improvements, non-urgent fixes | Short-lived | `main` |
| `hotfix/*` | Urgent production defects | Short-lived | `main` |
| `release/*` | Release preparation, version bumps, final QA | Short-lived | `main` |

---

## `main`

- Represents the current production baseline.
- Protected: no direct commits without review (team policy).
- Must pass manual QA per [qa-checklist.md](./qa-checklist.md) before any production deploy.
- Every merge should leave the app in a complete, runnable state.

---

## `feature/*`

Use for planned work that is not an emergency.

**Naming examples:**

```
feature/resume-saved-session
feature/normalize-section-registry
feature/urdu-navigation-labels
```

**Workflow:**

1. Branch from latest `main`.
2. Implement in small, focused commits.
3. Open a pull request using [PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md).
4. Complete [coding-checklist.md](./coding-checklist.md) before requesting review.
5. Merge via squash or merge commit per team preference; delete branch after merge.

**Governance branches:** Changes to `questionnaire.json`, scoring logic, or assessment methodology should use a descriptive name and document approval in the PR:

```
feature/content-section-alias-mapping   # only with explicit approval
```

---

## `hotfix/*`

Use for critical production issues that cannot wait for the next feature cycle.

**Naming examples:**

```
hotfix/report-section-zero-percent
hotfix/localstorage-parse-error
```

**Workflow:**

1. Branch from `main` at the production tag or latest `main`.
2. Fix the minimum scope required.
3. Run abbreviated QA focused on the defect and core user flow.
4. Merge to `main` and deploy promptly.
5. Tag a patch release (e.g., `v1.0.2`) if deployed.

**Restriction:** Hotfixes must not include unapproved changes to protected assessment assets unless the incident itself is an approved content correction.

---

## `release/*`

Use when preparing a named version for production.

**Naming examples:**

```
release/v1.0.1
release/v2.0.0
```

**Workflow:**

1. Branch from `main` when feature scope for the version is complete.
2. Bump version numbers, update changelog, final documentation tweaks only.
3. Run full [release-checklist.md](./release-checklist.md) and [qa-checklist.md](./qa-checklist.md).
4. Merge to `main`; tag `vX.Y.Z`; deploy.
5. Delete the release branch.

No new features on release branches — only release hygiene.

---

## Commit Message Recommendations

Write commits as complete sentences focused on **why**, not only what.

### Format

```
<type>: <short summary in imperative mood>

Optional body explaining context, constitution impact, or test notes.
```

### Types

| Type | Use for |
|------|---------|
| `fix` | Bug fixes |
| `feat` | New user-facing capability |
| `docs` | Documentation only |
| `style` | Formatting, CSS-only visual tweaks (no logic change) |
| `refactor` | Code restructure without behavior change |
| `chore` | Tooling, metadata, non-user-facing maintenance |

### Examples

```
fix: restore section percentage display for تزکیۂ نفس alias

feat: add resume prompt when localStorage contains saved answers

docs: add manual testing strategy for v1.x

chore: bump version to 1.0.1 in app metadata
```

### Avoid

- Vague messages: `update`, `fix stuff`, `WIP`
- Commit messages that hide governance changes
- Combining unrelated changes in one commit

---

## Pull Requests

- Required for all merges to `main`.
- Use the [pull request template](../.github/PULL_REQUEST_TEMPLATE.md).
- At least one reviewer for protected-path changes.
- Link issues where applicable.

---

## Tags and Releases

- Tag production releases: `vMAJOR.MINOR.PATCH` (semantic versioning).
- Tags are created on `main` after release checklist completion.
- See [release-checklist.md](./release-checklist.md).

---

## Related Documents

- [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)
- [Release Checklist](./release-checklist.md)
- [Coding Checklist](./coding-checklist.md)
- [QA Checklist](./qa-checklist.md)
