/**
 * No-op Storage Adapter — active when backend sync is disabled.
 */

import { createWidgetResult } from "../../shared/widget-result.js";

export function createNoOpStorageAdapter() {

    return {
        getProviderName() {
            return "none";
        },

        async initialize() {
            return { ready: false, reason: "backend-disabled" };
        },

        isReady() {
            return false;
        },

        async saveParticipant() {
            return { success: false, reason: "backend-disabled" };
        },

        async saveAssessment() {
            return { success: false, reason: "backend-disabled" };
        },

        async recordClientVersion() {
            return { success: false, reason: "backend-disabled" };
        },

        async countParticipants() {
            return createWidgetResult("unavailable", { message: "Backend unavailable." });
        },

        async countAssessments() {
            return createWidgetResult("unavailable", { message: "Backend unavailable." });
        },

        async loadLatestAssessment() {
            return createWidgetResult("unavailable", { message: "Backend unavailable." });
        },

        async loadAssessmentScoreBatch() {
            return { rows: [], hasMore: false, nextCursor: null };
        },

        async loadAdminDashboardMetrics() {
            return null;
        },

        async loadCommunityQuestionAggregates() {
            return [];
        },

        async loadCommunitySectionAggregates() {
            return [];
        }
    };

}
