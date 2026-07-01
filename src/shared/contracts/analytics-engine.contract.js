/**
 * Public contract for the Analytics Engine (future).
 * Observes events only. Never changes domain data.
 */
export const ANALYTICS_ENGINE_CONTRACT = {
    name: "AnalyticsEngine",
    version: 1,

    responsibilities: [
        "Dispatch consent-gated AnalyticsEvent records",
        "Observe application lifecycle without reading raw answers",
        "Remain optional and disabled by default"
    ],

    inputs: {
        trackEvent: {
            analyticsEvent: "AnalyticsEvent (partial — engine assigns eventId if omitted)"
        }
    },

    outputs: {
        trackEvent: "DomainResult<{ accepted: boolean }>"
    },

    dependencies: {
        allowed: [
            "shared/domain (AnalyticsEvent, ANALYTICS_EVENT_TYPES)",
            "StorageService (local telemetry buffer — future)",
            "UserPreferences.analyticsConsent (future)"
        ],
        forbidden: [
            "Assessment Engine",
            "Report Engine",
            "History Engine (write or mutate snapshots)",
            "Trend / Feedback / Action engines (must not alter their outputs)",
            "Raw answer values in metadata by default",
            "Firestore writes until privacy review"
        ]
    },

    upstream: [],
    downstream: [],
    observes: [
        "Application Layer lifecycle",
        "HistoryEngine read-only listing events",
        "Presentation Layer interactions (via Application Layer)"
    ],

    constraints: {
        readOnlyDomainData: true,
        noAnswerPayload: true,
        consentRequired: true
    }
};

export const ANALYTICS_ENGINE_METHODS = [
    "trackEvent"
];
