/** @deprecated Import from src/backend/providers/firebase/firebase-config.js or src/backend/backend-config.js */
export {
    FIREBASE_CONFIG,
    FIREBASE_SDK_VERSION,
    FIRESTORE_COLLECTIONS,
    isFirebaseConfigComplete,
    getFirebaseRuntimeStatus
} from "../backend/providers/firebase/firebase-config.js";

export {
    isFirebaseEnabled,
    isFirestoreEnabled
} from "../shared/feature-flags.js";
