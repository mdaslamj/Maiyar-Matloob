export const COMMUNITY_INSIGHTS_SCHEMA_VERSION = 1;

export const RESPONSE_BUCKETS = [
    { key: "always", value: 4, label: "Always" },
    { key: "often", value: 3, label: "Often" },
    { key: "sometimes", value: 2, label: "Sometimes" },
    { key: "never", value: 1, label: "Never" }
];

/**
 * Configurable implementation status bands (no hardcoded category assignment in logic).
 * Evaluated from positive response rate (Always + Often).
 */
export const IMPLEMENTATION_STATUS_CATEGORIES = [
    {
        key: "strongly_implemented",
        label: "Strongly Implemented",
        minPositiveRate: 75
    },
    {
        key: "moderately_implemented",
        label: "Moderately Implemented",
        minPositiveRate: 50
    },
    {
        key: "needs_educational_attention",
        label: "Needs Educational Attention",
        minPositiveRate: 25
    },
    {
        key: "critical_focus_area",
        label: "Critical Focus Area",
        minPositiveRate: 0
    }
];

export const EDUCATIONAL_PRIORITY_THRESHOLDS = {
    maxPositiveRate: 45,
    minNeverRate: 20,
    maxItems: 10
};

export const TREND_CLASSIFICATION_KEYS = {
    IMPROVING: "improving",
    DECLINING: "declining",
    STABLE: "stable",
    INSUFFICIENT_DATA: "insufficient_data"
};
