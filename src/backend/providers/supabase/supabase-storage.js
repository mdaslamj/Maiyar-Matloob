/**
 * Supabase Storage Adapter — Version 2.3 Phase B (storage only).
 */

import {
    buildAssessmentPayload,
    CANONICAL_SCHEMA_VERSION
} from "../../backend-schema.js";
import { createWidgetResult, mapStorageError } from "../../shared/widget-result.js";
import { syncCommunityAnswerRecord } from "./supabase-community-sync.js";
import {
    getSupabaseClient,
    initializeSupabaseClient,
    isSupabaseReady
} from "./supabase-client.js";
import {
    mapAssessmentFromRow,
    mapAssessmentScoreRow,
    mapParticipantDirectoryEntry,
    mapParticipantFromRow,
    mapParticipantToRow,
    mapReportFromRow,
    mapReportToRow,
    resolveParticipantStorageId
} from "./supabase-schema-mapper.js";

const ASSESSMENT_PAGE_SIZE = 200;

function createAssessmentId() {

    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `assessment-${Date.now()}-${Math.random().toString(16).slice(2)}`;

}

function mapSupabaseError(error, fallbackMessage) {

    if (!error) {
        return createWidgetResult("error", { message: fallbackMessage });
    }

    if (error.code === "PGRST116") {
        return createWidgetResult("empty", { message: fallbackMessage });
    }

    return mapStorageError(error, fallbackMessage);

}

async function countTable(tableName, options = {}) {

    const {
        emptyMessage,
        errorLogLabel,
        errorMessage
    } = options;

    if (!isSupabaseReady()) {
        return createWidgetResult("unavailable", {
            message: "Backend unavailable."
        });
    }

    try {
        const supabase = getSupabaseClient();
        const loadedAt = new Date().toISOString();
        const { count, error } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

        if (error) {
            throw error;
        }

        if (!count) {
            return createWidgetResult("empty", {
                value: 0,
                lastUpdated: loadedAt,
                message: emptyMessage
            });
        }

        return createWidgetResult("success", {
            value: count,
            lastUpdated: loadedAt,
            message: ""
        });
    }
    catch (error) {
        console.warn(errorLogLabel, error);
        return mapSupabaseError(error, errorMessage);
    }

}

