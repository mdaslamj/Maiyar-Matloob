import { isFirebaseEnabled, isFirestoreEnabled } from "../shared/feature-flags.js";

export const FIREBASE_CONFIG = {
    apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
    authDomain: "REPLACE_WITH_FIREBASE_AUTH_DOMAIN",
    projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
    storageBucket: "REPLACE_WITH_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",
    appId: "REPLACE_WITH_FIREBASE_APP_ID"
};

export const FIREBASE_SDK_VERSION = "10.14.1";

/**
 * Legacy Sprint 2 names retained for reference.
 * Version 2.0 uses FIRESTORE_PATHS in firestore-schema.js.
 */
export const FIRESTORE_COLLECTIONS = {
    PARTICIPANTS: "participants",
    ASSESSMENTS: "assessments",
    COMMUNITY: "community",
    ADMIN: "admin",
    SYSTEM: "system"
};

export function isFirebaseConfigComplete(config = FIREBASE_CONFIG) {

    const requiredKeys = [
        "apiKey",
        "authDomain",
        "projectId",
        "appId"
    ];

    return requiredKeys.every(key => {
        const value = config?.[key];

        return typeof value === "string"
            && value.trim().length > 0
            && !value.startsWith("REPLACE_WITH_");
    });

}

export function getFirebaseRuntimeStatus() {

    return {
        firebaseEnabled: isFirebaseEnabled(),
        firestoreEnabled: isFirestoreEnabled(),
        configComplete: isFirebaseConfigComplete()
    };

}

export {
    isFirebaseEnabled,
    isFirestoreEnabled
};
