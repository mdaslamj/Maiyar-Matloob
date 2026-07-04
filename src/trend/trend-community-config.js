export const COMMUNITY_INSIGHTS_SCHEMA_VERSION = 1;

export const RESPONSE_BUCKETS = [
    { key: "always", value: 4, label: "Always" },
    { key: "often", value: 3, label: "Often" },
    { key: "sometimes", value: 2, label: "Sometimes" },
    { key: "never", value: 1, label: "Never" }
];

const RESPONSE_VALUE_TO_KEY = Object.fromEntries(
    RESPONSE_BUCKETS.map(bucket => [bucket.value, bucket.key])
);

/**
 * Build admin analytics buckets from questionnaire.responseScale.
 * Falls back to RESPONSE_BUCKETS when scale metadata is unavailable.
 */
export function buildImplementationBuckets(responseScale = []) {

    if (!Array.isArray(responseScale) || !responseScale.length) {
        return [...RESPONSE_BUCKETS];
    }

    return [...responseScale]
        .sort((left, right) => Number(right.id) - Number(left.id))
        .map(option => {
            const value = Number(option.id);
            const key = RESPONSE_VALUE_TO_KEY[value];

            if (!key) {
                return null;
            }

            const fallback = RESPONSE_BUCKETS.find(bucket => bucket.key === key);

            return {
                key,
                value,
                label: option.shortLabel || option.label || fallback?.label || key
            };
        })
        .filter(Boolean);

}

export function createEmptyDistribution(buckets = RESPONSE_BUCKETS) {

    const distribution = {};

    buckets.forEach(bucket => {
        distribution[bucket.key] = 0;
    });

    return distribution;

}

export function normalizeDistributionValues(distribution, buckets = RESPONSE_BUCKETS) {

    const total = buckets.reduce(
        (sum, bucket) => sum + (distribution[bucket.key] || 0),
        0
    );

    if (!total) {
        const evenShare = Number((100 / buckets.length).toFixed(1));

        return Object.fromEntries(buckets.map(bucket => [bucket.key, evenShare]));
    }

    const normalized = {};

    buckets.forEach(bucket => {
        normalized[bucket.key] = Number(
            (((distribution[bucket.key] || 0) / total) * 100).toFixed(1)
        );
    });

    return normalized;

}

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
