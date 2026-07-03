/** @deprecated Import from src/backend/backend-service.js */
import {
    saveParticipant as syncParticipantProfile,
    saveAssessment as syncAssessmentSubmission,
    recordClientVersion as recordSystemClientVersion
} from "../backend/backend-service.js";

export {
    syncParticipantProfile,
    syncAssessmentSubmission,
    recordSystemClientVersion
};

export const FirestoreAssessmentSync = {
    syncParticipantProfile,
    syncAssessmentSubmission,
    recordSystemClientVersion
};
