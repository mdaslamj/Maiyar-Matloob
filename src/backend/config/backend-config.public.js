/**
 * Tracked frontend-safe backend configuration for static hosting (e.g. GitHub Pages).
 * Publishable keys only — never put service role or other secrets here.
 *
 * Override locally via backend-config.local.js (gitignored).
 */
export const BACKEND_PROVIDER_CONFIG = {
    supabase: {
        url: "https://cfbdzxmobbnihdqtetdu.supabase.co",
        anonKey: "sb_publishable_tbnEqeuxEWQ53NMLoRyyGQ_d4o3uAV8"
    }
};

export const SUPABASE_CONFIG = BACKEND_PROVIDER_CONFIG.supabase;

export const ADMIN_ALLOWED_EMAILS = [];
