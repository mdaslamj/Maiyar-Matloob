# Maiyaar Growth Intelligence Platform

## Overview

The Growth Intelligence Platform transforms read-only History snapshots into structured growth guidance. It is fully local-first and does not modify assessment, report, or trend calculations.

## Pipeline

```
History (read-only listSnapshots)
        ↓
Trend Engine (computeTrends)
        ↓
Action Engine (generateActionPlan)
        ↓
Reassessment Planner (computeSuggestedReassessment)
        ↓
Feedback Engine (generateFeedback)
        ↓
Growth Dashboard (buildGrowthDashboard)
        ↓
UI — سفرِ ترقی (Progress Journey)
```

## Engine Responsibilities

### History Engine

- Persists immutable `AssessmentSnapshot` records on assessment completion.
- Provides `listSnapshots()` for read-only access.
- **Must not** be written to by Trend, Action, Feedback, or Growth modules.

### Trend Engine

- Consumes History snapshots only.
- Computes overall/section trends, consistency, frequency, velocity, and summary.
- **Must not** call Assessment or Report engines.
- **Must not** recalculate stored reports.

### Action Engine

- Input: `TrendResult`
- Output: `ActionPlanResult` (structured data only — no motivational language)
- Produces:
  - Highest priority growth areas (`topPriorities` / `highestPriorityGrowthAreas`)
  - Sections to maintain (`continueHabits` / `sectionsToMaintain`)
  - Recommended focus order (`recommendedFocusSections`)
  - Weekly improvement priorities (`weeklyImprovementPriorities`)
  - Estimated improvement difficulty (`estimatedImprovementDifficulty`)
  - Suggested reassessment interval (via Reassessment Planner)

### Reassessment Planner

- Input: `TrendResult` + optional `ActionPlanResult`
- Output: discrete interval recommendation — **7, 14, 30, or 60 days**
- Based on consistency score and assessment frequency.
- Does **not** schedule reminders or notifications.

### Feedback Engine

- Input: `TrendResult` + `ActionPlanResult` + optional reassessment result
- Output: `FeedbackResult` with Urdu-first encouraging messages
- Compares the user's **own** previous assessments only — never shames or compares users.
- Categories: `progress_summary`, `positive_reinforcement`, `stable_encouragement`, `gentle_reminder`, `priority_explanation`, `reassessment`

### Growth Dashboard Builder

- Aggregates Trend, Action, Feedback, and Reassessment outputs into a single `GrowthDashboard` view model.
- Used by the Application Layer and Progress Journey UI.

## Application Layer API

| Method | Returns |
|--------|---------|
| `getTrendData()` | `DomainResult<TrendResult>` |
| `getActionPlan()` | `DomainResult<ActionPlanResult>` |
| `getFeedback()` | `DomainResult<FeedbackResult>` |
| `getSuggestedReassessment()` | `DomainResult<ReassessmentRecommendation>` |
| `getGrowthDashboard()` | `DomainResult<GrowthDashboard>` |

UI (`app.js`) must call Application methods only — never import Action, Feedback, Trend, or Reassessment modules directly.

## Reassessment Algorithm

Allowed intervals: **7, 14, 30, 60** days.

| Condition | Recommended days | Basis |
|-----------|------------------|-------|
| No assessments | 30 | `no_assessments` |
| One assessment | 30 | `initial_guidance` |
| Consistency ≥ 75 and avg interval ≤ 10 days | 7 | `high_consistency_frequent` |
| Consistency ≥ 60 and avg interval ≤ 21 days | 14 | `moderate_consistency_regular` |
| Consistency ≥ 40 or avg interval ≤ 45 days | 30 | `standard_rhythm` |
| Otherwise | 60 | `low_consistency_infrequent` |

Adjustments (still snapped to allowed intervals):

- Declining overall trend with consistency ≥ 50 → cap at 14 days if above 14.
- Three or more weak areas with consistency ≥ 55 → cap at 14 days if above 14.

Optional `suggestedDate` is computed from latest assessment date + recommended days (informational only).

## Protected Assets

The following remain unchanged by this milestone:

- `questionnaire.json`
- Assessment methodology and scoring
- Report calculations
- Trend engine calculations
- History snapshot schema
- Storage public API
- Engine contracts (additive modules only)

## Out of Scope

- Firestore sync
- Analytics
- Admin Dashboard
- Authentication
- Cloud storage
- Reminder scheduling
