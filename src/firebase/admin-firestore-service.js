/**
 * Admin Firestore read layer — Phase 1 foundation only.
 *
 * Widgets continue to use sample data in Phase 1.
 * Phase 2 will map each admin widget to these loaders.
 */
import { getFirestoreDb, isFirebaseReady } from "./firebase-service.js";
import { FIRESTORE_PATHS } from "./firestore-schema.js";
import {
    calculateCommunityAverageImplementation,
    extractImplementationScore,
    mergeLatestImplementationScores
} from "./community-implementation-average.js";

const ASSESSMENT_PAGE_SIZE = 200;

async function getFirestoreModule() {

    return import(`https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js`);

}

export const ADMIN_WIDGET_DATA_SOURCES = {
    totalParticipants: {
        phase: "2.1",
        loader: "loadTotalParticipantsWidgetData",
        firestorePath: "participants/*",
        sampleWidgetIds: ["Total Participants"]
    },
    completedAssessments: {
        phase: "2.1",
        loader: "loadCompletedAssessmentsWidgetData",
        firestorePath: "assessments/*",
        sampleWidgetIds: ["Completed Assessments"]
    },
    latestAssessment: {
        phase: "2.1",
        loader: "loadLatestAssessmentWidgetData",
        firestorePath: "assessments/*",
        sampleWidgetIds: ["Latest Assessment"]
    },
    averageImplementation: {
        phase: "2.1",
        loader: "loadAverageImplementationWidgetData",
        firestorePath: "assessments/*",
        sampleWidgetIds: ["Average Implementation"]
    },
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

function createWidgetResult(status, options = {}) {

    return {
        status,
        value: options.value ?? null,
        lastUpdated: options.lastUpdated ?? null,
        message: options.message ?? ""
    };

}

function mapFirestoreError(error, fallbackMessage = "Unable to load data.") {

    const code = error?.code || "";

    if (code === "permission-denied") {
        return createWidgetResult("permission-denied", {
            message: "Permission denied."
        });
    }

    if (code === "unavailable") {
        return createWidgetResult("unavailable", {
            message: "Firestore unavailable."
        });
    }

    return createWidgetResult("error", {
        message: fallbackMessage
    });

}

async function countCollectionWidgetData(collectionName, options = {}) {

    const {
        emptyMessage,
        errorLogLabel,
        errorMessage
    } = options;

    if (!isFirebaseReady()) {
        return createWidgetResult("unavailable", {
            message: "Firestore unavailable."
        });
    }

    try {
        const firestoreModule = await getFirestoreModule();
        const db = getFirestoreDb();
        const targetCollection = firestoreModule.collection(db, collectionName);
        const loadedAt = new Date().toISOString();

        if (typeof firestoreModule.getCountFromServer === "function") {
            const aggregateSnapshot = await firestoreModule.getCountFromServer(targetCollection);
            const count = aggregateSnapshot.data().count;

            if (count === 0) {
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

        console.warn(
            `getCountFromServer unavailable for ${collectionName}; `
            + "falling back to document scan count. "
            + "Replace with aggregation when SDK support is confirmed."
        );

        const snapshot = await firestoreModule.getDocs(targetCollection);
        const count = snapshot.size;

        if (count === 0) {
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
        return mapFirestoreError(error, errorMessage);
    }

}

/**
 * Count participant profile records in Firestore.
 * Uses server-side aggregation (getCountFromServer) when available.
 *
 * Only documents in `participants/` are counted — not assessments and not
 * anonymous auth sessions without a synced participant profile.
 */
export async function loadTotalParticipantsWidgetData() {

    return countCollectionWidgetData("participants", {
        emptyMessage: "No participants yet.",
        errorLogLabel: "Unable to load total participants widget data.",
        errorMessage: "Unable to load participant count."
    });

}

/**
 * Count submitted assessment records in Firestore.
 * Uses server-side aggregation (getCountFromServer) when available.
 *
 * Counts documents in `assessments/` only — not participants.
 * One participant may have multiple assessment documents.
 */
export async function loadCompletedAssessmentsWidgetData() {

    return countCollectionWidgetData("assessments", {
        emptyMessage: "No assessments submitted yet.",
        errorLogLabel: "Unable to load completed assessments widget data.",
        errorMessage: "Unable to load assessment count."
    });

}

function resolveAssessmentTimestamp(data = {}) {

    const timestamp = data.timestamp;

    if (timestamp && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toISOString();
    }

    if (timestamp && typeof timestamp.seconds === "number") {
        return new Date(timestamp.seconds * 1000).toISOString();
    }

    if (typeof data.capturedAt === "string" && data.capturedAt) {
        return data.capturedAt;
    }

    return null;

}

/**
 * Load the most recent assessment timestamp from Firestore.
 * Queries only one document: orderBy timestamp desc, limit 1.
 */
export async function loadLatestAssessmentWidgetData() {

    if (!isFirebaseReady()) {
        return createWidgetResult("unavailable", {
            message: "Firestore unavailable."
        });
    }

    try {
        const firestoreModule = await getFirestoreModule();
        const db = getFirestoreDb();
        const assessmentsQuery = firestoreModule.query(
            firestoreModule.collection(db, "assessments"),
            firestoreModule.orderBy("timestamp", "desc"),
            firestoreModule.limit(1)
        );
        const loadedAt = new Date().toISOString();
        const snapshot = await firestoreModule.getDocs(assessmentsQuery);

        if (snapshot.empty) {
            return createWidgetResult("empty", {
                lastUpdated: loadedAt,
                message: "No assessments submitted yet."
            });
        }

        const assessmentData = snapshot.docs[0].data();
        const assessmentAt = resolveAssessmentTimestamp(assessmentData);

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
        return mapFirestoreError(error, "Unable to load latest assessment.");
    }

}

/**
 * Calculate community Average Implementation from assessments/.
 *
 * Strategy: paginate assessments ordered by timestamp desc.
 * The first assessment encountered for each uid is that participant's latest score.
 * Does not average all historical submissions.
 */
async function loadLatestImplementationScoresByParticipant() {

    const firestoreModule = await getFirestoreModule();
    const db = getFirestoreDb();
    const latestScoresByParticipant = new Map();
    let lastDocument = null;

    while (true) {
        const constraints = [
            firestoreModule.orderBy("timestamp", "desc"),
            firestoreModule.limit(ASSESSMENT_PAGE_SIZE)
        ];

        if (lastDocument) {
            constraints.push(firestoreModule.startAfter(lastDocument));
        }

        const assessmentsQuery = firestoreModule.query(
            firestoreModule.collection(db, "assessments"),
            ...constraints
        );
        const snapshot = await firestoreModule.getDocs(assessmentsQuery);

        if (snapshot.empty) {
            break;
        }

        mergeLatestImplementationScores(
            latestScoresByParticipant,
            snapshot.docs.map(document => ({
                uid: document.data()?.uid,
                score: extractImplementationScore(document.data())
            }))
        );

        lastDocument = snapshot.docs[snapshot.docs.length - 1];

        if (snapshot.size < ASSESSMENT_PAGE_SIZE) {
            break;
        }
    }

    return latestScoresByParticipant;

}

export async function loadAverageImplementationWidgetData() {

    if (!isFirebaseReady()) {
        return createWidgetResult("unavailable", {
            message: "Firestore unavailable."
        });
    }

    try {
        const loadedAt = new Date().toISOString();
        const latestScoresByParticipant = await loadLatestImplementationScoresByParticipant();
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
        return mapFirestoreError(error, "Unable to load average implementation.");
    }

}

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
    loadTotalParticipantsWidgetData,
    loadCompletedAssessmentsWidgetData,
    loadLatestAssessmentWidgetData,
    loadAverageImplementationWidgetData,
    loadAdminDashboardMetrics,
    loadCommunityQuestionAggregates,
    loadCommunitySectionAggregates,
    buildTrendEngineInputFromAggregates
};
