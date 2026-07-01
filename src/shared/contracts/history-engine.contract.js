/**
 * Public contract for the History Engine.
 * Implementation: src/history/history-engine.js
 */
export const HISTORY_ENGINE_CONTRACT = {
    name: "HistoryEngine",
    version: 1,

    responsibilities: [
        "Persist immutable assessment snapshots after successful completion",
        "List, retrieve, and delete snapshots locally",
        "Store frozen report payloads keyed by snapshotId for historical viewing",
        "Enforce local retention limits without mutating snapshot content"
    ],

    inputs: {
        saveSnapshot: {
            report: "Final report object from Report Engine (at completion time)",
            metadata: {
                appVersion: "string",
                contentVersion: "string"
            }
        },
        getSnapshot: { snapshotId: "string" },
        deleteSnapshot: { snapshotId: "string" }
    },

    outputs: {
        saveSnapshot: "AssessmentSnapshot",
        listSnapshots: "AssessmentSnapshot[] (newest first)",
        getSnapshot: "AssessmentSnapshot | null",
        getSnapshotReport: "Report object | null",
        deleteSnapshot: "boolean",
        clearHistory: "boolean"
    },

    dependencies: {
        allowed: [
            "StorageService",
            "Report Engine (buildReportSections for sectionSummary only at write time)",
            "shared/domain (AssessmentSnapshot shape)"
        ],
        forbidden: [
            "Firebase / Firestore writes",
            "Trend Engine",
            "Feedback Engine",
            "Action Engine",
            "Analytics Engine",
            "Assessment Engine (recalculation)",
            "direct localStorage access"
        ]
    },

    dataOwnership: {
        owns: ["AssessmentSnapshot index", "snapshotId → report payload map"],
        reads: ["Report at completion time"],
        mustNotMutate: ["AssessmentSnapshot after write", "questionnaire.json"]
    }
};

export const HISTORY_ENGINE_METHODS = [
    "saveSnapshot",
    "listSnapshots",
    "getSnapshot",
    "getSnapshotReport",
    "deleteSnapshot",
    "clearHistory"
];
