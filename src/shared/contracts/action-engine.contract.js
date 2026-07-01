/**
 * Public contract for the Action Engine (future).
 */
export const ACTION_ENGINE_CONTRACT = {
    name: "ActionEngine",
    version: 1,

    responsibilities: [
        "Produce structured ActionPlanResult items linked to weak sections/questions",
        "Respect max item limits and Urdu presentation framing",
        "Never replace Report Engine action plan at completion unless explicitly migrated"
    ],

    inputs: {
        generateActionPlan: {
            actionPlanInput: "ActionPlanInput { snapshot, trend?, feedback?, maxItems? }"
        }
    },

    outputs: {
        generateActionPlan: "DomainResult<ActionPlanResult>"
    },

    dependencies: {
        allowed: [
            "shared/domain (ActionPlanInput, ActionPlanResult)",
            "Trend Engine output (optional)",
            "Feedback Engine output (optional)"
        ],
        forbidden: [
            "Assessment Engine",
            "Report Engine (live buildActionPlan at historical view without stored report)",
            "History Engine (write path)",
            "Analytics mutation",
            "Firestore writes"
        ]
    },

    upstream: ["HistoryEngine", "TrendEngine", "FeedbackEngine"],
    downstream: []
};

export const ACTION_ENGINE_METHODS = [
    "generateActionPlan"
];
