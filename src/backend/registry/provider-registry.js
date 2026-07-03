import { assertIdentityAdapter } from "../adapters/identity-adapter-interface.js";
import { assertStorageAdapter } from "../adapters/storage-adapter-interface.js";
import { createFirebaseIdentityAdapter } from "../providers/firebase/firebase-identity.js";
import { createFirebaseStorageAdapter } from "../providers/firebase/firebase-storage.js";
import { createNoOpIdentityAdapter } from "../providers/none/noop-identity.js";
import { createNoOpStorageAdapter } from "../providers/none/noop-storage.js";
import { createSupabaseIdentityAdapter } from "../providers/supabase/supabase-identity.js";
import { createSupabaseStorageAdapter } from "../providers/supabase/supabase-storage.js";

const providerFactories = {
    none: {
        identity: createNoOpIdentityAdapter,
        storage: createNoOpStorageAdapter
    },
    firebase: {
        identity: createFirebaseIdentityAdapter,
        storage: createFirebaseStorageAdapter
    },
    supabase: {
        identity: createSupabaseIdentityAdapter,
        storage: createSupabaseStorageAdapter
    },
    rest: {
        identity: createNoOpIdentityAdapter,
        storage: createNoOpStorageAdapter
    },
    "self-hosted": {
        identity: createNoOpIdentityAdapter,
        storage: createNoOpStorageAdapter
    }
};

export function createProviderPair(providerName) {

    const factories = providerFactories[providerName] || providerFactories.none;

    return {
        identity: assertIdentityAdapter(factories.identity(), providerName),
        storage: assertStorageAdapter(factories.storage(), providerName)
    };

}

export const ProviderRegistry = {
    providerFactories,
    createProviderPair
};
