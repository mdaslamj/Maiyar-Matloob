# Changelog

All notable changes to Maiyaar (معیار | محاسبۂ نفس) are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] — 2026-07-02

### Production Stabilization Release

Version 1.0.1 focuses on report integrity, session reliability, Urdu UX consistency, and print completeness. No assessment content or scoring methodology changes.

### Fixed

- **Report section mapping** — Canonical section registry resolves display mismatches for `تزکیۂ نفس`, `معاملات و اخلاق`, and `جامع محاسبۂ نفس`; section percentages no longer show false 0%.
- **Strongest / growth consistency** — Strongest and growth cards now use the same authoritative data as their explanation text.
- **Questionnaire load failures** — Failed fetch, HTTP errors, invalid JSON, and malformed structure show a clear Urdu error; Start remains disabled.
- **Required-answer validation** — Next/Finish without an answer shows immediate Urdu feedback with accessible highlighting.
- **Print completeness** — Weak-question insight panels print in full even when collapsed on screen; on-screen state unchanged after printing.

### Added

- **Session resume** — In-progress answers and question index persist; welcome screen offers **جاری رکھیں** / **دوبارہ شروع کریں** after refresh.
- **Report persistence** — Completed report restores after refresh without re-taking the questionnaire.
- **Session and report storage keys** — `mahasaba-nafs-session`, `mahasaba-nafs-report`.

### Changed

- **Urdu navigation** — Questionnaire buttons: **← پچھلا**, **اگلا →**, **مکمل کریں →**.
- **Urdu performance levels** — Report levels displayed as: انتہائی ممتاز، بہت اچھا، اچھا، بہتری کی ضرورت، تشویشناک.
- **Urdu copy cleanup** — Removed English loanwords from user-facing report strings.
- **Action plan section names** — Action plan items use canonical Urdu section display names.
- **Version references** — Application and report footer updated to **Version 1.0.1**.

### Governance

- `questionnaire.json` — **not modified**
- Scoring methodology — **not modified**
- Question identifiers — **not modified**

---

## [2.0.0] — 2026-07-02

### Product Completion Release

Version 2.0 delivers the full personal self-development platform and a comprehensive polish pass. Assessment content, scoring, report calculations, and protected engine logic remain unchanged.

### Added

- **Growth Intelligence** — Trend, Action, Feedback engines; سفرِ ترقی; reassessment planner
- **Continuous Muhasabah** — مرکزی صفحہ, reflection journal, ترقی کا وقت خط, personal insights
- **Application APIs** — `getGrowthBundle()`, dashboard, timeline, journal, insights, reassessment plan
- **Storage safety** — corruption/quota detection with Urdu user messages
- **Documentation** — architecture, user flow, developer onboarding, release readiness

### Changed

- **Version 2.0.0** — application and report footer
- **UX consistency** — unified Urdu terminology (ترقی کا وقت خط, اولویت, ناکافی معلومات)
- **Accessibility** — skip link, main landmark, ARIA, reduced motion, keyboard toggles
- **Performance** — growth pipeline caching; batched bundle for UI renders
- **Security** — HTML escaping for journal content in timeline

### Fixed

- **Triple pipeline execution** on home dashboard — now single `getGrowthBundle()` call
- **Silent storage failures** — surfaced via status banner where detectable
- **Print layout** — home dashboard hidden when printing
- **Dead code** — removed unused UI stubs

### Governance

- `questionnaire.json` — **not modified**
- Scoring / assessment / report / trend / action / feedback calculations — **not modified**
- History snapshot schema — **not modified**

---

- 50-question Urdu RTL self-assessment (محاسبۂ نفس)
- Welcome, questionnaire, and printable report flows
- Client-side scoring and section breakdown
- Local answer persistence
