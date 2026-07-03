/** @deprecated Import from src/backend/backend-service.js */
export {
    loadTotalParticipantsWidgetData,
    loadCompletedAssessmentsWidgetData,
    loadLatestAssessmentWidgetData,
    loadAverageImplementationWidgetData,
    loadAdminDashboardMetrics,
    loadCommunityQuestionAggregates,
    loadCommunitySectionAggregates,
    buildTrendEngineInputFromAggregates,
    ADMIN_WIDGET_DATA_SOURCES
} from "../backend/backend-service.js";

export const AdminFirestoreService = {
    ADMIN_WIDGET_DATA_SOURCES,
    loadTotalParticipantsWidgetData,
    loadCompletedAssessmentsWidgetData,
    loadLatestAssessmentWidgetData,
    loadAverageImplementationWidgetData,
    loadAdminDashboardMetrics,
    loadCommunityQuestionAggregates,
    loadCommunitySectionAggregates,
    buildTrendEngineInputFromAggregates
};
