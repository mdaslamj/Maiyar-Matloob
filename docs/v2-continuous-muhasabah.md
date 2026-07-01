# Continuous Muhasabah Experience

## Purpose

Maiyaar evolves from a one-time assessment tool into a continuous self-improvement companion for **محاسبۂ نفس**. This milestone adds personal dashboard, reflection journal, growth timeline, reassessment planning, and lightweight insights — all local-first and independent from scoring.

## Workflow

```
Assessment complete
        ↓
History snapshot (unchanged schema)
        ↓
Personal Dashboard (home)
        ↓
┌───────────────────┬────────────────────┬─────────────────────┐
│ Growth Timeline   │ Reflection Journal │ Reassessment Plan   │
│ (assessments +    │ (optional notes,   │ (planning only,     │
│  reflections)     │  no scoring)       │  no reminders)      │
└───────────────────┴────────────────────┴─────────────────────┘
        ↓
Personal Insights (derived from Trend + Action + Feedback)
        ↓
Continue Assessment
```

## Engine & Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| **History Engine** | Read-only assessment snapshots for timeline and dashboard |
| **Trend Engine** | Unchanged — supplies trend outputs to insights/dashboard |
| **Action Engine** | Unchanged — supplies priorities and focus areas |
| **Feedback Engine** | Unchanged — supplies growth summary text |
| **Reassessment Planner** | Unchanged calculations; `reassessment-plan.js` adds Urdu planning copy |
| **Journal Engine** | CRUD for reflection entries; never affects scores |
| **Personal Dashboard Builder** | Home view model from existing pipeline outputs |
| **Growth Timeline Builder** | Merges snapshots + journal chronologically |
| **Personal Insights Builder** | Selects insights from existing engine outputs only |
| **Application Layer** | Single API surface for UI |

## Application API

| Method | Purpose |
|--------|---------|
| `getDashboard()` | Personal home dashboard |
| `getGrowthTimeline()` | Chronological assessments + reflections |
| `getJournal()` | List journal entries |
| `saveJournalEntry(entry)` | Create/update reflection |
| `deleteJournalEntry(entryId)` | Remove reflection |
| `getPersonalInsights()` | Biggest improvement, consistency, patience, focus |
| `getReassessmentPlan()` | Expanded reassessment planning view |

## Journal Model

Stored separately in `mahasaba-nafs-journal` (not in history schema).

```javascript
{
  schemaVersion: 1,
  entryId: string,
  createdAt: ISO-8601,
  title: string,
  notes: string,
  lessonsLearned: string,
  intentions: string,
  linkedSnapshotId: string | null  // optional link to an assessment
}
```

- No AI interpretation
- No scoring
- No analytics
- Completely optional

## Dashboard Model

```javascript
{
  schemaVersion: 1,
  lastAssessmentDate, currentOverallLevel, currentOverallPercentage,
  growthSummary, currentPriorities[],
  suggestedReassessmentDate, suggestedReassessmentDays,
  progressSinceFirstAssessment: { firstPercentage, latestPercentage, deltaPercentage, classification },
  assessmentCount, hasIncompleteSession
}
```

## Timeline Model

Each entry:

```javascript
{
  entryId, type: "assessment" | "reflection", date,
  title, overallPercentage, overallLevel, growthSummary,
  snapshotId, journalEntryId, hasReport, hasReflection,
  reflection?: { notes, lessonsLearned, intentions }
}
```

## Personal Insight Model

```javascript
{
  biggestImprovement,      // from Trend (max improving section)
  mostConsistentArea,      // from Trend (stable section)
  areaNeedingPatience,     // from Action weak/declining areas
  suggestedNextFocus,      // from Action top priority
  guidanceSummary          // from Feedback/Trend summary
}
```

## Insight Flow

```
_getGrowthPipeline()
  → TrendResult
  → ActionPlanResult
  → FeedbackResult
  → buildPersonalInsights()   // selection only, no new math
```

## Protected Assets

Unchanged by this milestone:

- `questionnaire.json`
- Assessment / scoring methodology
- Report calculations
- History snapshot schema
- Trend engine calculations
- Action engine
- Feedback engine

## Out of Scope

- Firebase / Firestore sync
- Authentication
- Analytics
- Community / social features
- Gamification / leaderboards
- Reminder scheduling
