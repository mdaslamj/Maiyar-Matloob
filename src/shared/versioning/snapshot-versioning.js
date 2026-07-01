import { DOMAIN_SCHEMA_VERSIONS } from "../domain/models.js";

/**
 * Snapshot and contract versioning policy for Maiyaar engines.
 * Must stay aligned with HISTORY_SNAPSHOT_SCHEMA_VERSION in history-config.js.
 */

export const CURRENT_HISTORY_SNAPSHOT_SCHEMA_VERSION = 1;

export const SUPPORTED_HISTORY_SNAPSHOT_VERSIONS = [
    CURRENT_HISTORY_SNAPSHOT_SCHEMA_VERSION
];

export const VERSION_FIELDS = {
    SNAPSHOT: "schemaVersion",
    APP: "appVersion",
    CONTENT: "contentVersion"
};

/**
 * Determines whether a stored snapshot can be consumed without migration.
 * @param {import("../domain/models.js").AssessmentSnapshot} snapshot
 * @returns {boolean}
 */
export function isSupportedSnapshotVersion(snapshot) {

    return SUPPORTED_HISTORY_SNAPSHOT_VERSIONS.includes(snapshot?.schemaVersion);

}

/**
 * Migration policy registry. Implementations belong in future sprints.
 * Keys are source schemaVersion; values describe target upgrade path.
 * @readonly
 */
export const SNAPSHOT_MIGRATION_REGISTRY = {
    // Example future entry:
    // 1: { targetVersion: 2, migrate: "history-migrations/v1-to-v2" }
};

/**
 * Backward compatibility rules:
 * 1. Additive fields only within a schemaVersion (optional properties).
 * 2. Breaking changes require schemaVersion increment + migration function.
 * 3. Readers must ignore unknown fields (tolerant parsing).
 * 4. Writers must populate schemaVersion, appVersion, contentVersion on every snapshot.
 * 5. Trend/Feedback/Action engines consume AssessmentSnapshot, never mutate it.
 */
export const COMPATIBILITY_RULES = {
    additiveFieldsAllowed: true,
    breakingChangesRequireMigration: true,
    tolerantReading: true,
    immutableSnapshots: true
};

export function getCurrentDomainSchemaVersions() {

    return {
        assessmentSnapshot: CURRENT_HISTORY_SNAPSHOT_SCHEMA_VERSION,
        trendResult: DOMAIN_SCHEMA_VERSIONS.TREND_RESULT,
        feedbackResult: DOMAIN_SCHEMA_VERSIONS.FEEDBACK_RESULT,
        actionPlanResult: DOMAIN_SCHEMA_VERSIONS.ACTION_PLAN_RESULT,
        analyticsEvent: DOMAIN_SCHEMA_VERSIONS.ANALYTICS_EVENT,
        userPreferences: DOMAIN_SCHEMA_VERSIONS.USER_PREFERENCES
    };

}
