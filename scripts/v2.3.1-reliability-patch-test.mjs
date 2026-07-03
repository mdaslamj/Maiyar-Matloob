/**
 * Version 2.3.1 — Storage Reliability Patch verification.
 *
 * Usage: node scripts/v2.3.1-reliability-patch-test.mjs
 */

import { readFileSync } from "node:fs";
import { createProviderPair } from "../src/backend/registry/provider-registry.js";
import { resolveParticipantStorageId } from "../src/backend/providers/supabase/supabase-schema-mapper.js";

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

function testNullParticipantHandling() {

    assert(resolveParticipantStorageId(null) === null, "resolveParticipantStorageId(null) returns null");

    const supabase = createProviderPair("supabase");

    return supabase.storage.saveAssessment({
        report: { assessment: { overall: { percentage: 50 } } },
        participant: null
    }).then(result => {
        assert(result?.reason === "assessment-sync-skipped", "null participant returns assessment-sync-skipped");
        assert(result?.success === false, "null participant success is false");
        console.log("null participant handling: PASS");
    });

}

function testAtomicPersistenceImplementation() {

    const migration = readFileSync(
        "supabase/migrations/004_atomic_assessment_persistence.sql",
        "utf8"
    );
    assert(
        migration.includes("CREATE OR REPLACE FUNCTION persist_assessment_submission"),
        "migration defines persist_assessment_submission RPC"
    );

    const storageSource = readFileSync(
        "src/backend/providers/supabase/supabase-storage.js",
        "utf8"
    );
    assert(
        storageSource.includes("persist_assessment_submission"),
        "saveAssessment uses persist_assessment_submission RPC"
    );
    assert(
        !storageSource.includes('.from("reports")\n                    .insert('),
        "saveAssessment no longer inserts report separately"
    );
    assert(
        !storageSource.includes('.from("assessments")\n                    .insert('),
        "saveAssessment no longer inserts assessment separately"
    );

    console.log("atomic persistence implementation: PASS");

}

async function main() {

    await testNullParticipantHandling();
    testAtomicPersistenceImplementation();
    console.log("Version 2.3.1 reliability patch tests completed.");

}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
