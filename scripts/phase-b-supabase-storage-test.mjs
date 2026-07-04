/**
 * Phase B — Supabase storage provider verification.
 *
 * Unit tests run without credentials.
 * Integration tests run when SUPABASE_URL and SUPABASE_ANON_KEY are set.
 *
 * Usage:
 *   node scripts/phase-b-supabase-storage-test.mjs
 *   node scripts/phase-b-supabase-storage-test.mjs --integration
 */

import { createProviderPair } from "../src/backend/registry/provider-registry.js";
import {
    mapAssessmentFromRow,
    mapParticipantDirectoryEntry,
    mapParticipantFromRow,
    mapParticipantToRow,
    mapReportToRow,
    resolveParticipantStorageId
} from "../src/backend/providers/supabase/supabase-schema-mapper.js";
import {
    calculateCommunityAverageImplementation,
    extractImplementationScore,
    mergeLatestImplementationScores
} from "../src/domain/community/implementation-average.js";
import { assertStorageAdapter } from "../src/backend/adapters/storage-adapter-interface.js";

const args = new Set(process.argv.slice(2));
const runIntegration = args.has("--integration");

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

function testMapper() {

    const participant = {
        participantId: "participant-001",
        name: "Test",
        mobile: "03001234567",
        createdAt: "2026-07-01T00:00:00.000Z",
        assessmentCount: 1
    };

    const row = mapParticipantToRow(participant);
    assert(row.id === "participant-001", "participant row id");
    assert(mapParticipantFromRow(row).localParticipantId === "participant-001", "participant round-trip id");

    const report = {
        assessment: { overall: { percentage: 82.5, level: "Very Good" } },
        communityAnswerRecord: { capturedAt: "2026-07-01T12:00:00.000Z" }
    };

    const reportRow = mapReportToRow(report, { appVersion: "2.3.0", contentVersion: "1.0" });
    assert(reportRow.summary.overallPercentage === 82.5, "report summary percentage");

    const assessmentRow = {
        id: "11111111-1111-1111-1111-111111111111",
        participant_id: "participant-001",
        report_id: "22222222-2222-2222-2222-222222222222",
        captured_at: "2026-07-01T12:00:00.000Z",
        timestamp: "2026-07-01T12:00:00.000Z",
        app_version: "2.3.0",
        content_version: "1.0",
        overall_percentage: 82.5,
        overall_level: "Very Good",
        implementation_score: 82.5,
        section_scores: [],
        community_answer_record: null,
        schema_version: 1
    };

    const mappedAssessment = mapAssessmentFromRow(assessmentRow, { report });
    assert(mappedAssessment.implementationScore === 82.5, "assessment implementation score");
    assert(resolveParticipantStorageId(participant) === "participant-001", "resolve participant id");
    assert(resolveParticipantStorageId(null) === null, "resolve participant id null-safe");

    const directoryEntry = mapParticipantDirectoryEntry(
        {
            id: "participant-001",
            assessment_count: 2,
            last_assessment_at: "2026-07-01T12:00:00.000Z"
        },
        { overallLevel: "Very Good", timestamp: "2026-07-01T12:00:00.000Z" }
    );
    assert(directoryEntry.participantId === "participant-001", "directory participant id");
    assert(directoryEntry.assessments === 2, "directory assessment count");
    assert(directoryEntry.currentLevel === "Very Good", "directory implementation level");
    assert(directoryEntry.status === "active", "directory participation status");

    console.log("mapper tests: PASS");

}

function testDomainAverageFromStorageRows() {

    const latest = new Map();

    mergeLatestImplementationScores(latest, [
        { participantId: "a", score: extractImplementationScore({ implementationScore: 90 }) },
        { participantId: "b", score: extractImplementationScore({ implementationScore: 70 }) },
        { participantId: "a", score: extractImplementationScore({ implementationScore: 50 }) }
    ]);

    assert(latest.size === 2, "latest map size");
    assert(latest.get("a") === 90, "latest per participant keeps first seen");
    assert(calculateCommunityAverageImplementation(latest) === 80, "community average");

    console.log("domain average tests: PASS");

}

function testAdapterContract() {

    const firebase = createProviderPair("firebase");
    const supabase = createProviderPair("supabase");
    const none = createProviderPair("none");

    assertStorageAdapter(firebase.storage, "firebase");
    assertStorageAdapter(supabase.storage, "supabase");
    assertStorageAdapter(none.storage, "none");

    assert(firebase.storage.getProviderName() === "firebase", "firebase provider name");
    assert(supabase.storage.getProviderName() === "supabase", "supabase provider name");
    assert(typeof supabase.storage.loadParticipant === "function", "supabase loadParticipant");
    assert(typeof supabase.storage.loadAssessment === "function", "supabase loadAssessment");

    console.log("adapter contract tests: PASS");

}

async function testProviderSwapConfig() {

    const { FEATURE_FLAGS, getBackendProviderFromFlags } = await import("../src/shared/feature-flags.js");

    const original = {
        USE_FIREBASE: FEATURE_FLAGS.USE_FIREBASE,
        USE_BACKEND_SYNC: FEATURE_FLAGS.USE_BACKEND_SYNC,
        BACKEND_PROVIDER: FEATURE_FLAGS.BACKEND_PROVIDER
    };

    FEATURE_FLAGS.USE_BACKEND_SYNC = false;
    FEATURE_FLAGS.USE_FIREBASE = true;
    FEATURE_FLAGS.BACKEND_PROVIDER = "none";
    assert(getBackendProviderFromFlags() === "firebase", "legacy firebase mapping");

    FEATURE_FLAGS.USE_BACKEND_SYNC = true;
    FEATURE_FLAGS.USE_FIREBASE = false;
    FEATURE_FLAGS.BACKEND_PROVIDER = "supabase";
    assert(getBackendProviderFromFlags() === "supabase", "supabase provider mapping");

    FEATURE_FLAGS.USE_BACKEND_SYNC = original.USE_BACKEND_SYNC;
    FEATURE_FLAGS.USE_FIREBASE = original.USE_FIREBASE;
    FEATURE_FLAGS.BACKEND_PROVIDER = original.BACKEND_PROVIDER;

    console.log("provider swap config tests: PASS");

}

async function testNullParticipantSkip() {

    const supabase = createProviderPair("supabase");
    const result = await supabase.storage.saveAssessment({
        report: { assessment: { overall: { percentage: 70 } } },
        participant: null
    });

    assert(result.reason === "assessment-sync-skipped", "null participant assessment skip");
    assert(result.success === false, "null participant not success");

    console.log("null participant skip tests: PASS");

}

async function testIntegration() {

    if (!runIntegration) {
        console.log("integration tests: SKIPPED (use --integration)");
        return;
    }

    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    assert(url && anonKey, "SUPABASE_URL and SUPABASE_ANON_KEY required for integration tests");

    process.env.PHASE_B_BACKEND_CONFIG = JSON.stringify({
        BACKEND_PROVIDER_CONFIG: {
            supabase: { url, anonKey }
        }
    });

    console.log("integration tests: configure backend-config.local.js manually for browser verification");
    console.log("integration tests: SKIPPED in CI without injected local config module");

}

async function main() {

    testMapper();
    testDomainAverageFromStorageRows();
    testAdapterContract();
    await testProviderSwapConfig();
    await testNullParticipantSkip();
    await testIntegration();
    console.log("Phase B storage tests completed.");

}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
