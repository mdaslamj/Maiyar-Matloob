/**
 * Canonical model ↔ PostgreSQL row mapping (no business logic).
 */

import { CANONICAL_SCHEMA_VERSION } from "../../backend-schema.js";

export function resolveParticipantStorageId(participant = {}) {

    if (!participant || typeof participant !== "object") {
        return null;
    }

    return participant.participantId
        || participant.localParticipantId
        || participant.id
        || null;

}

export function mapParticipantToRow(participant = {}) {

    const participantId = resolveParticipantStorageId(participant);

    return {
        id: participantId,
        local_participant_id: participantId,
        name: participant.name || "",
        mobile: participant.mobile || "",
        created_at: participant.createdAt || new Date().toISOString(),
        last_assessment_at: participant.lastAssessmentAt || null,
        assessment_count: Number(participant.assessmentCount || 0),
        schema_version: CANONICAL_SCHEMA_VERSION,
        metadata: {},
        last_synced_at: new Date().toISOString()
    };

}

export function mapParticipantFromRow(row = {}) {

    return {
        id: row.id,
        localParticipantId: row.local_participant_id,
        name: row.name,
        mobile: row.mobile,
        createdAt: row.created_at,
        lastAssessmentAt: row.last_assessment_at,
        assessmentCount: row.assessment_count,
        schemaVersion: row.schema_version,
        metadata: row.metadata || {}
    };

}

export function buildReportSummary(report = {}) {

    const overall = report?.assessment?.overall || {};

    return {
        overallPercentage: overall.percentage ?? null,
        overallLevel: overall.level ?? null,
        capturedAt: report?.communityAnswerRecord?.capturedAt || null
    };

}

export function mapReportToRow(report, { appVersion, contentVersion } = {}) {

    return {
        report,
        summary: buildReportSummary(report),
        version: `${appVersion || "unknown"}:${contentVersion || "unknown"}`,
        metadata: {
            appVersion: appVersion || "unknown",
            contentVersion: contentVersion || "unknown"
        },
        schema_version: CANONICAL_SCHEMA_VERSION
    };

}

export function mapReportFromRow(row = {}) {

    return {
        id: row.id,
        report: row.report,
        summary: row.summary || {},
        version: row.version,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        schemaVersion: row.schema_version
    };

}

export function mapAssessmentToRow(payload = {}, reportId) {

    return {
        id: payload.assessmentId,
        participant_id: payload.participantId,
        report_id: reportId,
        captured_at: payload.capturedAt,
        timestamp: payload.capturedAt,
        app_version: payload.appVersion,
        content_version: payload.contentVersion,
        overall_percentage: payload.overallPercentage,
        overall_level: payload.overallLevel,
        implementation_score: payload.implementationScore,
        section_scores: payload.sectionScores || [],
        community_answer_record: payload.communityAnswerRecord || null,
        schema_version: CANONICAL_SCHEMA_VERSION
    };

}

export function mapAssessmentFromRow(row = {}, reportRow = null) {

    return {
        id: row.id,
        participantId: row.participant_id,
        reportId: row.report_id,
        capturedAt: row.captured_at,
        timestamp: row.timestamp,
        appVersion: row.app_version,
        contentVersion: row.content_version,
        overallPercentage: row.overall_percentage,
        overallLevel: row.overall_level,
        implementationScore: row.implementation_score,
        sectionScores: row.section_scores || [],
        communityAnswerRecord: row.community_answer_record,
        schemaVersion: row.schema_version,
        report: reportRow?.report || null
    };

}

export function mapAssessmentScoreRow(row = {}) {

    return {
        participantId: row.participant_id,
        uid: row.participant_id,
        implementationScore: row.implementation_score,
        overallPercentage: row.overall_percentage,
        timestamp: row.timestamp,
        id: row.id
    };

}

export const SupabaseSchemaMapper = {
    resolveParticipantStorageId,
    mapParticipantToRow,
    mapParticipantFromRow,
    mapReportToRow,
    mapReportFromRow,
    mapAssessmentToRow,
    mapAssessmentFromRow,
    mapAssessmentScoreRow
};
