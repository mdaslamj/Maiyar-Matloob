import {
    calculateRawScores,
    generateAssessment
} from "../assessment/assessment.js";
import {
    buildReportSections,
    createFinalReport,
    createReportInsights
} from "../report/report.js";
import {
    saveAnswers,
    loadAnswers,
    saveSession,
    loadSession,
    saveReport,
    loadReport,
    clearAll,
    hasIncompleteSession
} from "../storage/storage.js";
import { initializeFirebaseInfrastructure } from "../firebase/firebase-service.js";
import {
    saveSnapshot,
    listSnapshots,
    getSnapshot,
    getSnapshotReport,
    deleteSnapshot,
    clearHistory
} from "../history/history-engine.js";
import { buildHistoricalDashboardPresentation } from "../history/history-presentation.js";
import { computeTrends, getSectionTrendFromResult } from "../trend/trend-engine.js";
import {
    buildCommunityAnswerRecord,
    computeMaiyaarInsights,
    computePracticeInsights,
    computeQuestionInsights,
    computeSectionInsights,
    computeImplementationTrends,
    computeEducationalPriorities
} from "../trend/trend-engine.js";
import { generateActionPlan } from "../action/action-engine.js";
import { generateFeedback } from "../feedback/feedback-engine.js";
import { computeSuggestedReassessment } from "../reassessment/reassessment-planner.js";
import { buildGrowthDashboard } from "../growth/growth-dashboard.js";
import { buildPersonalDashboard } from "../dashboard/personal-dashboard.js";
import { buildPersonalInsights } from "../insights/personal-insights.js";
import { buildReassessmentPlan } from "../reassessment/reassessment-plan.js";
import { buildGrowthTimeline } from "../timeline/growth-timeline.js";
import {
    listJournalEntries,
    saveJournalEntry,
    deleteJournalEntry
} from "../journal/journal-engine.js";
import { isDomainSuccess, createSuccess } from "../shared/errors/domain-result.js";

const APP_VERSION = "2.1.0";

export function validateQuestionnaireData(data) {

    if (!data || typeof data !== "object") {
        return { valid: false, reason: "Questionnaire data is not a valid object" };
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
        return { valid: false, reason: "Questionnaire questions array is missing or empty" };
    }

    const hasResponseScale = Array.isArray(data.responseScale) && data.responseScale.length > 0;

    const hasInvalidQuestion = data.questions.some(question => {
        if (!question || typeof question !== "object") {
            return true;
        }

        if (typeof question.question !== "string" || !question.question.trim()) {
            return true;
        }

        const hasOptions = Array.isArray(question.options) && question.options.length > 0;

        return !hasOptions && !hasResponseScale;
    });

    if (hasInvalidQuestion) {
        return { valid: false, reason: "Questionnaire contains malformed question entries" };
    }

    return { valid: true };

}

class ApplicationService {

    constructor() {

        this.questionnaire = [];
        this.responseScale = [];
        this.currentQuestion = 0;
        this.answers = {};
        this.isSubmitted = false;
        this.questionnaireReady = false;
        this.contentVersion = "unknown";
        this._growthPipelineCache = null;

    }

    _invalidateGrowthCache() {

        this._growthPipelineCache = null;

    }

    _buildGrowthCacheKey() {

        const snapshots = listSnapshots();
        const journalEntries = listJournalEntries();
        const latestSnapshot = snapshots[0];
        const latestJournal = journalEntries[0];

        return [
            snapshots.length,
            latestSnapshot?.snapshotId || "none",
            latestSnapshot?.createdAt || "none",
            journalEntries.length,
            latestJournal?.entryId || "none",
            this.isSubmitted ? "1" : "0",
            Object.keys(this.answers).length
        ].join("|");

    }

    _getGrowthPipeline() {

        const cacheKey = this._buildGrowthCacheKey();

        if (this._growthPipelineCache?.key === cacheKey) {
            return this._growthPipelineCache.data;
        }

        const trendResult = computeTrends(listSnapshots());
        const actionPlanResult = generateActionPlan(trendResult);
        const reassessmentResult = computeSuggestedReassessment(trendResult, actionPlanResult);
        const feedbackResult = generateFeedback(trendResult, actionPlanResult, reassessmentResult);
        const data = {
            trendResult,
            actionPlanResult,
            reassessmentResult,
            feedbackResult
        };

        this._growthPipelineCache = {
            key: cacheKey,
            data
        };

        return data;

    }

