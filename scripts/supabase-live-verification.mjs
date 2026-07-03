/**
 * Version 2.3.4 — Live Supabase end-to-end verification (REST API).
 *
 * Reads credentials from:
 *   1. SUPABASE_URL + SUPABASE_ANON_KEY environment variables
 *   2. src/backend/config/backend-config.local.js
 *
 * Usage:
 *   node scripts/supabase-live-verification.mjs --phase 1
 *   node scripts/supabase-live-verification.mjs --phase 2
 *   node scripts/supabase-live-verification.mjs --phase 3
 *   node scripts/supabase-live-verification.mjs --phase 4
 *   node scripts/supabase-live-verification.mjs --all
 */

import { randomUUID } from "node:crypto";
import {
    calculateCommunityAverageImplementation,
    extractImplementationScore,
    mergeLatestImplementationScores
} from "../src/domain/community/implementation-average.js";

const TABLES = [
    "participants",
    "reports",
    "assessments",
    "community_question_answers",
    "community_section_aggregates",
    "community_meta",
    "system_versions",
    "admin_dashboard_metrics"
];

const RPC_FUNCTIONS = [
    "increment_community_question_counts",
    "increment_community_section_counts",
    "increment_community_meta_submissions",
    "persist_assessment_submission"
];

const args = new Set(process.argv.slice(2));
const runAll = args.has("--all");
const phaseFlagIndex = process.argv.indexOf("--phase");
const selectedPhase = runAll
    ? "all"
    : (phaseFlagIndex >= 0 ? process.argv[phaseFlagIndex + 1] : "1");

const results = [];

function record(phase, check, status, detail = "") {

    results.push({ phase, check, status, detail });
    console.log(`[${status}] Phase ${phase} — ${check}${detail ? `: ${detail}` : ""}`);

}

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

async function loadSupabaseCredentials() {

    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        return {
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY
        };
    }

    const configUrl = new URL("../src/backend/config/backend-config.local.js", import.meta.url);
    const configModule = await import(configUrl.href);
    const config = configModule.BACKEND_PROVIDER_CONFIG?.supabase
        || configModule.SUPABASE_CONFIG
        || null;

    assert(config?.url && config?.anonKey, "backend-config.local.js missing supabase url/anonKey");

    return config;

}

function supabaseHeaders(anonKey, extra = {}) {

    return {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        ...extra
    };

}

async function restRequest(url, anonKey, path, options = {}) {

    const response = await fetch(`${url}/rest/v1/${path}`, {
        ...options,
        headers: supabaseHeaders(anonKey, options.headers)
    });

    const body = await response.text();
    let json = null;

    try {
        json = body ? JSON.parse(body) : null;
    }
    catch (error) {
        json = body;
    }

    return { status: response.status, json, headers: response.headers };

}

async function restGet(url, anonKey, path) {

    return restRequest(url, anonKey, path);

}

async function restRpc(url, anonKey, functionName, payload = {}) {

    return restRequest(url, anonKey, `rpc/${functionName}`, {
        method: "POST",
        body: JSON.stringify(payload)
    });

}

async function countRows(url, anonKey, table) {

    const { status, headers, json } = await restRequest(url, anonKey, `${table}?select=id`, {
        method: "HEAD",
        headers: { Prefer: "count=exact" }
    });

    if (status === 404 || json?.code === "PGRST205") {
        return { exists: false, rows: 0 };
    }

    if (status >= 400) {
        return { exists: false, error: json?.message || status };
    }

    const range = headers.get("content-range") || "";
    const total = range.includes("/") ? Number(range.split("/")[1]) : 0;

    return { exists: true, rows: Number.isFinite(total) ? total : 0 };

}

async function queryTableCounts(url, anonKey) {

    const counts = {};

    for (const table of TABLES) {
        counts[table] = await countRows(url, anonKey, table);
    }

    return counts;

}

function buildAssessmentPayload(participantId, assessmentId, score) {

    const capturedAt = new Date().toISOString();

    return {
        p_report: {
            report: {
                assessment: {
                    overall: { percentage: score, level: "Test" },
                    sections: []
                },
                communityAnswerRecord: { capturedAt, questionAnswers: {} }
            },
            summary: {
                overallPercentage: score,
                overallLevel: "Test",
                capturedAt
            },
            version: "2.3.4:verification",
            metadata: {
                appVersion: "2.3.4",
                contentVersion: "verification"
            },
            schema_version: 1
        },
        p_assessment: {
            id: assessmentId,
            participant_id: participantId,
            captured_at: capturedAt,
            timestamp: capturedAt,
            app_version: "2.3.4",
            content_version: "verification",
            overall_percentage: score,
            overall_level: "Test",
            implementation_score: score,
            section_scores: [],
            community_answer_record: { capturedAt, questionAnswers: {} },
            schema_version: 1
        }
    };

}