export function createSupabaseStorageAdapter() {

    return {
        getProviderName() {
            return "supabase";
        },

        async initialize() {
            return initializeSupabaseClient();
        },

        isReady() {
            return isSupabaseReady();
        },

        async saveParticipant(participant) {

            const participantId = resolveParticipantStorageId(participant);

            if (!isSupabaseReady() || !participantId || !participant) {
                return { success: false, reason: "participant-sync-skipped" };
            }

            try {
                const supabase = getSupabaseClient();
                const row = mapParticipantToRow(participant);
                const { error } = await supabase
                    .from("participants")
                    .upsert(row, { onConflict: "id" });

                if (error) {
                    throw error;
                }

                return {
                    success: true,
                    reason: "participant-sync-complete",
                    uid: participantId,
                    participantId
                };
            }
            catch (error) {
                console.warn("Participant Supabase sync failed.", error);

                return {
                    success: false,
                    reason: "participant-sync-failed",
                    error: error?.message || String(error)
                };
            }

        },

        async saveAssessment({
            report,
            participant,
            questionnaire,
            appVersion,
            contentVersion,
            getQuestionSection
        }) {

            if (!isSupabaseReady() || !report || !participant) {
                return { success: false, reason: "assessment-sync-skipped" };
            }

            const participantId = resolveParticipantStorageId(participant);

            if (!participantId) {
                return { success: false, reason: "assessment-sync-skipped" };
            }

            const assessmentId = createAssessmentId();

            try {
                const supabase = getSupabaseClient();
                const payload = buildAssessmentPayload({
                    participantId,
                    assessmentId,
                    report,
                    participant,
                    appVersion,
                    contentVersion
                });

                if (participant) {
                    const participantResult = await this.saveParticipant({
                        ...participant,
                        lastAssessmentAt: payload.capturedAt,
                        assessmentCount: Number(participant.assessmentCount || 0)
                    });

                    if (!participantResult.success) {
                        return participantResult;
                    }
                }

                const assessmentTimestamp = new Date().toISOString();
                const { error: persistError } = await supabase.rpc(
                    "persist_assessment_submission",
                    {
                        p_report: mapReportToRow(report, { appVersion, contentVersion }),
                        p_assessment: {
                            id: assessmentId,
                            participant_id: participantId,
                            captured_at: payload.capturedAt,
                            timestamp: assessmentTimestamp,
                            app_version: payload.appVersion,
                            content_version: payload.contentVersion,
                            overall_percentage: payload.overallPercentage,
                            overall_level: payload.overallLevel,
                            implementation_score: payload.implementationScore,
                            section_scores: payload.sectionScores || [],
                            community_answer_record: payload.communityAnswerRecord || null,
                            schema_version: CANONICAL_SCHEMA_VERSION
                        }
                    }
                );

                if (persistError) {
                    throw persistError;
                }

                const communityResult = await syncCommunityAnswerRecord(
                    report.communityAnswerRecord,
                    questionnaire,
                    getQuestionSection
                );

                return {
                    success: true,
                    reason: "assessment-sync-complete",
                    assessmentId,
                    uid: participantId,
                    participantId,
                    communityResult
                };
            }
            catch (error) {
                console.warn("Assessment Supabase sync failed.", error);

                return {
                    success: false,
                    reason: "assessment-sync-failed",
                    error: error?.message || String(error)
                };
            }

        },

        async recordClientVersion(appVersion, contentVersion, participantId = null) {

            if (!isSupabaseReady()) {
                return { success: false, reason: "system-version-skipped" };
            }

            try {
                const supabase = getSupabaseClient();
                const { error } = await supabase
                    .from("system_versions")
                    .upsert({
                        id: "default",
                        last_client_app_version: appVersion || "unknown",
                        last_client_content_version: contentVersion || "unknown",
                        last_seen_at: new Date().toISOString(),
                        last_seen_participant_id: participantId,
                        schema_version: CANONICAL_SCHEMA_VERSION
                    }, { onConflict: "id" });

                if (error) {
                    throw error;
                }

                return { success: true };
            }
            catch (error) {
                return {
                    success: false,
                    reason: "system-version-failed",
                    error: error?.message || String(error)
                };
            }

        },

        async loadParticipant(participantId) {

            if (!isSupabaseReady() || !participantId) {
                return null;
            }

            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from("participants")
                .select("*")
                .eq("id", participantId)
                .maybeSingle();

            if (error || !data) {
                return null;
            }

            return mapParticipantFromRow(data);

        },

        async loadAssessment(assessmentId) {

            if (!isSupabaseReady() || !assessmentId) {
                return null;
            }

            const supabase = getSupabaseClient();
            const { data: assessmentRow, error: assessmentError } = await supabase
                .from("assessments")
                .select("*")
                .eq("id", assessmentId)
                .maybeSingle();

            if (assessmentError || !assessmentRow) {
                return null;
            }

            const { data: reportRow } = await supabase
                .from("reports")
                .select("*")
                .eq("id", assessmentRow.report_id)
                .maybeSingle();

            return mapAssessmentFromRow(assessmentRow, reportRow);

        },

        countParticipants() {
            return countTable("participants", {
                emptyMessage: "No participants yet.",
                errorLogLabel: "Unable to load total participants widget data.",
                errorMessage: "Unable to load participant count."
            });
        },

        countAssessments() {
            return countTable("assessments", {
                emptyMessage: "No assessments submitted yet.",
                errorLogLabel: "Unable to load completed assessments widget data.",
                errorMessage: "Unable to load assessment count."
            });
        },

        async loadLatestAssessment() {

            if (!isSupabaseReady()) {
                return createWidgetResult("unavailable", {
                    message: "Backend unavailable."
                });
            }

            try {
                const supabase = getSupabaseClient();
                const loadedAt = new Date().toISOString();
                const { data, error } = await supabase
                    .from("assessments")
                    .select("timestamp, captured_at")
                    .order("timestamp", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                if (!data) {
                    return createWidgetResult("empty", {
                        lastUpdated: loadedAt,
                        message: "No assessments submitted yet."
                    });
                }

                const assessmentAt = data.timestamp || data.captured_at;

                if (!assessmentAt) {
                    return createWidgetResult("error", {
                        message: "Unable to load latest assessment."
                    });
                }

                return createWidgetResult("success", {
                    value: assessmentAt,
                    lastUpdated: loadedAt,
                    message: ""
                });
            }
            catch (error) {
                console.warn("Unable to load latest assessment widget data.", error);
                return mapSupabaseError(error, "Unable to load latest assessment.");
            }

        },

        async loadAssessmentScoreBatch({ cursor = 0, limit = ASSESSMENT_PAGE_SIZE } = {}) {

            if (!isSupabaseReady()) {
                return { rows: [], hasMore: false, nextCursor: null };
            }

            const offset = Number.isFinite(Number(cursor)) ? Number(cursor) : 0;
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from("assessments")
                .select("id, participant_id, implementation_score, overall_percentage, timestamp")
                .order("timestamp", { ascending: false })
                .order("id", { ascending: false })
                .range(offset, offset + limit - 1);

            if (error || !Array.isArray(data)) {
                console.warn("Unable to load assessment score batch.", error);
                return { rows: [], hasMore: false, nextCursor: null };
            }

            return {
                rows: data.map(mapAssessmentScoreRow),
                hasMore: data.length >= limit,
                nextCursor: data.length >= limit ? offset + data.length : null
            };

        },

        async loadAdminDashboardMetrics() {

            if (!isSupabaseReady()) {
                return null;
            }

            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from("admin_dashboard_metrics")
                    .select("metrics")
                    .eq("id", "default")
                    .maybeSingle();

                if (error || !data) {
                    return null;
                }

                return data.metrics || null;
            }
            catch (error) {
                console.warn("Unable to load admin dashboard metrics.", error);
                return null;
            }

        },

        async loadCommunityQuestionAggregates() {

            if (!isSupabaseReady()) {
                return [];
            }

            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from("community_question_answers")
                    .select("*");

                if (error || !Array.isArray(data)) {
                    return [];
                }

                return data.map(row => ({
                    questionId: row.question_id,
                    counts: row.counts,
                    updatedAt: row.updated_at,
                    schemaVersion: row.schema_version
                }));
            }
            catch (error) {
                console.warn("Unable to load community question aggregates.", error);
                return [];
            }

        },

        async loadCommunitySectionAggregates() {

            if (!isSupabaseReady()) {
                return [];
            }

            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from("community_section_aggregates")
                    .select("*");

                if (error || !Array.isArray(data)) {
                    return [];
                }

                return data.map(row => ({
                    sectionId: row.section_id,
                    title: row.title,
                    counts: row.counts,
                    updatedAt: row.updated_at,
                    schemaVersion: row.schema_version
                }));
            }
            catch (error) {
                console.warn("Unable to load community section aggregates.", error);
                return [];
            }

        },

        async loadParticipantDirectory() {

            if (!isSupabaseReady()) {
                return {
                    status: "unavailable",
                    rows: [],
                    lastUpdated: null,
                    message: "Backend unavailable."
                };
            }

            try {
                const supabase = getSupabaseClient();
                const loadedAt = new Date().toISOString();
                const { data: participantRows, error: participantError } = await supabase
                    .from("participants")
                    .select("id, local_participant_id, assessment_count, last_assessment_at")
                    .order("last_assessment_at", { ascending: false, nullsFirst: false });

                if (participantError) {
                    throw participantError;
                }

                const latestAssessmentsByParticipant = new Map();
                let offset = 0;

                while (true) {
                    const { data: assessmentRows, error: assessmentError } = await supabase
                        .from("assessments")
                        .select("participant_id, overall_level, timestamp")
                        .order("timestamp", { ascending: false })
                        .range(offset, offset + ASSESSMENT_PAGE_SIZE - 1);

                    if (assessmentError) {
                        throw assessmentError;
                    }

                    if (!Array.isArray(assessmentRows) || !assessmentRows.length) {
                        break;
                    }

                    assessmentRows.forEach(row => {
                        if (!latestAssessmentsByParticipant.has(row.participant_id)) {
                            latestAssessmentsByParticipant.set(row.participant_id, {
                                overallLevel: row.overall_level,
                                timestamp: row.timestamp
                            });
                        }
                    });

                    if (assessmentRows.length < ASSESSMENT_PAGE_SIZE) {
                        break;
                    }

                    offset += assessmentRows.length;
                }

                const rows = (participantRows || []).map(row => mapParticipantDirectoryEntry(
                    row,
                    latestAssessmentsByParticipant.get(row.id)
                ));

                if (!rows.length) {
                    return {
                        status: "empty",
                        rows: [],
                        lastUpdated: loadedAt,
                        message: "No participants yet."
                    };
                }

                return {
                    status: "success",
                    rows,
                    lastUpdated: loadedAt,
                    message: ""
                };
            }
            catch (error) {
                console.warn("Unable to load participant directory.", error);

                return {
                    status: "error",
                    rows: [],
                    lastUpdated: null,
                    message: "Unable to load participant directory."
                };
            }

        }
    };

}

export const SupabaseStorageAdapter = {
    createSupabaseStorageAdapter
};