    /**
     * Batch growth intelligence outputs for a single render pass.
     * Avoids repeated pipeline execution in UI screens.
     */
    getGrowthBundle() {

        const pipeline = this._getGrowthPipeline();
        const {
            trendResult,
            actionPlanResult,
            reassessmentResult,
            feedbackResult
        } = pipeline;
        const snapshots = listSnapshots();
        const journalEntries = listJournalEntries();

        return {
            pipeline,
            dashboard: buildPersonalDashboard(
                trendResult,
                actionPlanResult,
                feedbackResult,
                reassessmentResult,
                { hasIncompleteSession: this.hasIncompleteSession() }
            ),
            insights: buildPersonalInsights(trendResult, actionPlanResult, feedbackResult),
            reassessmentPlan: buildReassessmentPlan(reassessmentResult, trendResult),
            growthDashboard: buildGrowthDashboard(
                trendResult,
                actionPlanResult,
                feedbackResult,
                reassessmentResult
            ),
            timeline: buildGrowthTimeline(
                snapshots,
                journalEntries,
                trendResult,
                feedbackResult
            ),
            snapshots
        };

    }

    initializeQuestionnaire(data) {

        const validation = validateQuestionnaireData(data);

        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        this.questionnaire = data.questions;
        this.responseScale = Array.isArray(data.responseScale) ? data.responseScale : [];
        this.contentVersion = data.version || data.metadata?.contentVersion || "unknown";
        this.questionnaireReady = true;
        this.answers = loadAnswers();

    }

    async initializeInfrastructure() {

        return initializeFirebaseInfrastructure();

    }

    resetQuestionnaireLoad() {

        this.questionnaire = [];
        this.responseScale = [];
        this.questionnaireReady = false;

    }

    getQuestionKey(question, index) {

        return question?.id || question?.standardId || `question-${index}`;

    }

    getQuestionRequired(question) {

        return question?.required !== false;

    }

    getQuestionOptions(question) {

        if (Array.isArray(question?.options) && question.options.length) {
            return question.options.map((option, index) => ({
                value: Number(option?.value ?? option?.score ?? option?.id ?? index + 1),
                label: option?.label ?? option?.text ?? option?.title ?? String(option?.value ?? option?.id ?? index + 1)
            }));
        }

        return this.responseScale.map(option => ({
            value: Number(option.id),
            label: option.label
        }));

    }

    getQuestionSection(question) {

        return question?.section || question?.category || "General";

    }

    getReportContext() {

        return {
            questionnaire: this.questionnaire,
            answers: this.answers,
            responseScale: this.responseScale,
            getQuestionKey: (question, index) => this.getQuestionKey(question, index),
            getQuestionSection: (question) => this.getQuestionSection(question)
        };

    }

    recordAnswer(questionIndex, value) {

        const question = this.questionnaire[questionIndex];

        if (!question) {
            return;
        }

        this.answers[this.getQuestionKey(question, questionIndex)] = Number(value);

    }

    persistAnswersAndSession() {

        saveAnswers(this.answers);
        this.persistSession();

    }

    persistSession() {

        saveSession({
            currentQuestion: this.currentQuestion,
            isSubmitted: this.isSubmitted
        });

    }

    restartWorkflow() {

        this.answers = {};
        this.currentQuestion = 0;
        this.isSubmitted = false;
        clearAll();

    }

    restorePersistedState() {

        const session = loadSession();
        const maxQuestionIndex = Math.max(this.questionnaire.length - 1, 0);

        if (session?.isSubmitted) {
            const report = loadReport();

            if (report) {
                this.isSubmitted = true;
                this.currentQuestion = Math.min(
                    Math.max(session.currentQuestion ?? this.questionnaire.length - 1, 0),
                    maxQuestionIndex
                );

                return {
                    type: "restore-report",
                    report
                };
            }
        }

        if (session && !session.isSubmitted) {
            this.currentQuestion = Math.min(
                Math.max(session.currentQuestion ?? 0, 0),
                maxQuestionIndex
            );
        }

        if (hasIncompleteSession(this.answers, this.isSubmitted)) {
            return {
                type: "resume-prompt"
            };
        }

        return {
            type: "none"
        };

    }

    hasIncompleteSession() {

        return hasIncompleteSession(this.answers, this.isSubmitted);

    }

    completeAssessment() {

        saveAnswers(this.answers);
        this.isSubmitted = true;

        const assessment = generateAssessment(
            this.questionnaire,
            this.answers,
            this.responseScale
        );
        const report = createFinalReport(assessment, this.getReportContext());
        report.communityAnswerRecord = buildCommunityAnswerRecord(
            this.questionnaire,
            this.answers,
            this.responseScale,
            (question, index) => this.getQuestionKey(question, index)
        );

        saveReport(report);
        this.persistSession();

        saveSnapshot(report, {
            appVersion: APP_VERSION,
            contentVersion: this.contentVersion
        });

        this._invalidateGrowthCache();

        return report;

    }

    getDashboardPresentation(report) {

        const categories = report.assessment.categories;

        return {
            reportSections: buildReportSections(categories),
            insights: report.insights || createReportInsights(report.assessment, this.getReportContext()),
            rawScores: calculateRawScores(this.questionnaire, this.answers, this.responseScale)
        };

    }