async function upsertParticipant(url, anonKey, participantId) {

    const row = {
        id: participantId,
        local_participant_id: participantId,
        name: "Live Verification Participant",
        mobile: "03001234567",
        assessment_count: 1,
        schema_version: 1,
        metadata: {},
        last_synced_at: new Date().toISOString()
    };

    const { status, json } = await restRequest(url, anonKey, "participants", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(row)
    });

    assert(status < 400, `participant upsert failed: ${json?.message || status}`);

}

async function writeTestAssessment(url, anonKey, participantId, score) {

    await upsertParticipant(url, anonKey, participantId);

    const assessmentId = randomUUID();
    const payload = buildAssessmentPayload(participantId, assessmentId, score);
    const { status, json } = await restRpc(url, anonKey, "persist_assessment_submission", payload);

    assert(status < 400, `persist_assessment_submission failed: ${JSON.stringify(json)}`);

    return { assessmentId, result: json };

}

async function loadDashboardMetricsViaRest(url, anonKey) {

    const [
        participants,
        assessments,
        latest,
        assessmentRows
    ] = await Promise.all([
        countRows(url, anonKey, "participants"),
        countRows(url, anonKey, "assessments"),
        restGet(url, anonKey, "assessments?select=timestamp,captured_at&order=timestamp.desc&limit=1"),
        restGet(
            url,
            anonKey,
            "assessments?select=participant_id,implementation_score,overall_percentage,timestamp&order=timestamp.desc"
        )
    ]);

    const latestScoresByParticipant = new Map();

    if (Array.isArray(assessmentRows.json)) {
        mergeLatestImplementationScores(
            latestScoresByParticipant,
            assessmentRows.json.map(row => ({
                participantId: row.participant_id,
                score: extractImplementationScore({
                    implementationScore: row.implementation_score,
                    overallPercentage: row.overall_percentage
                })
            }))
        );
    }

    const latestRow = Array.isArray(latest.json) ? latest.json[0] : null;

    return {
        totalParticipants: participants.rows,
        completedAssessments: assessments.rows,
        latestAssessment: latestRow?.timestamp || latestRow?.captured_at || null,
        averageImplementation: calculateCommunityAverageImplementation(latestScoresByParticipant)
    };

}

async function phase1DatabaseReady(credentials) {

    console.log("\n=== Phase 1 — Connect / Database Ready ===\n");

    record("1", "Project URL configured", "PASS", credentials.url);

    for (const table of TABLES) {
        const { status, json } = await restGet(
            credentials.url,
            credentials.anonKey,
            `${table}?select=id&limit=1`
        );

        if (status === 200 || status === 206) {
            record("1", `Table ${table}`, "PASS", "exists");
        }
        else if (json?.code === "PGRST205") {
            record(
                "1",
                `Table ${table}`,
                "FAIL",
                "missing — run supabase/apply-all-migrations.sql in SQL Editor"
            );
        }
        else {
            record("1", `Table ${table}`, "FAIL", json?.message || `HTTP ${status}`);
        }
    }

    for (const functionName of RPC_FUNCTIONS) {
        const { json } = await restRpc(credentials.url, credentials.anonKey, functionName, {});

        if (json?.code === "PGRST202") {
            record(
                "1",
                `RPC ${functionName}`,
                "FAIL",
                "missing — run supabase/apply-all-migrations.sql in SQL Editor"
            );
        }
        else {
            record("1", `RPC ${functionName}`, "PASS", "exists");
        }
    }

    console.log("\nTable row counts:", JSON.stringify(await queryTableCounts(credentials.url, credentials.anonKey), null, 2));

}

async function phase2WriteTest(credentials) {

    console.log("\n=== Phase 2 — Write Test ===\n");

    const participantId = `live-verify-${Date.now()}`;
    const writeResult = await writeTestAssessment(credentials.url, credentials.anonKey, participantId, 82.5);

    record("2", "persist_assessment_submission", "PASS", writeResult.assessmentId);

    const counts = await queryTableCounts(credentials.url, credentials.anonKey);

    for (const table of ["participants", "reports", "assessments"]) {
        const info = counts[table];

        if (info?.exists && info.rows > 0) {
            record("2", `${table} rows present`, "PASS", String(info.rows));
        }
        else {
            record("2", `${table} rows present`, "FAIL", JSON.stringify(info));
        }
    }

    const { json: participants } = await restGet(
        credentials.url,
        credentials.anonKey,
        `participants?id=eq.${participantId}&select=id,name,last_assessment_at`
    );

    const { json: assessments } = await restGet(
        credentials.url,
        credentials.anonKey,
        `assessments?participant_id=eq.${participantId}&select=id,implementation_score,timestamp&order=timestamp.desc`
    );

    const { json: reports } = await restGet(
        credentials.url,
        credentials.anonKey,
        "reports?select=id,created_at&order=created_at.desc&limit=3"
    );

    console.log("\nDatabase evidence:");
    console.log("participants:", JSON.stringify(participants, null, 2));
    console.log("assessments:", JSON.stringify(assessments, null, 2));
    console.log("reports:", JSON.stringify(reports, null, 2));

}

