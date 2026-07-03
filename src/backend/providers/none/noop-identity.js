/**
 * No-op Identity Adapter — active when backend sync is disabled.
 */

export function createNoOpIdentityAdapter() {

    return {
        getProviderName() {
            return "none";
        },

        async initialize() {
            return { ready: false, reason: "backend-disabled", initialized: false };
        },

        isReady() {
            return false;
        },

        async ensureParticipantIdentity() {
            return { success: false, reason: "backend-disabled" };
        },

        getParticipantIdentityId() {
            return null;
        },

        async signInAdminWithGoogle() {
            return { success: false, reason: "backend-disabled" };
        },

        async signOut() {
            return { success: false, reason: "backend-disabled" };
        },

        async requireAdminSession() {
            return { authorized: false, user: null };
        },

        watchSession(callback) {
            callback(null);
            return () => {};
        },

        isAuthorizedAdmin() {
            return false;
        },

        getAdminAllowedEmails() {
            return [];
        }
    };

}
