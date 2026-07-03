/** @deprecated Import from src/backend/backend-service.js */
import {
    ensureParticipantIdentity as ensureParticipantAnonymousAuth,
    signInAdminWithGoogle,
    signOutAdminSession as signOutCurrentUser,
    watchAdminSession as watchAuthState,
    requireAdminSession as requireAdminAuthState,
    getParticipantIdentityId as getCurrentAuthUid,
    isAuthorizedAdminEmail as isAllowedAdminEmail
} from "../backend/backend-service.js";

import { getFirebaseAuth, isFirebaseReady } from "../backend/providers/firebase/firebase-client.js";

export {
    ensureParticipantAnonymousAuth,
    signInAdminWithGoogle,
    signOutCurrentUser,
    watchAuthState,
    requireAdminAuthState,
    getCurrentAuthUid,
    isAllowedAdminEmail
};

export function getCurrentAuthUser() {

    if (!isFirebaseReady()) {
        return null;
    }

    return getFirebaseAuth()?.currentUser || null;

}

export function isGoogleSignedInUser(user = getCurrentAuthUser()) {

    return Boolean(
        user?.providerData?.some(provider => provider.providerId === "google.com")
    );

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
