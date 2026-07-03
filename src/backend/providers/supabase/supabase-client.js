import { getBackendProvider } from "../../backend-config.js";

const SUPABASE_ESM_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm";

const DEFAULT_SUPABASE_CONFIG = {
    url: "",
    anonKey: ""
};

let resolvedConfig = { ...DEFAULT_SUPABASE_CONFIG };
let supabaseClient = null;
let initializationPromise = null;
let initializationResult = {
    initialized: false,
    reason: "not-initialized"
};

export function getSupabaseConfig() {

    return { ...resolvedConfig };

}

export function getSupabaseClient() {

    return supabaseClient;

}

export function isSupabaseReady() {

    return Boolean(initializationResult.initialized && supabaseClient);

}

export function isSupabaseProviderEnabled() {

    return getBackendProvider() === "supabase";

}

export function isSupabaseConfigComplete(config = resolvedConfig) {

    return typeof config.url === "string"
        && config.url.trim().length > 0
        && !config.url.includes("REPLACE_WITH_")
        && typeof config.anonKey === "string"
        && config.anonKey.trim().length > 0
        && !config.anonKey.includes("REPLACE_WITH_");

}

async function loadLocalSupabaseConfig() {

    const candidates = [
        "../../config/backend-config.local.js",
        "../../../firebase/firebase-config.local.js"
    ];

    for (const path of candidates) {
        try {
            const localModule = await import(path);
            const providerConfig = localModule.BACKEND_PROVIDER_CONFIG?.supabase
                || localModule.SUPABASE_CONFIG
                || null;

            if (providerConfig) {
                resolvedConfig = {
                    ...DEFAULT_SUPABASE_CONFIG,
                    ...providerConfig
                };

                return true;
            }
        }
        catch (error) {
            // Try next path.
        }
    }

    resolvedConfig = { ...DEFAULT_SUPABASE_CONFIG };

    return false;

}

export async function initializeSupabaseClient() {

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = initializeSupabaseClientInternal();

    return initializationPromise;

}

async function initializeSupabaseClientInternal() {

    await loadLocalSupabaseConfig();

    if (!isSupabaseProviderEnabled()) {
        initializationResult = {
            initialized: false,
            reason: "supabase-disabled"
        };

        return initializationResult;
    }

    if (!isSupabaseConfigComplete(resolvedConfig)) {
        initializationResult = {
            initialized: false,
            reason: "config-incomplete"
        };

        console.warn("Supabase is enabled but configuration is incomplete.");

        return initializationResult;
    }

    try {
        const { createClient } = await import(SUPABASE_ESM_URL);

        supabaseClient = createClient(resolvedConfig.url, resolvedConfig.anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        initializationResult = {
            initialized: true,
            reason: "ready"
        };

        return initializationResult;
    }
    catch (error) {
        supabaseClient = null;

        initializationResult = {
            initialized: false,
            reason: "initialization-failed",
            error: error?.message || String(error)
        };

        console.error("Supabase initialization failed.", error);

        return initializationResult;
    }

}

export const SupabaseClient = {
    initializeSupabaseClient,
    getSupabaseClient,
    getSupabaseConfig,
    isSupabaseReady,
    isSupabaseConfigComplete,
    isSupabaseProviderEnabled
};
