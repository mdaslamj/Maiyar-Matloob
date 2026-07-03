export const FEATURE_FLAGS = {
    /**
     * Enable Firebase initialization, anonymous participant auth, and Firestore sync.
     * Requires src/firebase/firebase-config.local.js with real project values.
     */
    USE_FIREBASE: false,

    /**
     * Reserved for a future localStorage replacement adapter.
     * Phase 1 keeps local storage active and uses Firestore as an additive sync layer.
     */
    USE_FIRESTORE: false
};

export function isFirebaseEnabled() {

    return FEATURE_FLAGS.USE_FIREBASE === true;

}

export function isFirestoreEnabled() {

    return FEATURE_FLAGS.USE_FIRESTORE === true;

}
