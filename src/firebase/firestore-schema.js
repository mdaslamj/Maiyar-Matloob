/** @deprecated Import from src/backend/backend-schema.js */
export {
    CANONICAL_SCHEMA_VERSION as FIRESTORE_SCHEMA_VERSION,
    BACKEND_PATHS as FIRESTORE_PATHS,
    createEmptyAnswerCounts,
    buildSectionScoresFromReport,
    buildAssessmentFirestorePayload
} from "../backend/backend-schema.js";

export const FirestoreSchema = {
    FIRESTORE_SCHEMA_VERSION: 1,
    FIRESTORE_PATHS: null,
    createEmptyAnswerCounts: (...args) => import("../backend/backend-schema.js").then(m => m.createEmptyAnswerCounts(...args)),
    buildSectionScoresFromReport: (...args) => import("../backend/backend-schema.js").then(m => m.buildSectionScoresFromReport(...args)),
    buildAssessmentFirestorePayload: (...args) => import("../backend/backend-schema.js").then(m => m.buildAssessmentFirestorePayload(...args))
};
