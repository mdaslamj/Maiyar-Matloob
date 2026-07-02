import {
    loadParticipantsStore,
    saveParticipantsStore
} from "../storage/storage.js";
import {
    buildParticipantId,
    createParticipantRecord,
    normalizeParticipantName,
    normalizeParticipantMobile,
    validateParticipantIdentity
} from "./participant-identity.js";

function getParticipantFromStore(store, participantId) {

    if (!participantId || !store?.participants) {
        return null;
    }

    return store.participants[participantId] || null;

}

export function loadCurrentParticipant() {

    const store = loadParticipantsStore();
    return getParticipantFromStore(store, store.currentParticipantId);

}

export function findParticipantByMobile(mobile) {

    const participantId = buildParticipantId(mobile);
    const store = loadParticipantsStore();

    return getParticipantFromStore(store, participantId);

}

export function resolveParticipantIdentity(name, mobile) {

    const validation = validateParticipantIdentity(name, mobile);

    if (!validation.valid) {
        return validation;
    }

    const store = loadParticipantsStore();
    const participantId = validation.participant.participantId;
    const existing = getParticipantFromStore(store, participantId);
    const now = new Date().toISOString();
    let participant;

    if (existing) {
        participant = {
            ...existing,
            name: validation.participant.name,
            mobile: validation.participant.mobile,
            lastSeenAt: now
        };
    }
    else {
        participant = createParticipantRecord(
            validation.participant.name,
            validation.participant.mobile
        );
    }

    store.participants[participantId] = participant;
    store.currentParticipantId = participantId;
    saveParticipantsStore(store);

    return {
        valid: true,
        participant,
        isReturning: Boolean(existing)
    };

}

export function setCurrentParticipant(participantId) {

    const store = loadParticipantsStore();
    const participant = getParticipantFromStore(store, participantId);

    if (!participant) {
        return null;
    }

    store.currentParticipantId = participantId;
    saveParticipantsStore(store);

    return participant;

}

export function clearCurrentParticipant() {

    const store = loadParticipantsStore();
    store.currentParticipantId = null;
    saveParticipantsStore(store);

}

export function recordParticipantAssessment(participantId) {

    if (!participantId) {
        return;
    }

    const store = loadParticipantsStore();
    const participant = getParticipantFromStore(store, participantId);

    if (!participant) {
        return;
    }

    participant.assessmentCount = Number(participant.assessmentCount || 0) + 1;
    participant.lastAssessmentAt = new Date().toISOString();
    store.participants[participantId] = participant;
    saveParticipantsStore(store);

}

export function listSnapshotsForParticipant(participantId, snapshots, getReportForSnapshot) {

    if (!participantId) {
        return snapshots;
    }

    return snapshots.filter(snapshot => {
        const report = getReportForSnapshot(snapshot.snapshotId);

        if (!report?.participant?.participantId) {
            return false;
        }

        return report.participant.participantId === participantId;
    });

}

export const ParticipantStorage = {
    loadCurrentParticipant,
    findParticipantByMobile,
    resolveParticipantIdentity,
    setCurrentParticipant,
    clearCurrentParticipant,
    recordParticipantAssessment,
    listSnapshotsForParticipant,
    normalizeParticipantName,
    normalizeParticipantMobile
};
