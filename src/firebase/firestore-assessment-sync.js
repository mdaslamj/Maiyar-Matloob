import { getCurrentAuthUid } from "./firebase-auth-service.js";
import { getFirestoreDb, isFirebaseReady } from "./firebase-service.js";
import { syncCommunityAnswerRecord } from "./firestore-community-sync.js";
import {
    FIRESTORE_PATHS,
    FIRESTORE_SCHEMA_VERSION,
    buildAssessmentFirestorePayload
} from "./firestore-schema.js";

async function getFirestoreModule() {

    return import(`https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js`);

}

function createAssessmentId() {

    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `assessment-${Date.now()}-${Math.random().toString(16).slice(2)}`;

}

export async function syncParticipantProfile(participant) {

    const uid = getCurrentAuthUid();

    if (!isFirebaseReady() || !uid || !participant) {
        return { success: false, reason: "participant-sync-skipped" };
    }

    try {
        const { doc, setDoc, serverTimestamp } = await getFirestoreModule();
        const db = getFirestoreDb();
        const participantRef = doc(db, FIRESTORE_PATHS.participants(uid));

        await setDoc(participantRef, {
            schemaVersion: FIRESTORE_SCHEMA_VERSION,
            profile: {
                name: participant.name,
                mobile: participant.mobile,
                localParticipantId: participant.participantId
            },
            createdAt: participant.createdAt || new Date().toISOString(),
            lastAssessmentAt: participant.lastAssessmentAt || null,
            assessmentCount: Number(participant.assessmentCount || 0),
            lastSyncedAt: serverTimestamp()
        }, { merge: true });

        return { success: true, reason: "participant-sync-complete", uid };
    }
    catch (error) {
        console.warn("Participant Firestore sync failed.", error);

        return {
            success: false,
            reason: "participant-sync-failed",
            error: error?.message || String(error)
        };
    }

}

export async function syncAssessmentSubmission({
    report,
    participant,
    questionnaire,
    appVersion,
    contentVersion,
    getQuestionSection
}) {

    const uid = getCurrentAuthUid();

    if (!isFirebaseReady() || !uid || !report) {
        return { success: false, reason: "assessment-sync-skipped" };
    }

    const assessmentId = createAssessmentId();

    try {
        const { doc, setDoc, serverTimestamp } = await getFirestoreModule();
        const db = getFirestoreDb();
        const payload = buildAssessmentFirestorePayload({
            uid,
            assessmentId,
            report,
            participant,
            appVersion,
            contentVersion
        });

        const assessmentRef = doc(db, FIRESTORE_PATHS.assessments(assessmentId));

        await setDoc(assessmentRef, {
            ...payload,
            timestamp: serverTimestamp()
        });

        if (participant) {
            const participantRef = doc(db, FIRESTORE_PATHS.participants(uid));

            await setDoc(participantRef, {
                schemaVersion: FIRESTORE_SCHEMA_VERSION,
                profile: {
                    name: participant.name,
                    mobile: participant.mobile,
                    localParticipantId: participant.participantId
                },
                lastAssessmentAt: payload.capturedAt,
                assessmentCount: Number(participant.assessmentCount || 0),
                lastSyncedAt: serverTimestamp()
            }, { merge: true });
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
            uid,
            communityResult
        };
    }
    catch (error) {
        console.warn("Assessment Firestore sync failed.", error);

        return {
            success: false,
            reason: "assessment-sync-failed",
            error: error?.message || String(error)
        };
    }

}

export async function recordSystemClientVersion(appVersion, contentVersion) {

    const uid = getCurrentAuthUid();

    if (!isFirebaseReady() || !uid) {
        return { success: false, reason: "system-version-skipped" };
    }

    try {
        const { doc, setDoc, serverTimestamp } = await getFirestoreModule();
        const db = getFirestoreDb();
        const versionRef = doc(db, FIRESTORE_PATHS.systemVersions);

        await setDoc(versionRef, {
            schemaVersion: FIRESTORE_SCHEMA_VERSION,
            lastClientAppVersion: appVersion || "unknown",
            lastClientContentVersion: contentVersion || "unknown",
            lastSeenAt: serverTimestamp(),
            lastSeenUid: uid
        }, { merge: true });

        return { success: true };
    }
    catch (error) {
        return { success: false, reason: "system-version-failed" };
    }

}

export const FirestoreAssessmentSync = {
    syncParticipantProfile,
    syncAssessmentSubmission,
    recordSystemClientVersion
};
