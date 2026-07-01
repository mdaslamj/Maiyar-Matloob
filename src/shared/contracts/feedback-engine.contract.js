/**
 * Public contract for the Feedback Engine (future).
 */
export const FEEDBACK_ENGINE_CONTRACT = {
    name: "FeedbackEngine",
    version: 1,

    responsibilities: [
        "Generate contextual feedback messages from snapshot (+ optional trend)",
        "Support voluntary user feedback capture in future sprints",
        "Never modify assessment content or scoring"
    ],

    inputs: {
        generateFeedback: {
            feedbackInput: "FeedbackInput { snapshot, trend?, context? }"
        }
    },

    outputs: {
        generateFeedback: "DomainResult<FeedbackResult>"
    },

    dependencies: {
        allowed: [
            "shared/domain (FeedbackInput, FeedbackResult, AssessmentSnapshot, TrendResult)",
            "Trend Engine output (optional read)"
        ],
        forbidden: [
            "Assessment Engine",
            "Report Engine (live regeneration)",
            "History Engine (write path)",
            "Action Engine (circular dependency)",
            "Analytics content mutation",
            "Firestore writes"
        ]
    },

    upstream: ["HistoryEngine", "TrendEngine"],
    downstream: ["ActionEngine"]
};

export const FEEDBACK_ENGINE_METHODS = [
    "generateFeedback"
];
