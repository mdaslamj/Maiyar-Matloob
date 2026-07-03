import {
    getFirestoreDb,
    getFirestoreModule,
    isFirebaseReady
} from "./firebase-client.js";
import { getParticipantIdentityId } from "./firebase-identity.js";
import { syncCommunityAnswerRecord } from "./firestore-community-sync.js";
import {
    BACKEND_PATHS,
    CANONICAL_SCHEMA_VERSION,
    buildAssessmentFirestorePayload
} from "../../backend-schema.js";

function createAssessmentId() {

    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `assessment-${Date.now()}-${Math.random().toString(16).slice(2)}`;

}

export async function saveParticipantProfile(participant) {

    const participantId = getParticipantIdentityId();

    if (!isFirebaseReady() || !participantId || !participant) {
        return { success: false, reason: "participant-sync-skipped" };
    }

    try {
        const { doc, setDoc, serverTimestamp } = await getFirestoreModule();
        const db = getFirestoreDb();
        const participantRef = doc(db, BACKEND_PATHS.participants(participantId));

        await setDoc(participantRef, {
            schemaVersion: CANONICAL_SCHEMA_VERSION,
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

        return { success: true, reason: "participant-sync-complete", uid: participantId };
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

export async function saveAssessmentSubmission({
    report,
    participant,
    questionnaire,
    appVersion,
    contentVersion,
    getQuestionSection
}) {

    const participantId = getParticipantIdentityId();

    if (!isFirebaseReady() || !participantId || !report) {
        return { success: false, reason: "assessment-sync-skipped" };
    }

    const assessmentId = createAssessmentId();

    try {
        const { doc, setDoc, serverTimestamp } = await getFirestoreModule();
        const db = getFirestoreDb();
        const payload = buildAssessmentFirestorePayload({
            uid: participantId,
            assessmentId,
            report,
            participant,
            appVersion,
            contentVersion
        });

        const assessmentRef = doc(db, BACKEND_PATHS.assessments(assessmentId));

        await setDoc(assessmentRef, {
            ...payload,
            timestamp: serverTimestamp()
        });

        if (participant) {
            const participantRef = doc(db, BACKEND_PATHS.participants(participantId));

            await setDoc(participantRef, {
                schemaVersion: CANONICAL_SCHEMA_VERSION,
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
            uid: participantId,
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

    const participantId = getParticipantIdentityId();

    if (!isFirebaseReady() || !participantId) {
        return { success: false, reason: "system-version-skipped" };
    }

    try {
        const { doc, setDoc, serverTimestamp } = await getFirestoreModule();
        const db = getFirestoreDb();
        const versionRef = doc(db, BACKEND_PATHS.systemVersions);

        await setDoc(versionRef, {
            schemaVersion: CANONICAL_SCHEMA_VERSION,
            lastClientAppVersion: appVersion || "unknown",
            lastClientContentVersion: contentVersion || "unknown",
            lastSeenAt: serverTimestamp(),
            lastSeenUid: participantId
        }, { merge: true });

        return { success: true };
    }
    catch (error) {
        return { success: false, reason: "system-version-failed" };
    }

}

export const FirestoreAssessmentSync = {
    saveParticipantProfile,
    saveAssessmentSubmission,
    recordSystemClientVersion
};
