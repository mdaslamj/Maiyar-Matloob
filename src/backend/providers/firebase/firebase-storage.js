import {
    getFirestoreDb,
    getFirestoreModule,
    initializeFirebaseClient,
    isFirebaseReady
} from "./firebase-client.js";
import {
    recordSystemClientVersion,
    saveAssessmentSubmission,
    saveParticipantProfile
} from "./firestore-assessment-sync.js";
import { BACKEND_PATHS } from "../../backend-schema.js";
import { createWidgetResult, mapStorageError } from "../../shared/widget-result.js";
import { mapParticipantDirectoryEntry } from "../supabase/supabase-schema-mapper.js";

const ASSESSMENT_PAGE_SIZE = 200;

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
            + "falling back to document scan count."
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
        return mapStorageError(error, errorMessage);
    }

}

export function createFirebaseStorageAdapter() {

    return {
        getProviderName() {
            return "firebase";
        },

        async initialize() {
            return initializeFirebaseClient();
        },

        isReady() {
            return isFirebaseReady();
        },

        saveParticipant(participant) {
            return saveParticipantProfile(participant);
        },

        saveAssessment(options) {
            return saveAssessmentSubmission(options);
        },

        recordClientVersion(appVersion, contentVersion) {
            return recordSystemClientVersion(appVersion, contentVersion);
        },

        countParticipants() {
            return countCollectionWidgetData("participants", {
                emptyMessage: "No participants yet.",
                errorLogLabel: "Unable to load total participants widget data.",
                errorMessage: "Unable to load participant count."
            });
        },

        countAssessments() {
            return countCollectionWidgetData("assessments", {
                emptyMessage: "No assessments submitted yet.",
                errorLogLabel: "Unable to load completed assessments widget data.",
                errorMessage: "Unable to load assessment count."
            });
        },

        async loadLatestAssessment() {

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
                return mapStorageError(error, "Unable to load latest assessment.");
            }

        },

        async loadAssessmentScoreBatch({ cursor = null, limit = ASSESSMENT_PAGE_SIZE } = {}) {

            if (!isFirebaseReady()) {
                return { rows: [], hasMore: false, nextCursor: null };
            }

            const firestoreModule = await getFirestoreModule();
            const db = getFirestoreDb();
            const constraints = [
                firestoreModule.orderBy("timestamp", "desc"),
                firestoreModule.limit(limit)
            ];

            if (cursor) {
                constraints.push(firestoreModule.startAfter(cursor));
            }

            const assessmentsQuery = firestoreModule.query(
                firestoreModule.collection(db, "assessments"),
                ...constraints
            );
            const snapshot = await firestoreModule.getDocs(assessmentsQuery);

            if (snapshot.empty) {
                return { rows: [], hasMore: false, nextCursor: null };
            }

            const rows = snapshot.docs.map(document => {
                const data = document.data();

                return {
                    participantId: data.uid || data.participantId || null,
                    uid: data.uid || data.participantId || null,
                    implementationScore: data.implementationScore ?? null,
                    overallPercentage: data.overallPercentage ?? null,
                    overallLevel: data.overallLevel ?? null,
                    timestamp: resolveAssessmentTimestamp(data)
                };
            });

            const lastDocument = snapshot.docs[snapshot.docs.length - 1];

            return {
                rows,
                hasMore: snapshot.size >= limit,
                nextCursor: lastDocument
            };

        },

        async loadAdminDashboardMetrics() {

            if (!isFirebaseReady()) {
                return null;
            }

            try {
                const { doc, getDoc } = await getFirestoreModule();
                const snapshot = await getDoc(doc(getFirestoreDb(), BACKEND_PATHS.adminDashboardMetrics));

                return snapshot.exists() ? snapshot.data() : null;
            }
            catch (error) {
                console.warn("Unable to load admin dashboard metrics.", error);
                return null;
            }

        },

        async loadCommunityQuestionAggregates() {

            if (!isFirebaseReady()) {
                return [];
            }

            try {
                const { collection, getDocs } = await getFirestoreModule();
                const snapshot = await getDocs(
                    collection(getFirestoreDb(), "community", "implementation", "questionAnswers")
                );

                return snapshot.docs.map(document => ({
                    questionId: document.id,
                    ...document.data()
                }));
            }
            catch (error) {
                console.warn("Unable to load community question aggregates.", error);
                return [];
            }

        },

        async loadCommunitySectionAggregates() {

            if (!isFirebaseReady()) {
                return [];
            }

            try {
                const { collection, getDocs } = await getFirestoreModule();
                const snapshot = await getDocs(
                    collection(getFirestoreDb(), "community", "implementation", "sectionAggregates")
                );

                return snapshot.docs.map(document => ({
                    sectionId: document.id,
                    ...document.data()
                }));
            }
            catch (error) {
                console.warn("Unable to load community section aggregates.", error);
                return [];
            }

        },

        async loadParticipantDirectory() {

            if (!isFirebaseReady()) {
                return {
                    status: "unavailable",
                    rows: [],
                    lastUpdated: null,
                    message: "Backend unavailable."
                };
            }

            try {
                const firestoreModule = await getFirestoreModule();
                const db = getFirestoreDb();
                const loadedAt = new Date().toISOString();
                const participantSnapshot = await firestoreModule.getDocs(
                    firestoreModule.collection(db, "participants")
                );
                const latestAssessmentsByParticipant = new Map();
                let cursor = null;

                while (true) {
                    const batch = await this.loadAssessmentScoreBatch({ cursor, limit: ASSESSMENT_PAGE_SIZE });

                    batch.rows.forEach(row => {
                        const participantId = row.participantId || row.uid;

                        if (participantId && !latestAssessmentsByParticipant.has(participantId)) {
                            latestAssessmentsByParticipant.set(participantId, {
                                overallLevel: row.overallLevel || null,
                                timestamp: row.timestamp || null
                            });
                        }
                    });

                    if (!batch.hasMore || !batch.nextCursor) {
                        break;
                    }

                    cursor = batch.nextCursor;
                }

                const rows = participantSnapshot.docs.map(document => {
                    const data = document.data() || {};

                    return mapParticipantDirectoryEntry(
                        {
                            id: document.id,
                            assessmentCount: data.assessmentCount,
                            lastAssessmentAt: data.lastAssessmentAt
                        },
                        latestAssessmentsByParticipant.get(document.id)
                    );
                }).sort((left, right) => {
                    const leftTime = left.lastAssessment ? new Date(left.lastAssessment).getTime() : 0;
                    const rightTime = right.lastAssessment ? new Date(right.lastAssessment).getTime() : 0;

                    return rightTime - leftTime;
                });

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

export const FirebaseStorageAdapter = {
    createFirebaseStorageAdapter
};
