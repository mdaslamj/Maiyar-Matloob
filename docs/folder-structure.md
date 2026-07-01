# Folder Structure

```
Maiyar-Matloob/
├── app.js                 # UI only — calls application layer
├── index.html             # Screen shells and landmarks
├── style.css              # Global styles, responsive, print, a11y
├── questionnaire.json     # Protected assessment content
├── docs/                  # Architecture, QA, release documentation
└── src/
    ├── assessment/        # Scoring pipeline (protected)
    ├── report/            # Report generation (protected)
    ├── history/           # Snapshot persistence and listing
    ├── trend/             # Trend calculations (protected)
    ├── action/            # Structured action plans (protected)
    ├── feedback/          # Urdu guidance (protected)
    ├── reassessment/      # Interval planner + plan presentation
    ├── growth/            # Growth dashboard view model
    ├── dashboard/         # Personal home dashboard builder
    ├── timeline/          # Growth timeline merger
    ├── insights/          # Personal insights selector
    ├── journal/           # Reflection journal CRUD
    ├── storage/           # Storage adapters and safety helpers
    ├── core/              # Application orchestration
    ├── shared/            # Domain models, contracts, errors, flags
    ├── firebase/          # Optional cloud (disabled)
    └── ui/                # Reserved for future presentation extraction
```

## Module Rules

| Path | May import | Must not import |
|------|------------|-----------------|
| `app.js` | `src/core/application.js`, storage status helpers | Engines directly |
| `application.js` | All engines, storage, builders | — |
| Trend/Action/Feedback | History read, shared | Assessment, Report writes |
| Journal | Storage only | Assessment, scoring |
