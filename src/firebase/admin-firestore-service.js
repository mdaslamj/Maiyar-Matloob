/**
 * Admin Firestore read layer — Phase 1 foundation only.
 *
 * Widgets continue to use sample data in Phase 1.
 * Phase 2 will map each admin widget to these loaders.
 */
import { getFirestoreDb, isFirebaseReady } from "./firebase-service.js";
import { FIRESTORE_PATHS } from "./firestore-schema.js";

async function getFirestoreModule() {

    return import(`https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js`);

}

export const ADMIN_WIDGET_DATA_SOURCES = {
    dashboardSummary: {
        phase: 2,
        loader: "loadAdminDashboardMetrics",
        firestorePath: FIRESTORE_PATHS.adminDashboardMetrics,
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
        firestorePath: "community/implementation/questionAnswers/*",
        sampleWidgetIds: [
            "Overall Distribution",
            "Most Implemented Teachings",
            "Least Implemented Teachings"
        ]
    },
    sectionInsights: {
        phase: 2,
        loader: "loadCommunitySectionAggregates",
        firestorePath: "community/implementation/sectionAggregates/*",
        sampleWidgetIds: ["Section Implementation Table"]
    },
    trends: {
        phase: 2,
        loader: "loadCommunityTrendInputs",
        firestorePath: "assessments/* + Trend Engine",
        sampleWidgetIds: ["Implementation Trends"]
    },
    users: {
        phase: 2,
        loader: "loadParticipantDirectory",
        firestorePath: "participants/*",
        sampleWidgetIds: ["Participant Directory"]
    }
};

export async function loadAdminDashboardMetrics() {

    if (!isFirebaseReady()) {
        return null;
    }

    try {
        const { doc, getDoc } = await getFirestoreModule();
        const snapshot = await getDoc(doc(getFirestoreDb(), FIRESTORE_PATHS.adminDashboardMetrics));

        return snapshot.exists() ? snapshot.data() : null;
    }
    catch (error) {
        console.warn("Unable to load admin dashboard metrics.", error);
        return null;
    }

}

export async function loadCommunityQuestionAggregates() {

    if (!isFirebaseReady()) {
        return [];
    }

    try {
        const { collection, getDocs } = await getFirestoreModule();
        const snapshot = await getDocs(collection(getFirestoreDb(), "community", "implementation", "questionAnswers"));

        return snapshot.docs.map(document => ({
            questionId: document.id,
            ...document.data()
        }));
    }
    catch (error) {
        console.warn("Unable to load community question aggregates.", error);
        return [];
    }

}

export async function loadCommunitySectionAggregates() {

    if (!isFirebaseReady()) {
        return [];
    }

    try {
        const { collection, getDocs } = await getFirestoreModule();
        const snapshot = await getDocs(collection(getFirestoreDb(), "community", "implementation", "sectionAggregates"));

        return snapshot.docs.map(document => ({
            sectionId: document.id,
            ...document.data()
        }));
    }
    catch (error) {
        console.warn("Unable to load community section aggregates.", error);
        return [];
    }

}

/**
 * Phase 2 helper — convert Firestore aggregate docs into Trend Engine inputs.
 * Keeps intelligence in Trend Engine; Firestore remains storage only.
 */
export function buildTrendEngineInputFromAggregates(questionAggregates = []) {

    return questionAggregates.map(entry => ({
        snapshotId: entry.questionId,
        createdAt: entry.updatedAt || new Date().toISOString(),
        questionAnswers: entry.latestAnswers || {}
    }));

}

export const AdminFirestoreService = {
    ADMIN_WIDGET_DATA_SOURCES,
    loadAdminDashboardMetrics,
    loadCommunityQuestionAggregates,
    loadCommunitySectionAggregates,
    buildTrendEngineInputFromAggregates,
    buildOverallDistributionFromAggregates
};
