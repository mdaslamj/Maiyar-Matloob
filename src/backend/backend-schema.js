/**
 * Canonical data model — Version 2.2 baseline.
 * Provider-neutral entity definitions and payload builders.
 */

export const CANONICAL_SCHEMA_VERSION = 1;

export const BACKEND_PATHS = {
    participants: participantId => `participants/${participantId}`,
    assessments: assessmentId => `assessments/${assessmentId}`,
    communityQuestionAnswers: questionId => `community/implementation/questionAnswers/${questionId}`,
    communitySectionAggregates: sectionId => `community/implementation/sectionAggregates/${sectionId}`,
    communityMeta: "community/implementation/meta",
    adminDashboardMetrics: "admin/dashboard/metrics",
    systemConfig: "system/config",
    systemVersions: "system/versions"
};

/** @deprecated Use BACKEND_PATHS — retained for Firebase provider mapping */
export const FIRESTORE_PATHS = BACKEND_PATHS;

/** @deprecated Use CANONICAL_SCHEMA_VERSION */
export const FIRESTORE_SCHEMA_VERSION = CANONICAL_SCHEMA_VERSION;

export function createEmptyAnswerCounts() {

    return {
        always: 0,
        often: 0,
        sometimes: 0,
        never: 0,
        total: 0
    };

}

export function buildSectionScoresFromReport(report) {

    const categories = report?.assessment?.categories || [];

    return categories.map(category => ({
        sectionId: category.id || category.title,
        title: category.title,
        percentage: category.percentage,
        level: category.level,
        raw: category.raw,
        max: category.max
    }));

}

/**
 * Build canonical Assessment persistence payload from a completed report.
 */
export function buildAssessmentPayload({
    participantId,
    assessmentId,
    report,
    participant,
    appVersion,
    contentVersion
}) {

    const assessment = report?.assessment || {};
    const overall = assessment.overall || {};

    return {
        schemaVersion: CANONICAL_SCHEMA_VERSION,
        participantId,
        assessmentId,
        capturedAt: report?.communityAnswerRecord?.capturedAt || new Date().toISOString(),
        appVersion: appVersion || "unknown",
        contentVersion: contentVersion || "unknown",
        overallPercentage: overall.percentage ?? null,
        overallLevel: overall.level ?? null,
        implementationScore: overall.percentage ?? null,
        sectionScores: buildSectionScoresFromReport(report),
        communityAnswerRecord: report?.communityAnswerRecord || null,
        participant: participant
            ? {
                localParticipantId: participant.participantId,
                name: participant.name,
                mobile: participant.mobile
            }
            : null,
        report
    };

}

/** @deprecated Use buildAssessmentPayload */
export function buildAssessmentFirestorePayload({
    uid,
    assessmentId,
    report,
    participant,
    appVersion,
    contentVersion
}) {

    return {
        ...buildAssessmentPayload({
            participantId: uid,
            assessmentId,
            report,
            participant,
            appVersion,
            contentVersion
        }),
        uid
    };

}

export const BackendSchema = {
    CANONICAL_SCHEMA_VERSION,
    BACKEND_PATHS,
    createEmptyAnswerCounts,
    buildSectionScoresFromReport,
    buildAssessmentPayload,
    buildAssessmentFirestorePayload
};
