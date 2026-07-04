/**
 * Runtime configuration loader verification.
 *
 * Usage: node scripts/runtime-config-loader-test.mjs
 */

import { readFileSync } from "node:fs";
import {
    getSupabaseConfigFromModule,
    loadRuntimeConfigModule,
    resetRuntimeConfigCacheForTests
} from "../src/backend/config/runtime-config-loader.js";

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

async function main() {

    const publicSource = readFileSync("src/backend/config/backend-config.public.js", "utf8");
    assert(publicSource.includes("BACKEND_PROVIDER_CONFIG"), "public config exports BACKEND_PROVIDER_CONFIG");
    assert(!publicSource.includes("REPLACE_WITH_"), "public config has no placeholders");

    resetRuntimeConfigCacheForTests();
    const configModule = await loadRuntimeConfigModule();
    const supabaseConfig = getSupabaseConfigFromModule(configModule);

    assert(configModule, "runtime config module loads");
    assert(supabaseConfig?.url, "supabase url resolved");
    assert(supabaseConfig?.anonKey, "supabase anon key resolved");
    assert(supabaseConfig.url.includes("supabase.co"), "supabase url looks valid");

    console.log("runtime config loader: PASS");
    console.log(`resolved supabase url: ${supabaseConfig.url}`);

}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