    getHistoricalDashboardPresentation(report, snapshot) {

        return buildHistoricalDashboardPresentation(report, snapshot);

    }

    listAssessmentHistory() {

        return listSnapshots();

    }

    getHistoricalSnapshot(snapshotId) {

        return getSnapshot(snapshotId);

    }

    getHistoricalReport(snapshotId) {

        return getSnapshotReport(snapshotId);

    }

    deleteHistoricalSnapshot(snapshotId) {

        const result = deleteSnapshot(snapshotId);
        this._invalidateGrowthCache();

        return result;

    }

    clearAssessmentHistory() {

        const result = clearHistory();
        this._invalidateGrowthCache();

        return result;

    }

    _getCommunityInsightInput() {

        return {
            snapshots: listSnapshots(),
            questionnaire: this.questionnaire,
            responseScale: this.responseScale,
            getQuestionKey: (question, index) => this.getQuestionKey(question, index),
            getQuestionSection: (question) => this.getQuestionSection(question),
            loadHistoricalReport: (snapshotId) => getSnapshotReport(snapshotId)
        };

    }

    getMaiyaarInsights() {

        return computeMaiyaarInsights(this._getCommunityInsightInput());

    }

    getPracticeInsights() {

        return computePracticeInsights(this._getCommunityInsightInput());

    }

    getSectionInsights() {

        return computeSectionInsights(this._getCommunityInsightInput());

    }

    getImplementationTrends() {

        return computeImplementationTrends(this._getCommunityInsightInput());

    }

    getEducationalPriorities() {

        return computeEducationalPriorities(this._getCommunityInsightInput());

    }

    getTrendData() {

        return computeTrends(listSnapshots());

    }

    getSectionTrend(sectionId) {

        const trendResult = this.getTrendData();

        if (!isDomainSuccess(trendResult)) {
            return null;
        }

        return getSectionTrendFromResult(trendResult, sectionId);

    }

    getActionPlan() {

        return generateActionPlan(this.getTrendData());

    }

    getFeedback() {

        const { trendResult, actionPlanResult, reassessmentResult } = this._getGrowthPipeline();

        return generateFeedback(trendResult, actionPlanResult, reassessmentResult);

    }

    getSuggestedReassessment() {

        const trendResult = this.getTrendData();
        const actionPlanResult = generateActionPlan(trendResult);

        return computeSuggestedReassessment(trendResult, actionPlanResult);

    }

    getGrowthDashboard() {

        const {
            trendResult,
            actionPlanResult,
            reassessmentResult,
            feedbackResult
        } = this._getGrowthPipeline();

        return buildGrowthDashboard(
            trendResult,
            actionPlanResult,
            feedbackResult,
            reassessmentResult
        );

    }

    getDashboard() {

        const {
            trendResult,
            actionPlanResult,
            reassessmentResult,
            feedbackResult
        } = this._getGrowthPipeline();

        return buildPersonalDashboard(
            trendResult,
            actionPlanResult,
            feedbackResult,
            reassessmentResult,
            {
                hasIncompleteSession: this.hasIncompleteSession()
            }
        );

    }

    getGrowthTimeline() {

        const { trendResult, feedbackResult } = this._getGrowthPipeline();

        return buildGrowthTimeline(
            listSnapshots(),
            listJournalEntries(),
            trendResult,
            feedbackResult
        );

    }

    getJournal() {

        return createSuccess({
            schemaVersion: 1,
            computedAt: new Date().toISOString(),
            entries: listJournalEntries()
        });

    }

    saveJournalEntry(entry) {

        const result = saveJournalEntry(entry);
        this._invalidateGrowthCache();

        return result;

    }

    deleteJournalEntry(entryId) {

        const result = deleteJournalEntry(entryId);
        this._invalidateGrowthCache();

        return result;

    }

    getPersonalInsights() {

        const { trendResult, actionPlanResult, feedbackResult } = this._getGrowthPipeline();

        return buildPersonalInsights(trendResult, actionPlanResult, feedbackResult);

    }

    getReassessmentPlan() {

        const { trendResult, reassessmentResult } = this._getGrowthPipeline();

        return buildReassessmentPlan(reassessmentResult, trendResult);

    }

    advanceQuestion() {

        if (this.currentQuestion < this.questionnaire.length - 1) {
            this.currentQuestion += 1;
            this.persistSession();
            return "continue";
        }

        return "submit";

    }

    goToPreviousQuestion() {

        if (this.currentQuestion > 0) {
            this.currentQuestion -= 1;
            this.persistSession();
            return true;
        }

        return false;

    }

    isCurrentQuestionAnswered() {

        const question = this.questionnaire[this.currentQuestion];

        if (!question) {
            return true;
        }

        const questionKey = this.getQuestionKey(question, this.currentQuestion);

        return Object.prototype.hasOwnProperty.call(this.answers, questionKey);

    }

}

export const application = new ApplicationService();

export { ApplicationService };
