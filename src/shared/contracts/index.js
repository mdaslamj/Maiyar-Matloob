export { HISTORY_ENGINE_CONTRACT, HISTORY_ENGINE_METHODS } from "./history-engine.contract.js";
export { TREND_ENGINE_CONTRACT, TREND_ENGINE_METHODS } from "./trend-engine.contract.js";
export { FEEDBACK_ENGINE_CONTRACT, FEEDBACK_ENGINE_METHODS } from "./feedback-engine.contract.js";
export { ACTION_ENGINE_CONTRACT, ACTION_ENGINE_METHODS } from "./action-engine.contract.js";
export { ANALYTICS_ENGINE_CONTRACT, ANALYTICS_ENGINE_METHODS } from "./analytics-engine.contract.js";

/**
 * Engine dependency order (consumer → producer).
 * Analytics observes laterally and must not mutate upstream data.
 */
export const ENGINE_DEPENDENCY_ORDER = [
    "HistoryEngine",
    "TrendEngine",
    "FeedbackEngine",
    "ActionEngine"
];

export const ENGINE_OBSERVERS = [
    "AnalyticsEngine"
];
