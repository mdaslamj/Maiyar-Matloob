import {
    FIREBASE_CONFIG,
    FIREBASE_SDK_VERSION,
    getFirebaseRuntimeStatus,
    isFirebaseConfigComplete
} from "./firebase-config.js";
import { getAdminAllowedEmails as loadAdminAllowedEmails } from "../../backend-config.js";

const FIREBASE_APP_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`;
const FIRESTORE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`;
const AUTH_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`;

let resolvedConfig = { ...FIREBASE_CONFIG };
let adminAllowedEmails = [];
let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let initializationPromise = null;
let initializationResult = {
    initialized: false,
    reason: "disabled"
};

export function getResolvedFirebaseConfig() {

    return { ...resolvedConfig };

}

export function getAdminAllowedEmails() {

    return [...adminAllowedEmails];

}

export function getFirebaseInitializationResult() {

    return { ...initializationResult };

}

export function getFirebaseApp() {

    return firebaseApp;

}

export function getFirestoreDb() {

    return firestoreDb;

}

export function getFirebaseAuth() {

    return firebaseAuth;

}

export function isFirebaseReady() {

    return Boolean(initializationResult.initialized && firebaseApp && firestoreDb && firebaseAuth);

}

async function loadLocalFirebaseConfig() {

    for (const path of ["../../../firebase/firebase-config.local.js", "./firebase-config.local.js"]) {
        try {
            const localModule = await import(path);

            if (localModule.FIREBASE_CONFIG) {
                resolvedConfig = {
                    ...FIREBASE_CONFIG,
                    ...localModule.FIREBASE_CONFIG
                };
            }
            else if (localModule.BACKEND_PROVIDER_CONFIG?.firebase) {
                resolvedConfig = {
                    ...FIREBASE_CONFIG,
                    ...localModule.BACKEND_PROVIDER_CONFIG.firebase
                };
            }

            if (Array.isArray(localModule.ADMIN_ALLOWED_EMAILS)) {
                adminAllowedEmails = localModule.ADMIN_ALLOWED_EMAILS.filter(Boolean);
            }

            return true;
        }
        catch (error) {
            // Try next path.
        }
    }

    const configEmails = await loadAdminAllowedEmails();

    if (configEmails.length) {
        adminAllowedEmails = configEmails;
    }

    resolvedConfig = { ...FIREBASE_CONFIG };

    return false;

}

export async function initializeFirebaseClient() {

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = initializeFirebaseClientInternal();

    return initializationPromise;

}

async function initializeFirebaseClientInternal() {

    await loadLocalFirebaseConfig();

    const runtimeStatus = getFirebaseRuntimeStatus(resolvedConfig);

    if (!runtimeStatus.firebaseEnabled) {
        initializationResult = {
            initialized: false,
            reason: "firebase-disabled"
        };

        return initializationResult;
    }

    if (!isFirebaseConfigComplete(resolvedConfig)) {
        initializationResult = {
            initialized: false,
            reason: "config-incomplete"
        };

        console.warn("Firebase is enabled but configuration is incomplete. Local-only mode continues.");

        return initializationResult;
    }

    try {
        const [{ initializeApp }, { getFirestore }, { getAuth }] = await Promise.all([
            import(FIREBASE_APP_URL),
            import(FIRESTORE_URL),
            import(AUTH_URL)
        ]);

        firebaseApp = initializeApp(resolvedConfig);
        firestoreDb = getFirestore(firebaseApp);
        firebaseAuth = getAuth(firebaseApp);

        initializationResult = {
            initialized: true,
            reason: "ready",
            firestoreAttached: Boolean(firestoreDb),
            authAttached: Boolean(firebaseAuth)
        };

        return initializationResult;
    }
    catch (error) {
        firebaseApp = null;
        firestoreDb = null;
        firebaseAuth = null;

        initializationResult = {
            initialized: false,
            reason: "initialization-failed",
            error: error?.message || String(error)
        };

        console.error("Firebase initialization failed. Local-only mode continues.", error);

        return initializationResult;
    }

}

export async function getFirestoreModule() {

    return import(FIRESTORE_URL);

}

export {
    isFirebaseConfigComplete
} from "./firebase-config.js";

export const FirebaseClient = {
    initializeFirebaseClient,
    getFirebaseInitializationResult,
    getFirebaseApp,
    getFirestoreDb,
    getFirebaseAuth,
    getResolvedFirebaseConfig,
    getAdminAllowedEmails,
    isFirebaseReady,
    getFirestoreModule,
    isFirebaseConfigComplete: () => isFirebaseConfigComplete(resolvedConfig)
};
