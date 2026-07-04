/**
 * Backend Service — single public entry point for application and admin layers.
 * Version 2.2 Phase A.
 */

import {
    getActiveProviderName,
    getIdentityAdapter,
    getStorageAdapter,
    initializeBackendAdapters,
    isBackendReady
} from "./backend-adapter.js";
import { isBackendSyncEnabled } from "./backend-config.js";
import {
    calculateCommunityAverageImplementation,
    extractImplementationScore,
    mergeLatestImplementationScores
} from "../domain/community/implementation-average.js";
import { createWidgetResult } from "./shared/widget-result.js";

const ASSESSMENT_PAGE_SIZE = 200;

export const ADMIN_WIDGET_DATA_SOURCES = {
    totalParticipants: {
        phase: "2.1",
        loader: "loadTotalParticipantsWidgetData",
        path: "participants/*",
        sampleWidgetIds: ["Total Participants"]
    },
    completedAssessments: {
        phase: "2.1",
        loader: "loadCompletedAssessmentsWidgetData",
        path: "assessments/*",
        sampleWidgetIds: ["Completed Assessments"]
    },
    latestAssessment: {
        phase: "2.1",
        loader: "loadLatestAssessmentWidgetData",
        path: "assessments/*",
        sampleWidgetIds: ["Latest Assessment"]
    },
    averageImplementation: {
        phase: "2.1",
        loader: "loadAverageImplementationWidgetData",
        path: "assessments/*",
        sampleWidgetIds: ["Average Implementation"]
    },
    dashboardSummary: {
        phase: 2,
        loader: "loadAdminDashboardMetrics",
        path: "admin/dashboard/metrics",
        sampleWidgetIds: [
            "Total Participants",
            "Active Participants",
            "Completed Assessments",
            "Average Implementation"
        ]
    },
    implementationInsights: {
        phase: 2,
        loader: "loadCommunityQuestionAggregates",
        path: "community/implementation/questionAnswers/*",
        sampleWidgetIds: [
            "Overall Distribution",
            "Most Implemented Teachings",
            "Least Implemented Teachings"
        ]
    },
    sectionInsights: {
        phase: 2,
        loader: "loadCommunitySectionAggregates",
        path: "community/implementation/sectionAggregates/*",
        sampleWidgetIds: ["Section Implementation Table"]
    },
    trends: {
        phase: 2,
        loader: "loadCommunityTrendInputs",
        path: "assessments/* + Trend Engine",
        sampleWidgetIds: ["Implementation Trends"]
    },
    users: {
        phase: 2,
        loader: "loadParticipantDirectory",
        path: "participants/*",
        sampleWidgetIds: ["Participant Directory"]
    }
};

export function isAdminLiveDataEnabled() {

    return isBackendSyncEnabled();

}

export async function initializeBackendInfrastructure() {

    return initializeBackendAdapters();

}

export function isBackendInfrastructureReady() {

    return isBackendReady();

}

export function getBackendProviderName() {

    return getActiveProviderName();

}

export async function ensureParticipantIdentity() {

    return getIdentityAdapter().ensureParticipantIdentity();

}

export function getParticipantIdentityId() {

    return getIdentityAdapter().getParticipantIdentityId();

}

export async function saveParticipant(participant) {

    return getStorageAdapter().saveParticipant(participant);

}

export async function saveAssessment(options) {

    return getStorageAdapter().saveAssessment(options);

}

export async function recordClientVersion(appVersion, contentVersion) {

    return getStorageAdapter().recordClientVersion(appVersion, contentVersion);

}

export async function signInAdminWithGoogle() {

    return getIdentityAdapter().signInAdminWithGoogle();

}

export async function signOutAdminSession() {

    return getIdentityAdapter().signOut();

}

export async function requireAdminSession() {

    return getIdentityAdapter().requireAdminSession();

}

export function watchAdminSession(callback) {

    return getIdentityAdapter().watchSession(callback);

}

export function isAuthorizedAdminEmail(email) {

    return getIdentityAdapter().isAuthorizedAdmin(email);

}

export async function loadTotalParticipantsWidgetData() {

    return getStorageAdapter().countParticipants();

}

export async function loadCompletedAssessmentsWidgetData() {

    return getStorageAdapter().countAssessments();

}

export async function loadLatestAssessmentWidgetData() {

    return getStorageAdapter().loadLatestAssessment();

}

export async function loadAverageImplementationWidgetData() {

    const storage = getStorageAdapter();

    if (!storage.isReady()) {
        return createWidgetResult("unavailable", {
            message: "Backend unavailable."
        });
    }

    try {
        const loadedAt = new Date().toISOString();
        const latestScoresByParticipant = new Map();
        let cursor = null;

        while (true) {
            const batch = await storage.loadAssessmentScoreBatch({
                cursor,
                limit: ASSESSMENT_PAGE_SIZE
            });

            if (!batch.rows.length) {
                break;
            }

            mergeLatestImplementationScores(
                latestScoresByParticipant,
                batch.rows.map(row => ({
                    participantId: row.participantId,
                    uid: row.uid,
                    score: extractImplementationScore(row)
                }))
            );

            if (!batch.hasMore || !batch.nextCursor) {
                break;
            }

            cursor = batch.nextCursor;
        }

        const average = calculateCommunityAverageImplementation(latestScoresByParticipant);

        if (average == null) {
            return createWidgetResult("empty", {
                lastUpdated: loadedAt,
                message: "No completed assessments yet."
            });
        }

        return createWidgetResult("success", {
            value: average,
            lastUpdated: loadedAt,
            message: ""
        });
    }
    catch (error) {
        console.warn("Unable to load average implementation widget data.", error);

        return createWidgetResult("error", {
            message: "Unable to load average implementation."
        });
    }

}

export async function loadAdminDashboardMetrics() {

    return getStorageAdapter().loadAdminDashboardMetrics();

}

export async function loadCommunityQuestionAggregates() {

    return getStorageAdapter().loadCommunityQuestionAggregates();

}

export async function loadCommunitySectionAggregates() {

    return getStorageAdapter().loadCommunitySectionAggregates();

}

export async function loadParticipantDirectory() {

    return getStorageAdapter().loadParticipantDirectory();

}

export function buildTrendEngineInputFromAggregates(questionAggregates = []) {

    return questionAggregates.map(entry => ({
        snapshotId: entry.questionId,
        createdAt: entry.updatedAt || new Date().toISOString(),
        questionAnswers: entry.latestAnswers || {}
    }));

}

export const BackendService = {
    ADMIN_WIDGET_DATA_SOURCES,
    isAdminLiveDataEnabled,
    initializeBackendInfrastructure,
    isBackendInfrastructureReady,
    getBackendProviderName,
    ensureParticipantIdentity,
    getParticipantIdentityId,
    saveParticipant,
    saveAssessment,
    recordClientVersion,
    signInAdminWithGoogle,
    signOutAdminSession,
    requireAdminSession,
    watchAdminSession,
    isAuthorizedAdminEmail,
    loadTotalParticipantsWidgetData,
    loadCompletedAssessmentsWidgetData,
    loadLatestAssessmentWidgetData,
    loadAverageImplementationWidgetData,
    loadAdminDashboardMetrics,
    loadCommunityQuestionAggregates,
    loadCommunitySectionAggregates,
    loadParticipantDirectory,
    buildTrendEngineInputFromAggregates
};
