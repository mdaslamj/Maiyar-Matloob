import {
    getAdminAllowedEmails,
    getFirebaseAuth,
    initializeFirebaseClient,
    isFirebaseReady
} from "./firebase-client.js";

const GOOGLE_PROVIDER_ID = "google.com";
const AUTH_URL = "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

function normalizeEmail(email) {

    return String(email || "").trim().toLowerCase();

}

function getCurrentAuthUser() {

    if (!isFirebaseReady()) {
        return null;
    }

    return getFirebaseAuth()?.currentUser || null;

}

export function getParticipantIdentityId() {

    return getCurrentAuthUser()?.uid || null;

}

function isGoogleSignedInUser(user = getCurrentAuthUser()) {

    return Boolean(
        user?.providerData?.some(provider => provider.providerId === GOOGLE_PROVIDER_ID)
    );

}

export function createFirebaseIdentityAdapter() {

    return {
        getProviderName() {
            return "firebase";
        },

        async initialize() {
            return initializeFirebaseClient();
        },

        isReady() {
            return isFirebaseReady();
        },

        async ensureParticipantIdentity() {

            if (!isFirebaseReady()) {
                return {
                    success: false,
                    reason: "firebase-not-ready"
                };
            }

            const auth = getFirebaseAuth();
            const existingUser = auth.currentUser;

            if (existingUser) {
                return {
                    success: true,
                    uid: existingUser.uid,
                    reason: isGoogleSignedInUser(existingUser)
                        ? "existing-google-session"
                        : "existing-anonymous-session"
                };
            }

            try {
                const [{ signInAnonymously }] = await import(AUTH_URL);
                const credential = await signInAnonymously(auth);

                return {
                    success: true,
                    uid: credential.user.uid,
                    reason: "anonymous-sign-in"
                };
            }
            catch (error) {
                console.warn("Anonymous Firebase sign-in failed. Local-only mode continues.", error);

                return {
                    success: false,
                    reason: "anonymous-sign-in-failed",
                    error: error?.message || String(error)
                };
            }

        },

        getParticipantIdentityId() {
            return getParticipantIdentityId();
        },

        async signInAdminWithGoogle() {

            if (!isFirebaseReady()) {
                return {
                    success: false,
                    reason: "firebase-not-ready"
                };
            }

            try {
                const [{ GoogleAuthProvider, signInWithPopup }] = await import(AUTH_URL);
                const auth = getFirebaseAuth();
                const provider = new GoogleAuthProvider();
                const credential = await signInWithPopup(auth, provider);
                const email = credential.user?.email;

                if (!this.isAuthorizedAdmin(email)) {
                    await this.signOut();

                    return {
                        success: false,
                        reason: "admin-not-authorized",
                        email
                    };
                }

                return {
                    success: true,
                    uid: credential.user.uid,
                    email,
                    reason: "google-sign-in"
                };
            }
            catch (error) {
                console.warn("Admin Google sign-in failed.", error);

                return {
                    success: false,
                    reason: "google-sign-in-failed",
                    error: error?.message || String(error)
                };
            }

        },

        async signOut() {

            if (!isFirebaseReady()) {
                return { success: false, reason: "firebase-not-ready" };
            }

            try {
                const [{ signOut }] = await import(AUTH_URL);
                await signOut(getFirebaseAuth());

                return { success: true };
            }
            catch (error) {
                return {
                    success: false,
                    reason: "sign-out-failed",
                    error: error?.message || String(error)
                };
            }

        },

        async requireAdminSession() {

            const user = getCurrentAuthUser();

            if (!user || !isGoogleSignedInUser(user) || !this.isAuthorizedAdmin(user.email)) {
                return {
                    authorized: false,
                    user: null
                };
            }

            return {
                authorized: true,
                user: {
                    uid: user.uid,
                    email: user.email
                }
            };

        },

        watchSession(callback) {

            if (!isFirebaseReady()) {
                callback(null);
                return () => {};
            }

            let unsubscribe = () => {};

            import(AUTH_URL)
                .then(({ onAuthStateChanged }) => {
                    unsubscribe = onAuthStateChanged(getFirebaseAuth(), callback);
                })
                .catch(error => {
                    console.warn("Unable to watch Firebase auth state.", error);
                    callback(null);
                });

            return () => unsubscribe();

        },

        isAuthorizedAdmin(email) {

            const normalized = normalizeEmail(email);
            const allowed = getAdminAllowedEmails().map(normalizeEmail);

            return allowed.includes(normalized);

        },

        getAdminAllowedEmails() {
            return getAdminAllowedEmails();
        }
    };

}

export const FirebaseIdentityAdapter = {
    createFirebaseIdentityAdapter,
    getParticipantIdentityId
};
