/**
 * Copy to `backend-config.local.js` in this folder and replace placeholders.
 * Legacy `src/firebase/firebase-config.local.js` is also supported.
 * Do not commit backend-config.local.js — it is gitignored.
 */
export const BACKEND_PROVIDER_CONFIG = {
    supabase: {
        url: "REPLACE_WITH_SUPABASE_URL",
        anonKey: "REPLACE_WITH_SUPABASE_ANON_KEY"
    },
    firebase: {
        apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
        authDomain: "REPLACE_WITH_FIREBASE_AUTH_DOMAIN",
        projectId: "REPLACE_WITH_FIREBASE_PROJECT_ID",
        storageBucket: "REPLACE_WITH_FIREBASE_STORAGE_BUCKET",
        messagingSenderId: "REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID",
        appId: "REPLACE_WITH_FIREBASE_APP_ID"
    }
};

export const ADMIN_ALLOWED_EMAILS = [
    "admin@example.com"
];

/** Alternative alias read by supabase-client.js */
export const SUPABASE_CONFIG = BACKEND_PROVIDER_CONFIG.supabase;
