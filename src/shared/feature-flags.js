export const FEATURE_FLAGS = {
    /**
     * Legacy flag — maps to BACKEND_PROVIDER "firebase" when true.
     * Prefer USE_BACKEND_SYNC + BACKEND_PROVIDER for new configuration.
     */
    USE_FIREBASE: false,

    /**
     * Reserved for a future client cache replacement adapter.
     * Not part of the v2.2 backend architecture contract.
     */
    USE_FIRESTORE: false,

    /**
     * Enable backend sync and admin live data.
     */
    USE_BACKEND_SYNC: false,

    /**
     * Active backend provider when USE_BACKEND_SYNC is true.
     * Values: "none" | "supabase" | "firebase" | "rest" | "self-hosted"
     */
    BACKEND_PROVIDER: "none",

    /**
     * Deployment environment label.
     */
    ENVIRONMENT: "development"
};

export function getBackendProviderFromFlags() {

    if (FEATURE_FLAGS.USE_BACKEND_SYNC === true) {
        return FEATURE_FLAGS.BACKEND_PROVIDER || "none";
    }

    if (FEATURE_FLAGS.USE_FIREBASE === true) {
        return "firebase";
    }

    return "none";

}

export function isBackendSyncEnabled() {

    return getBackendProviderFromFlags() !== "none";

}

export function isFirebaseEnabled() {

    return getBackendProviderFromFlags() === "firebase";

}

export function isFirestoreEnabled() {

    return FEATURE_FLAGS.USE_FIRESTORE === true;

}

/** @deprecated Use isBackendSyncEnabled */
export function isFirestoreSyncEnabled() {

    return isBackendSyncEnabled();

}

export function isAdminLiveDataEnabledFromFlags() {

    return isBackendSyncEnabled();

}
