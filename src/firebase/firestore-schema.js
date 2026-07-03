/**
 * Firestore collection paths and document schemas — Version 2.0 Foundation.
 *
 * participants/{uid}
 *   profile: { name, mobile, localParticipantId }
 *   createdAt, lastAssessmentAt, assessmentCount, schemaVersion
 *
 * assessments/{assessmentId}
 *   uid, timestamp, capturedAt, appVersion, contentVersion
 *   overallPercentage, overallLevel, implementationScore
 *   sectionScores[], communityAnswerRecord, report
 *
 * community/implementation/questionAnswers/{questionId}
 *   counts: { always, often, sometimes, never, total }
 *
 * community/implementation/sectionAggregates/{sectionId}
 *   counts: { always, often, sometimes, never, total }
 *
 * community/implementation/meta
 *   totalSubmissions, lastUpdatedAt, schemaVersion
 *
 * admin/dashboard/metrics
 *   placeholder metrics document for Phase 2 widget wiring
 *
 * system/config
 *   adminEmails[], schemaVersion, minAppVersion
 *
 * system/versions
 *   appVersion metadata for client compatibility checks
 */

export const FIRESTORE_SCHEMA_VERSION = 1;

export const FIRESTORE_PATHS = {
    participants: uid => `participants/${uid}`,
    assessments: assessmentId => `assessments/${assessmentId}`,
    communityQuestionAnswers: questionId => `community/implementation/questionAnswers/${questionId}`,
    communitySectionAggregates: sectionId => `community/implementation/sectionAggregates/${sectionId}`,
    communityMeta: "community/implementation/meta",
    adminDashboardMetrics: "admin/dashboard/metrics",
    systemConfig: "system/config",
    systemVersions: "system/versions"
};

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

export function buildAssessmentFirestorePayload({
    uid,
    assessmentId,
    report,
    participant,
    appVersion,
    contentVersion
}) {

    const assessment = report?.assessment || {};
    const overall = assessment.overall || {};

    return {
        schemaVersion: FIRESTORE_SCHEMA_VERSION,
        uid,
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

export const FirestoreSchema = {
    FIRESTORE_SCHEMA_VERSION,
    FIRESTORE_PATHS,
    createEmptyAnswerCounts,
    buildSectionScoresFromReport,
    buildAssessmentFirestorePayload
};
