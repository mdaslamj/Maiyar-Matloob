/**
 * Supabase Identity Adapter — Phase B storage-only passthrough.
 * Authentication is explicitly out of scope for Phase B.
 */

import {
    initializeSupabaseClient,
    isSupabaseReady
} from "./supabase-client.js";

export function createSupabaseIdentityAdapter() {

    return {
        getProviderName() {
            return "supabase";
        },

        async initialize() {
            return initializeSupabaseClient();
        },

        isReady() {
            return isSupabaseReady();
        },

        async ensureParticipantIdentity() {

            if (!isSupabaseReady()) {
                return {
                    success: false,
                    reason: "supabase-not-ready"
                };
            }

            return {
                success: true,
                reason: "storage-only-participant-context"
            };

        },

        getParticipantIdentityId() {
            return null;
        },

        async signInAdminWithGoogle() {
            return {
                success: false,
                reason: "supabase-auth-not-implemented"
            };
        },

        async signOut() {
            return {
                success: false,
                reason: "supabase-auth-not-implemented"
            };
        },

        async requireAdminSession() {
            return {
                authorized: false,
                user: null
            };
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
