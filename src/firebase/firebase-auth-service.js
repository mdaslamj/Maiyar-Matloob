import {
    getAdminAllowedEmails,
    getFirebaseAuth,
    isFirebaseReady
} from "./firebase-service.js";

const GOOGLE_PROVIDER_ID = "google.com";

function normalizeEmail(email) {

    return String(email || "").trim().toLowerCase();

}

export function getCurrentAuthUser() {

    if (!isFirebaseReady()) {
        return null;
    }

    return getFirebaseAuth()?.currentUser || null;

}

export function getCurrentAuthUid() {

    return getCurrentAuthUser()?.uid || null;

}

export async function ensureParticipantAnonymousAuth() {

    if (!isFirebaseReady()) {
        return {
            success: false,
            reason: "firebase-not-ready"
        };
    }

    const auth = getFirebaseAuth();
    const existingUser = auth.currentUser;

    if (existingUser && !isGoogleSignedInUser(existingUser)) {
        return {
            success: true,
            uid: existingUser.uid,
            reason: "existing-anonymous-session"
        };
    }

    if (existingUser && isGoogleSignedInUser(existingUser)) {
        return {
            success: true,
            uid: existingUser.uid,
            reason: "existing-google-session"
        };
    }

    try {
        const [{ signInAnonymously }] = await import(
            `https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js`
        );

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

}

export function isGoogleSignedInUser(user = getCurrentAuthUser()) {

    return Boolean(
        user?.providerData?.some(provider => provider.providerId === GOOGLE_PROVIDER_ID)
    );

}

export function isAllowedAdminEmail(email) {

    const normalized = normalizeEmail(email);
    const allowed = getAdminAllowedEmails().map(normalizeEmail);

    return allowed.includes(normalized);

}

export async function signInAdminWithGoogle() {

    if (!isFirebaseReady()) {
        return {
            success: false,
            reason: "firebase-not-ready"
        };
    }

    try {
        const [{ GoogleAuthProvider, signInWithPopup }] = await import(
            `https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js`
        );

        const auth = getFirebaseAuth();
        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(auth, provider);
        const email = credential.user?.email;

        if (!isAllowedAdminEmail(email)) {
            await signOutCurrentUser();

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

}

export async function signOutCurrentUser() {

    if (!isFirebaseReady()) {
        return { success: false, reason: "firebase-not-ready" };
    }

    try {
        const [{ signOut }] = await import(
            `https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js`
        );

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

}

export function watchAuthState(callback) {

    if (!isFirebaseReady()) {
        callback(null);
        return () => {};

    }

    let unsubscribe = () => {};

    import(`https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js`)
        .then(({ onAuthStateChanged }) => {
            unsubscribe = onAuthStateChanged(getFirebaseAuth(), callback);
        })
        .catch(error => {
            console.warn("Unable to watch Firebase auth state.", error);
            callback(null);
        });

    return () => unsubscribe();

}

export async function requireAdminAuthState() {

    const user = getCurrentAuthUser();

    if (!user || !isGoogleSignedInUser(user) || !isAllowedAdminEmail(user.email)) {
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

}

export const FirebaseAuthService = {
    ensureParticipantAnonymousAuth,
    signInAdminWithGoogle,
    signOutCurrentUser,
    watchAuthState,
    requireAdminAuthState,
    getCurrentAuthUid,
    getCurrentAuthUser,
    isAllowedAdminEmail,
    isGoogleSignedInUser
};
