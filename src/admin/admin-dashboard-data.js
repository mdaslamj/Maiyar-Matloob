/**
 * Load live Admin Dashboard widget data.
 * UI components must not access Firestore directly.
 */
import { isFirebaseEnabled } from "../shared/feature-flags.js";
import {
    loadAverageImplementationWidgetData,
    loadCompletedAssessmentsWidgetData,
    loadLatestAssessmentWidgetData,
    loadTotalParticipantsWidgetData
} from "../firebase/admin-firestore-service.js";

export function isAdminLiveDataEnabled() {

    return isFirebaseEnabled();

}

function createLoadingWidget() {

    return {
        status: "loading",
        value: null,
        lastUpdated: null,
        message: "Loading..."
    };

}

export function createLoadingTotalParticipantsWidget() {

    return createLoadingWidget();

}

export function createLoadingCompletedAssessmentsWidget() {

    return createLoadingWidget();

}

export function createLoadingLatestAssessmentWidget() {

    return createLoadingWidget();

}

export function createLoadingAverageImplementationWidget() {

    return createLoadingWidget();

}

export async function loadDashboardLiveWidgets() {

    if (!isAdminLiveDataEnabled()) {
        return {
            useLiveTotalParticipants: false,
            useLiveCompletedAssessments: false,
            useLiveLatestAssessment: false,
            useLiveAverageImplementation: false,
            liveWidgets: {}
        };
    }

    const [
        totalParticipants,
        completedAssessments,
        latestAssessment,
        averageImplementation
    ] = await Promise.all([
        loadTotalParticipantsWidgetData(),
        loadCompletedAssessmentsWidgetData(),
        loadLatestAssessmentWidgetData(),
        loadAverageImplementationWidgetData()
    ]);

    return {
        useLiveTotalParticipants: true,
        useLiveCompletedAssessments: true,
        useLiveLatestAssessment: true,
        useLiveAverageImplementation: true,
        liveWidgets: {
            totalParticipants,
            completedAssessments,
            latestAssessment,
            averageImplementation
        }
    };

}

export const AdminDashboardData = {
    isAdminLiveDataEnabled,
    createLoadingTotalParticipantsWidget,
    createLoadingCompletedAssessmentsWidget,
    createLoadingLatestAssessmentWidget,
    createLoadingAverageImplementationWidget,
    loadDashboardLiveWidgets
};
