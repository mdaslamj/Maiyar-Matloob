export const PARTICIPANT_SCHEMA_VERSION = 1;

export const MOBILE_LENGTH = 10;

const INVALID_MOBILES = new Set([
    "0000000000",
    "1111111111",
    "1234567890"
]);

export function normalizeParticipantName(value) {

    return String(value ?? "").trim().replace(/\s+/g, " ");

}

export function normalizeParticipantMobile(value) {

    return String(value ?? "").replace(/\D/g, "").trim();

}

export function buildParticipantId(mobile) {

    return normalizeParticipantMobile(mobile);

}

export function validateParticipantName(name) {

    const normalized = normalizeParticipantName(name);

    if (!normalized) {
        return {
            valid: false,
            message: "براہِ کرم اپنا پورا نام درج کریں۔"
        };
    }

    if (normalized.length < 2) {
        return {
            valid: false,
            message: "نام کم از کم 2 حروف کا ہونا چاہیے۔"
        };
    }

    if (normalized.length > 100) {
        return {
            valid: false,
            message: "نام 100 حروف سے زیادہ نہیں ہو سکتا۔"
        };
    }

    return {
        valid: true,
        value: normalized
    };

}

export function validateParticipantMobile(mobile) {

    const normalized = normalizeParticipantMobile(mobile);

    if (!normalized) {
        return {
            valid: false,
            message: "براہِ کرم اپنا موبائل نمبر درج کریں۔"
        };
    }

    if (!/^\d+$/.test(normalized)) {
        return {
            valid: false,
            message: "موبائل نمبر صرف ہندسوں پر مشتمل ہونا چاہیے۔"
        };
    }

    if (normalized.length !== MOBILE_LENGTH) {
        return {
            valid: false,
            message: `موبائل نمبر ${MOBILE_LENGTH} ہندسوں کا ہونا چاہیے۔`
        };
    }

    if (INVALID_MOBILES.has(normalized)) {
        return {
            valid: false,
            message: "براہِ کرم درست موبائل نمبر درج کریں۔"
        };
    }

    return {
        valid: true,
        value: normalized
    };

}

export function validateParticipantIdentity(name, mobile) {

    const nameResult = validateParticipantName(name);
    const mobileResult = validateParticipantMobile(mobile);
    const errors = {};

    if (!nameResult.valid) {
        errors.name = nameResult.message;
    }

    if (!mobileResult.valid) {
        errors.mobile = mobileResult.message;
    }

    if (Object.keys(errors).length) {
        return {
            valid: false,
            errors
        };
    }

    return {
        valid: true,
        participant: createParticipantRecord(nameResult.value, mobileResult.value)
    };

}

export function createParticipantRecord(name, mobile) {

    const normalizedMobile = normalizeParticipantMobile(mobile);
    const now = new Date().toISOString();

    return {
        participantId: buildParticipantId(normalizedMobile),
        name: normalizeParticipantName(name),
        mobile: normalizedMobile,
        createdAt: now,
        lastAssessmentAt: null,
        assessmentCount: 0
    };

}

export function toReportParticipant(participant) {

    if (!participant) {
        return null;
    }

    return {
        participantId: participant.participantId,
        name: participant.name,
        mobile: participant.mobile
    };

}

export const ParticipantIdentity = {
    PARTICIPANT_SCHEMA_VERSION,
    MOBILE_LENGTH,
    normalizeParticipantName,
    normalizeParticipantMobile,
    buildParticipantId,
    validateParticipantName,
    validateParticipantMobile,
    validateParticipantIdentity,
    createParticipantRecord,
    toReportParticipant
};
