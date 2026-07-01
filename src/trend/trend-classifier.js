import {
    TREND_CLASSIFICATIONS,
    TREND_DIRECTIONS,
    TREND_THRESHOLDS
} from "./trend-config.js";

export function classifyTrend(deltaPercentage, snapshotCount) {

    if (snapshotCount < TREND_THRESHOLDS.MIN_SNAPSHOTS_FOR_TREND || deltaPercentage == null) {
        return TREND_CLASSIFICATIONS.INSUFFICIENT_DATA;
    }

    if (deltaPercentage >= TREND_THRESHOLDS.IMPROVING_MIN_DELTA) {
        return TREND_CLASSIFICATIONS.IMPROVING;
    }

    if (deltaPercentage <= TREND_THRESHOLDS.DECLINING_MAX_DELTA) {
        return TREND_CLASSIFICATIONS.DECLINING;
    }

    return TREND_CLASSIFICATIONS.STABLE;

}

export function classificationToDirection(classification) {

    switch (classification) {
        case TREND_CLASSIFICATIONS.IMPROVING:
            return TREND_DIRECTIONS.UP;
        case TREND_CLASSIFICATIONS.DECLINING:
            return TREND_DIRECTIONS.DOWN;
        case TREND_CLASSIFICATIONS.STABLE:
            return TREND_DIRECTIONS.STABLE;
        default:
            return TREND_DIRECTIONS.UNKNOWN;
    }

}

export function getTrendClassificationLabel(classification) {

    const labels = {
        [TREND_CLASSIFICATIONS.IMPROVING]: "بہتری",
        [TREND_CLASSIFICATIONS.STABLE]: "مستحکم",
        [TREND_CLASSIFICATIONS.DECLINING]: "تنازل",
        [TREND_CLASSIFICATIONS.INSUFFICIENT_DATA]: "ناکافی ڈیٹا"
    };

    return labels[classification] || classification;

}
