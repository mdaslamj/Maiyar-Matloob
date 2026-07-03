/** @deprecated Import from src/backend/backend-service.js */
import {
    initializeBackendInfrastructure,
    isBackendInfrastructureReady
} from "../backend/backend-service.js";
import {
    getFirebaseInitializationResult,
    getFirebaseApp,
    getFirestoreDb,
    getFirebaseAuth,
    getResolvedFirebaseConfig,
    getAdminAllowedEmails
} from "../backend/providers/firebase/firebase-client.js";
import {
    isFirebaseConfigComplete
} from "../backend/providers/firebase/firebase-config.js";

export {
    initializeBackendInfrastructure as initializeFirebaseInfrastructure,
    isBackendInfrastructureReady as isFirebaseReady
};

export {
    getFirebaseInitializationResult,
    getFirebaseApp,
    getFirestoreDb,
    getFirebaseAuth,
    getResolvedFirebaseConfig,
    getAdminAllowedEmails,
    isFirebaseConfigComplete
};

export {
    FIREBASE_CONFIG,
    FIREBASE_SDK_VERSION,
    FIRESTORE_COLLECTIONS,
    getFirebaseRuntimeStatus
} from "../backend/providers/firebase/firebase-config.js";

export const FirebaseService = {
    initializeFirebaseInfrastructure,
    getFirebaseInitializationResult,
    getFirebaseApp,
    getFirestoreDb,
    getFirebaseAuth,
    getResolvedFirebaseConfig,
    getAdminAllowedEmails,
    isFirebaseReady: isBackendInfrastructureReady,
    isFirebaseConfigComplete
};
