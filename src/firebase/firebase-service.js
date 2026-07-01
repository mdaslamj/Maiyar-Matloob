import {
    FIREBASE_CONFIG,
    FIREBASE_SDK_VERSION,
    getFirebaseRuntimeStatus,
    isFirebaseConfigComplete,
    isFirebaseEnabled
} from "./firebase-config.js";

const FIREBASE_APP_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`;
const FIRESTORE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`;

let firebaseApp = null;
let firestoreDb = null;
let initializationPromise = null;
let initializationResult = {
    initialized: false,
    reason: "disabled"
};

export function getFirebaseInitializationResult() {

    return { ...initializationResult };

}

export function getFirebaseApp() {

    return firebaseApp;

}

export function getFirestoreDb() {

    return firestoreDb;

}

export async function initializeFirebaseInfrastructure() {

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = initializeFirebaseInfrastructureInternal();

    return initializationPromise;

}

async function initializeFirebaseInfrastructureInternal() {

    const runtimeStatus = getFirebaseRuntimeStatus();

    if (!runtimeStatus.firebaseEnabled) {
        initializationResult = {
            initialized: false,
            reason: "firebase-disabled"
        };

        return initializationResult;
    }

    if (!runtimeStatus.configComplete) {
        initializationResult = {
            initialized: false,
            reason: "config-incomplete"
        };

        console.warn("Firebase is enabled but configuration is incomplete. Local-only mode continues.");

        return initializationResult;
    }

    try {
        const [{ initializeApp }, { getFirestore }] = await Promise.all([
            import(FIREBASE_APP_URL),
            import(FIRESTORE_URL)
        ]);

        firebaseApp = initializeApp(FIREBASE_CONFIG);
        firestoreDb = getFirestore(firebaseApp);

        initializationResult = {
            initialized: true,
            reason: "ready",
            firestoreAttached: Boolean(firestoreDb)
        };

        return initializationResult;
    }

    catch (error) {
        firebaseApp = null;
        firestoreDb = null;

        initializationResult = {
            initialized: false,
            reason: "initialization-failed",
            error: error?.message || String(error)
        };

        console.error("Firebase initialization failed. Local-only mode continues.", error);

        return initializationResult;
    }

}

export const FirebaseService = {
    initializeFirebaseInfrastructure,
    getFirebaseInitializationResult,
    getFirebaseApp,
    getFirestoreDb,
    isFirebaseEnabled,
    isFirebaseConfigComplete
};
