/**
 * Public contract for the Trend Engine (future).
 * Consumes History snapshots only. Does not mutate domain data.
 */
export const TREND_ENGINE_CONTRACT = {
    name: "TrendEngine",
    version: 1,

    responsibilities: [
        "Compare AssessmentSnapshot records over time for a single user",
        "Produce TrendResult with section and overall deltas",
        "Frame output as personal muhāsaba progress, never cross-user ranking"
    ],

    inputs: {
        computeTrends: {
            trendInput: "TrendInput { snapshots, options }"
        }
    },

    outputs: {
        computeTrends: "DomainResult<TrendResult>"
    },

    dependencies: {
        allowed: [
            "History Engine (read snapshots via Application Layer)",
            "shared/domain (AssessmentSnapshot, TrendInput, TrendResult)"
        ],
        forbidden: [
            "Assessment Engine (recalculation)",
            "Report Engine (live report generation)",
            "Feedback Engine",
            "Action Engine",
            "Analytics Engine (write path)",
            "Firestore synchronization",
            "Mutation of AssessmentSnapshot"
        ]
    },

    upstream: ["HistoryEngine"],
    downstream: ["FeedbackEngine", "ActionEngine"]
};

export const TREND_ENGINE_METHODS = [
    "computeTrends"
];