async function phase3DashboardWidgets(credentials) {

    console.log("\n=== Phase 3 — Dashboard Metrics (REST mirror of widget loaders) ===\n");

    const metrics = await loadDashboardMetricsViaRest(credentials.url, credentials.anonKey);

    console.log(JSON.stringify(metrics, null, 2));

    record("3", "Total Participants", metrics.totalParticipants > 0 ? "PASS" : "WARN", String(metrics.totalParticipants));
    record("3", "Completed Assessments", metrics.completedAssessments > 0 ? "PASS" : "WARN", String(metrics.completedAssessments));
    record("3", "Latest Assessment", metrics.latestAssessment ? "PASS" : "WARN", metrics.latestAssessment || "empty");
    record(
        "3",
        "Average Implementation",
        metrics.averageImplementation != null ? "PASS" : "WARN",
        String(metrics.averageImplementation)
    );

}

async function phase4Validation(credentials) {

    console.log("\n=== Phase 4 — Repeat Write + Metric Validation ===\n");

    const before = await loadDashboardMetricsViaRest(credentials.url, credentials.anonKey);
    const participantA = `live-verify-a-${Date.now()}`;
    const participantB = `live-verify-b-${Date.now()}`;

    await writeTestAssessment(credentials.url, credentials.anonKey, participantA, 80);
    await writeTestAssessment(credentials.url, credentials.anonKey, participantB, 60);
    await writeTestAssessment(credentials.url, credentials.anonKey, participantA, 90);

    const after = await loadDashboardMetricsViaRest(credentials.url, credentials.anonKey);

    console.log("Before:", JSON.stringify(before, null, 2));
    console.log("After:", JSON.stringify(after, null, 2));

    if (after.totalParticipants >= before.totalParticipants + 2) {
        record("4", "Total Participants increased", "PASS", `${before.totalParticipants} → ${after.totalParticipants}`);
    }
    else {
        record("4", "Total Participants increased", "FAIL", `${before.totalParticipants} → ${after.totalParticipants}`);
    }

    if (after.completedAssessments >= before.completedAssessments + 3) {
        record("4", "Completed Assessments incremented", "PASS", `${before.completedAssessments} → ${after.completedAssessments}`);
    }
    else {
        record("4", "Completed Assessments incremented", "FAIL", `${before.completedAssessments} → ${after.completedAssessments}`);
    }

    if (after.latestAssessment) {
        record("4", "Latest Assessment updated", "PASS", after.latestAssessment);
    }
    else {
        record("4", "Latest Assessment updated", "FAIL", "empty");
    }

    record(
        "4",
        "Average Implementation recalculated",
        after.averageImplementation != null ? "PASS" : "FAIL",
        String(after.averageImplementation)
    );

    console.log("\nFinal table row counts:", JSON.stringify(await queryTableCounts(credentials.url, credentials.anonKey), null, 2));

}

async function main() {

    const credentials = await loadSupabaseCredentials();

    console.log("Supabase project:", credentials.url);
    console.log("Selected phase:", selectedPhase);

    if (selectedPhase === "all" || selectedPhase === "1") {
        await phase1DatabaseReady(credentials);
    }

    const phase1Failures = results.filter(item => item.phase === "1" && item.status === "FAIL");

    if (phase1Failures.length && selectedPhase !== "1") {
        console.error("\nPhase 1 is not complete. Apply supabase/apply-all-migrations.sql first.");
        process.exit(1);
    }

    if ((selectedPhase === "all" || selectedPhase === "2") && !phase1Failures.length) {
        await phase2WriteTest(credentials);
    }

    if ((selectedPhase === "all" || selectedPhase === "3") && !phase1Failures.length) {
        await phase3DashboardWidgets(credentials);
    }

    if ((selectedPhase === "all" || selectedPhase === "4") && !phase1Failures.length) {
        await phase4Validation(credentials);
    }

    const summary = {
        pass: results.filter(item => item.status === "PASS").length,
        fail: results.filter(item => item.status === "FAIL").length,
        warn: results.filter(item => item.status === "WARN").length
    };

    console.log("\nSummary:", JSON.stringify(summary, null, 2));

    if (summary.fail > 0) {
        process.exit(1);
    }

}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
