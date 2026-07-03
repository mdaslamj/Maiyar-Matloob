import { getFirestoreDb, isFirebaseReady } from "./firebase-service.js";
import {
    FIRESTORE_PATHS,
    FIRESTORE_SCHEMA_VERSION,
    createEmptyAnswerCounts
} from "./firestore-schema.js";
import { bucketKeyForValue } from "./firestore-community-utils.js";

async function getFirestoreModule() {

    return import(`https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js`);

}

function getDb() {

    return getFirestoreDb();

}

export async function syncCommunityAnswerRecord(communityAnswerRecord, questionnaire = [], getQuestionSection) {

    if (!isFirebaseReady() || !communityAnswerRecord?.questionAnswers) {
        return { success: false, reason: "community-sync-skipped" };
    }

    try {
        const {
            doc,
            writeBatch,
            increment,
            serverTimestamp
        } = await getFirestoreModule();

        const db = getDb();
        const batch = writeBatch(db);
        const questionAnswers = communityAnswerRecord.questionAnswers;
        const sectionCounts = {};

        Object.entries(questionAnswers).forEach(([questionId, answerValue]) => {
            const bucket = bucketKeyForValue(Number(answerValue));

            if (!bucket) {
                return;
            }

            const questionRef = doc(db, FIRESTORE_PATHS.communityQuestionAnswers(questionId));

            batch.set(questionRef, {
                schemaVersion: FIRESTORE_SCHEMA_VERSION,
                questionId,
                counts: {
                    [bucket]: increment(1),
                    total: increment(1)
                },
                updatedAt: serverTimestamp()
            }, { merge: true });

            const question = questionnaire.find(item => {
                const id = item.id || item.standardId;
                return id === questionId;
            });
            const sectionName = question
                ? getQuestionSection(question)
                : "General";
            const sectionId = sectionName;

            if (!sectionCounts[sectionId]) {
                sectionCounts[sectionId] = createEmptyAnswerCounts();
            }

            sectionCounts[sectionId][bucket] += 1;
            sectionCounts[sectionId].total += 1;
        });

        Object.entries(sectionCounts).forEach(([sectionId, counts]) => {
            const sectionRef = doc(db, FIRESTORE_PATHS.communitySectionAggregates(sectionId));
            const sectionPayload = {
                schemaVersion: FIRESTORE_SCHEMA_VERSION,
                sectionId,
                title: sectionId,
                updatedAt: serverTimestamp()
            };

            Object.entries(counts).forEach(([key, value]) => {
                if (value > 0) {
                    sectionPayload[`counts.${key}`] = increment(value);
                }
            });

            batch.set(sectionRef, sectionPayload, { merge: true });
        });

        const metaRef = doc(db, FIRESTORE_PATHS.communityMeta);

        batch.set(metaRef, {
            schemaVersion: FIRESTORE_SCHEMA_VERSION,
            totalSubmissions: increment(1),
            lastUpdatedAt: serverTimestamp()
        }, { merge: true });

        await batch.commit();

        return {
            success: true,
            reason: "community-sync-complete",
            questionCount: Object.keys(questionAnswers).length
        };
    }
    catch (error) {
        console.warn("Community Firestore sync failed.", error);

        return {
            success: false,
            reason: "community-sync-failed",
            error: error?.message || String(error)
        };
    }

}

export const FirestoreCommunitySync = {
    syncCommunityAnswerRecord
};
