## Summary

<!-- Describe the purpose of this change and link related issues (e.g., Fixes #123). -->

## Type of Change

<!-- Mark with an [x] -->

- [ ] Bug fix (non-breaking)
- [ ] Feature (non-breaking)
- [ ] Documentation only
- [ ] Release preparation
- [ ] Hotfix
- [ ] **Governance** — touches protected assessment assets (requires explicit approval)

## Developer Checklist

<!-- All items must be checked before requesting review -->

- [ ] Source code reviewed (self-review complete)
- [ ] No changes to `questionnaire.json` *(or explicit approval documented below)*
- [ ] No scoring logic modifications *(or explicit approval documented below)*
- [ ] Documentation updated if required
- [ ] Tested locally (full welcome → questionnaire → report flow)
- [ ] Responsive testing completed (mobile and tablet viewports)
- [ ] Print functionality verified (`window.print()` / report layout)
- [ ] No console errors during normal user flow

## Protected Asset Approval

<!-- Required only if questionnaire.json, scoring logic, section registry, or question IDs were changed -->

| Item | Changed? | Approval reference |
|------|----------|-------------------|
| `questionnaire.json` | Yes / No | |
| Scoring / assessment methodology | Yes / No | |
| Question identifiers (`id`, `standardId`) | Yes / No | |

## Test Plan

<!-- Describe what was tested manually. Reference docs/qa-checklist.md where applicable. -->

1.
2.
3.

## Screenshots / Recordings

<!-- UI changes only — attach before/after if helpful -->

## Constitution Compliance

<!-- Brief note: does this change respect privacy-first, reflection-first, and assessment protection principles? -->

## Additional Notes

<!-- Deployment notes, known limitations, follow-up tasks -->
