/**
 * Canonical performance level keys produced by the Assessment Engine.
 * Display labels remain a Presentation Layer concern.
 * @readonly
 * @enum {string}
 */
export const PERFORMANCE_LEVELS = {
    EXCELLENT: "Excellent",
    VERY_GOOD: "Very Good",
    GOOD: "Good",
    NEEDS_IMPROVEMENT: "Needs Improvement",
    CRITICAL: "Critical"
};

/**
 * Current domain schema versions for cross-engine contracts.
 * History snapshot format remains governed by HISTORY_SNAPSHOT_SCHEMA_VERSION.
 * @readonly
 */
export const DOMAIN_SCHEMA_VERSIONS = {
    ASSESSMENT_SNAPSHOT: 1,
    TREND_RESULT: 1,
    FEEDBACK_RESULT: 1,
    ACTION_PLAN_RESULT: 1,
    ANALYTICS_EVENT: 1,
    USER_PREFERENCES: 1
};

/**
 * @typedef {Object} ContentVersion
 * @property {string} value - Semantic content version (e.g. questionnaire.json "version").
 * @property {string} [source] - Origin label such as "questionnaire.json".
 */

/**
 * @typedef {Object} SectionResult
 * @property {string} sectionId - Stable canonical section identifier.
 * @property {string} title - Canonical section display title.
 * @property {number} percentage - Section percentage score (0–100, one decimal).
 * @property {string} level - Performance level key (English, assessment domain).
 */

/**
 * @typedef {Object} OverallResult
 * @property {number} percentage - Overall percentage score (0–100, one decimal).
 * @property {string} level - Performance level key (English, assessment domain).
 */

/**
 * @typedef {Object} ReportSummary
 * @property {string} overallSummary
 * @property {{ title: string, percentage: number } | null} strongestSection
 * @property {{ title: string, percentage: number } | null} growthSection
 * @property {number} actionPlanCount
 */

/**
 * Immutable assessment snapshot persisted by the History Engine.
 * This shape MUST remain backward compatible across app releases.
 * @typedef {Object} AssessmentSnapshot
 * @property {number} schemaVersion - Snapshot schema version for migration.
 * @property {string} snapshotId - Unique immutable identifier.
 * @property {string} createdAt - ISO-8601 timestamp.
 * @property {string} appVersion - Application release version at completion time.
 * @property {string} contentVersion - Questionnaire/content version at completion time.
 * @property {number} overallPercentage
 * @property {string} overallLevel
 * @property {SectionResult[]} sectionSummary
 * @property {ReportSummary} reportSummary
 */

/**
 * History list item wrapping a snapshot with optional presentation metadata.
 * @typedef {Object} HistoryEntry
 * @property {AssessmentSnapshot} snapshot
 * @property {number} [assessmentNumber] - Ordinal assigned by History Engine (newest = highest).
 * @property {boolean} [hasStoredReport] - Whether a frozen report payload exists for viewing.
 */

/**
 * @typedef {Object} TrendInput
 * @property {AssessmentSnapshot[]} snapshots - Ordered newest-first unless options specify otherwise.
 * @property {Object} [options]
 * @property {"newest-first"|"oldest-first"} [options.order]
 * @property {number} [options.limit] - Maximum snapshots to analyse.
 */

/**
 * @typedef {Object} SectionTrend
 * @property {string} sectionId
 * @property {string} title
 * @property {number|null} deltaPercentage - Change vs prior snapshot; null if insufficient data.
 * @property {"up"|"down"|"stable"|"unknown"} direction
 */

/**
 * @typedef {Object} TrendResult
 * @property {number} schemaVersion
 * @property {string} computedAt - ISO-8601 timestamp.
 * @property {number} snapshotCount
 * @property {number|null} overallDeltaPercentage
 * @property {"up"|"down"|"stable"|"unknown"} overallDirection
 * @property {SectionTrend[]} sectionTrends
 * @property {string} [summary] - Non-shaming narrative framing (future engine output).
 */

/**
 * @typedef {Object} FeedbackInput
 * @property {AssessmentSnapshot} snapshot
 * @property {TrendResult|null} [trend] - Optional trend context from Trend Engine.
 * @property {Object} [context]
 * @property {string} [context.locale]
 */

/**
 * @typedef {Object} FeedbackItem
 * @property {string} id
 * @property {string} category - e.g. "encouragement", "growth", "reflection".
 * @property {string} message
 */

/**
 * @typedef {Object} FeedbackResult
 * @property {number} schemaVersion
 * @property {string} computedAt
 * @property {string} snapshotId
 * @property {FeedbackItem[]} items
 */

/**
 * @typedef {Object} ActionPlanInput
 * @property {AssessmentSnapshot} snapshot
 * @property {TrendResult|null} [trend]
 * @property {FeedbackResult|null} [feedback]
 * @property {number} [maxItems] - Default 3.
 */

/**
 * @typedef {Object} ActionPlanItem
 * @property {string} id
 * @property {string} sectionId
 * @property {string} message
 * @property {number} [priority]
 */

/**
 * @typedef {Object} ActionPlanResult
 * @property {number} schemaVersion
 * @property {string} computedAt
 * @property {string} snapshotId
 * @property {ActionPlanItem[]} items
 */

/**
 * Allowed Analytics event types. Must never include raw answer values by default.
 * @readonly
 * @enum {string}
 */
export const ANALYTICS_EVENT_TYPES = {
    SESSION_START: "session_start",
    ASSESSMENT_COMPLETE: "assessment_complete",
    HISTORY_VIEW: "history_view",
    HISTORY_DELETE: "history_delete",
    REPORT_PRINT: "report_print",
    ERROR: "error"
};

/**
 * @typedef {Object} AnalyticsEvent
 * @property {number} schemaVersion
 * @property {string} eventId
 * @property {string} eventType - One of ANALYTICS_EVENT_TYPES.
 * @property {string} occurredAt - ISO-8601 timestamp.
 * @property {string} appVersion
 * @property {string} [contentVersion]
 * @property {Record<string, string|number|boolean>} [metadata] - No answer content by default.
 */

/**
 * Future user preference flags. Not persisted in this sprint.
 * @typedef {Object} UserPreferences
 * @property {number} schemaVersion
 * @property {boolean} [cloudSyncConsent]
 * @property {boolean} [analyticsConsent]
 * @property {string} [locale]
 * @property {string} updatedAt
 */

export function createContentVersion(value, source = "questionnaire.json") {

    return {
        value: String(value ?? "unknown"),
        source
    };

}

export function isSectionResult(value) {

    return Boolean(
        value
        && typeof value.sectionId === "string"
        && typeof value.title === "string"
        && typeof value.percentage === "number"
        && typeof value.level === "string"
    );

}

export function isAssessmentSnapshot(value) {

    return Boolean(
        value
        && typeof value.schemaVersion === "number"
        && typeof value.snapshotId === "string"
        && typeof value.createdAt === "string"
        && typeof value.appVersion === "string"
        && typeof value.contentVersion === "string"
        && typeof value.overallPercentage === "number"
        && typeof value.overallLevel === "string"
        && Array.isArray(value.sectionSummary)
        && value.sectionSummary.every(isSectionResult)
        && value.reportSummary
        && typeof value.reportSummary === "object"
    );

}

export function isHistoryEntry(value) {

    return Boolean(value && isAssessmentSnapshot(value.snapshot));

}
