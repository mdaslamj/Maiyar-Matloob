export const FEATURE_FLAGS = {
    USE_FIREBASE: false,
    USE_FIRESTORE: false
};

export function isFirebaseEnabled() {

    return FEATURE_FLAGS.USE_FIREBASE === true;

}

export function isFirestoreEnabled() {

    return FEATURE_FLAGS.USE_FIRESTORE === true;

}
