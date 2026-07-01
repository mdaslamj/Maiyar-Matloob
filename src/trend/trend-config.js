export const TREND_CLASSIFICATIONS = {
    IMPROVING: "Improving",
    STABLE: "Stable",
    DECLINING: "Declining",
    INSUFFICIENT_DATA: "Insufficient Data"
};

export const TREND_DIRECTIONS = {
    UP: "up",
    DOWN: "down",
    STABLE: "stable",
    UNKNOWN: "unknown"
};

/**
 * Configurable thresholds for trend classification.
 * @readonly
 */
export const TREND_THRESHOLDS = {
    MIN_SNAPSHOTS_FOR_TREND: 2,
    IMPROVING_MIN_DELTA: 2,
    DECLINING_MAX_DELTA: -2,
    STABLE_ABS_DELTA: 2,
    CONSISTENCY_STD_DEV_FACTOR: 10
};

export const TREND_RESULT_SCHEMA_VERSION = 1;
