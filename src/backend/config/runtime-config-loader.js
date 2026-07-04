/**
 * Provider-neutral runtime configuration loader.
 *
 * Resolution order:
 *   1. backend-config.local.js  (gitignored overrides)
 *   2. backend-config.public.js (tracked frontend-safe config)
 *   3. legacy firebase-config.local.js
 */

const RUNTIME_CONFIG_CANDIDATES = [
    "./backend-config.local.js",
    "./backend-config.public.js",
    "../firebase/firebase-config.local.js"
];

let cachedModule = undefined;
let cachePromise = null;

function resolveConfigModuleUrl(relativePath) {

    return new URL(relativePath, import.meta.url).href;

}

export async function loadRuntimeConfigModule(options = {}) {

    const { forceReload = false } = options;

    if (!forceReload && cachedModule !== undefined) {
        return cachedModule;
    }

    if (!forceReload && cachePromise) {
        return cachePromise;
    }

    cachePromise = (async () => {
        for (const relativePath of RUNTIME_CONFIG_CANDIDATES) {
            try {
                const loadedModule = await import(resolveConfigModuleUrl(relativePath));

                cachedModule = loadedModule;

                return loadedModule;
            }
            catch (error) {
                // Try next candidate.
            }
        }

        cachedModule = null;

        return null;
    })();

    return cachePromise;

}

export function getSupabaseConfigFromModule(configModule) {

    if (!configModule) {
        return null;
    }

    return configModule.BACKEND_PROVIDER_CONFIG?.supabase
        || configModule.SUPABASE_CONFIG
        || null;

}

export function getFirebaseConfigFromModule(configModule) {

    if (!configModule) {
        return null;
    }

    if (configModule.FIREBASE_CONFIG) {
        return configModule.FIREBASE_CONFIG;
    }

    return configModule.BACKEND_PROVIDER_CONFIG?.firebase || null;

}

export function getAdminAllowedEmailsFromModule(configModule) {

    if (!configModule || !Array.isArray(configModule.ADMIN_ALLOWED_EMAILS)) {
        return [];
    }

    return configModule.ADMIN_ALLOWED_EMAILS.filter(Boolean);

}

export function resetRuntimeConfigCacheForTests() {

    cachedModule = undefined;
    cachePromise = null;

}

export const RuntimeConfigLoader = {
    loadRuntimeConfigModule,
    getSupabaseConfigFromModule,
    getFirebaseConfigFromModule,
    getAdminAllowedEmailsFromModule,
    resetRuntimeConfigCacheForTests
};
