/**
 * Structured sample data for the Admin Implementation Monitoring Dashboard.
 * Replace `loadAdminSampleData()` with Firestore queries without changing UI components.
 *
 * Future Firestore mapping:
 * - summary          → admin/summary
 * - overallDistribution → community/implementation/overall
 * - mostImplementedTeachings / leastImplementedTeachings → community/practices/ranked
 * - questions        → community/questions/{questionId}
 * - sections         → community/sections/{sectionId}
 * - trends           → community/trends/{trendId}
 * - participants     → admin/participants/{participantId}  (data key: users)
 * - settings         → admin/settings
 */

import { getCanonicalSectionName } from "../report/report.js";
import {
    buildImplementationBuckets,
    createEmptyDistribution,
    normalizeDistributionValues,
    RESPONSE_BUCKETS
} from "../trend/trend-community-config.js";
import {
    buildAdminInsightsPresentation,
    enrichAdminQuestionRecords
} from "../presentation/admin-section-presentation.js";

export const ADMIN_SAMPLE_SCHEMA_VERSION = 1;

/** @deprecated Use buildImplementationBuckets(questionnaire.responseScale) */
export const IMPLEMENTATION_BUCKETS = RESPONSE_BUCKETS;

const TEACHING_CATALOG = [
    { id: "truthfulness", name: "Truthfulness", profile: "strong" },
    { id: "five-daily-prayer", name: "Five Daily Prayers", profile: "strong" },
    { id: "helping-parents", name: "Helping Parents", profile: "strong" },
    { id: "greeting-others", name: "Greeting Others", profile: "strong" },
    { id: "keeping-promises", name: "Keeping Promises", profile: "strong" },
    { id: "honesty-in-trade", name: "Honesty in Trade", profile: "strong" },
    { id: "patience", name: "Patience", profile: "moderate" },
    { id: "forgiveness", name: "Forgiveness", profile: "moderate" },
    { id: "charity", name: "Regular Charity", profile: "moderate" },
    { id: "quran-recitation", name: "Qur'an Recitation", profile: "moderate" },
    { id: "tahajjud", name: "Tahajjud", profile: "weak" },
    { id: "quran-with-meaning", name: "Qur'an with Meaning", profile: "weak" },
    { id: "daily-reflection", name: "Daily Reflection", profile: "weak" },
    { id: "voluntary-fasting", name: "Voluntary Fasting", profile: "weak" },
    { id: "seeking-knowledge", name: "Seeking Knowledge", profile: "weak" },
    { id: "community-service", name: "Community Service", profile: "weak" },
    { id: "guarding-tongue", name: "Guarding the Tongue", profile: "weak" },
    { id: "time-discipline", name: "Time Discipline", profile: "moderate" }
];

const PROFILE_DISTRIBUTIONS = {
    strong: { always: 42, often: 31, sometimes: 16, never: 11 },
    moderate: { always: 24, often: 28, sometimes: 26, never: 22 },
    weak: { always: 11, often: 14, sometimes: 22, never: 53 }
};

const SAMPLE_USERS = [
    { id: "u001", name: "Ayesha Khan", email: "ayesha.khan@example.com", assessments: 4, lastAssessment: "2026-06-18", currentLevel: "Good", status: "active" },
    { id: "u002", name: "Muhammad Ali", email: "muhammad.ali@example.com", assessments: 3, lastAssessment: "2026-06-12", currentLevel: "Very Good", status: "active" },
    { id: "u003", name: "Fatima Ahmed", email: "fatima.ahmed@example.com", assessments: 2, lastAssessment: "2026-05-30", currentLevel: "Good", status: "active" },
    { id: "u004", name: "Omar Hassan", email: "omar.hassan@example.com", assessments: 1, lastAssessment: "2026-05-14", currentLevel: "Needs Improvement", status: "active" },
    { id: "u005", name: "Sara Malik", email: "sara.malik@example.com", assessments: 5, lastAssessment: "2026-06-22", currentLevel: "Excellent", status: "active" },
    { id: "u006", name: "Bilal Qureshi", email: "bilal.qureshi@example.com", assessments: 0, lastAssessment: null, currentLevel: "—", status: "invited" },
    { id: "u007", name: "Hina Siddiqui", email: "hina.siddiqui@example.com", assessments: 2, lastAssessment: "2026-04-08", currentLevel: "Needs Improvement", status: "inactive" },
    { id: "u008", name: "Yusuf Rahman", email: "yusuf.rahman@example.com", assessments: 3, lastAssessment: "2026-06-01", currentLevel: "Good", status: "active" }
];

const IMPLEMENTATION_TRENDS = [
    { id: "prayer", teachingName: "Prayer", direction: "up", summary: "Community prayer consistency is improving." },
    { id: "quran-reading", teachingName: "Qur'an Reading", direction: "down", summary: "Regular recitation needs renewed attention." },
    { id: "family-relations", teachingName: "Family Relations", direction: "up", summary: "Family care practices are strengthening." },
    { id: "truthfulness", teachingName: "Truthfulness", direction: "stable", summary: "Truthfulness remains consistently strong." },
    { id: "charity", teachingName: "Charity", direction: "up", summary: "Charitable habits are gradually increasing." },
    { id: "daily-reflection", teachingName: "Daily Reflection", direction: "down", summary: "Reflection practice has softened recently." },
    { id: "patience", teachingName: "Patience", direction: "stable", summary: "Patience levels are holding steady." },
    { id: "seeking-knowledge", teachingName: "Seeking Knowledge", direction: "up", summary: "Learning efforts are trending upward." }
];

function shiftDistribution(base, offset, buckets) {

    const shifted = { ...base };
    const keys = buckets.map(bucket => bucket.key);
    const fromIndex = Math.abs(offset) % keys.length;
    const toIndex = (fromIndex + 1) % keys.length;
    const amount = 3 + (Math.abs(offset) % 4);

    shifted[keys[fromIndex]] = Math.max(0, shifted[keys[fromIndex]] - amount);
    shifted[keys[toIndex]] = shifted[keys[toIndex]] + amount;

    return normalizeDistribution(shifted, buckets);

}

function normalizeDistribution(distribution, buckets) {

    return normalizeDistributionValues(distribution, buckets);

}

function positiveRate(distribution) {

    return Number(((distribution.always || 0) + (distribution.often || 0)).toFixed(1));

}

function buildTeachingRankings() {

    return TEACHING_CATALOG.map(teaching => {
        const distribution = PROFILE_DISTRIBUTIONS[teaching.profile];

        return {
            id: teaching.id,
            name: teaching.name,
            distribution,
            positiveRate: positiveRate(distribution)
        };
    });

}

function buildQuestionImplementation(question, index, buckets) {

    const profile = index % 5 === 0 ? "weak" : index % 3 === 0 ? "moderate" : "strong";
    const distribution = shiftDistribution(PROFILE_DISTRIBUTIONS[profile], index % 7, buckets);

    return {
        questionId: question.id,
        standardId: question.standardId || question.id,
        section: getCanonicalSectionName(question.section),
        category: question.category || question.section,
        questionText: question.question,
        distribution,
        positiveRate: positiveRate(distribution)
    };

}

function buildSectionImplementation(questions, buckets) {

    const sections = {};

    questions.forEach(question => {
        if (!sections[question.section]) {
            sections[question.section] = {
                sectionId: question.section,
                sectionTitle: question.section,
                questionCount: 0,
                distribution: createEmptyDistribution(buckets)
            };
        }

        const section = sections[question.section];
        section.questionCount += 1;

        buckets.forEach(bucket => {
            section.distribution[bucket.key] += question.distribution[bucket.key];
        });
    });

    return Object.values(sections).map(section => {
        const count = section.questionCount || 1;
        const distribution = {};

        buckets.forEach(bucket => {
            distribution[bucket.key] = Number((section.distribution[bucket.key] / count).toFixed(1));
        });

        return {
            sectionId: section.sectionId,
            sectionTitle: section.sectionTitle,
            questionCount: section.questionCount,
            distribution,
            positiveRate: positiveRate(distribution)
        };
    });

}

function buildOverallDistribution(questions, buckets) {

    const totals = createEmptyDistribution(buckets);

    questions.forEach(question => {
        buckets.forEach(bucket => {
            totals[bucket.key] += question.distribution[bucket.key];
        });
    });

    const count = questions.length || 1;
    const distribution = {};

    buckets.forEach(bucket => {
        distribution[bucket.key] = Number((totals[bucket.key] / count).toFixed(1));
    });

    return distribution;

}

function buildSummary(sections, users) {

    const improving = sections.filter(section => section.positiveRate >= 62).length;
    const declining = sections.filter(section => section.positiveRate < 52).length;
    const completedAssessments = users.reduce((sum, user) => sum + user.assessments, 0);

    return {
        totalParticipants: users.length,
        activeParticipants: users.filter(participant => participant.status === "active").length,
        completedAssessments,
        averageImplementation: 58.4,
        latestAssessmentDate: "2026-06-22",
        averageAssessmentFrequencyDays: 28,
        sectionsImproving: improving,
        sectionsDeclining: declining
    };

}

function buildSettings() {

    return {
        application: {
            title: "Maiyar-e-Matloob",
            studentEntry: "index.html",
            adminEntry: "admin.html",
            environment: "local-sample"
        },
        firebase: {
            status: "not-connected",
            authentication: "pending",
            firestore: "pending",
            note: "Backend integration will be enabled in a future release."
        },
        exports: {
            csv: "planned",
            pdf: "planned",
            scheduledReports: "planned"
        },
        security: {
            adminAccess: "future-authentication-required",
            roleModel: "admin | student",
            auditLog: "planned"
        },
        version: {
            adminModule: "2.2.1",
            studentApplication: "2.1.6",
            sampleDataSchema: ADMIN_SAMPLE_SCHEMA_VERSION
        },
        about: {
            purpose: "Monitor community implementation of Maiyar-e-Matloob teachings.",
            privacy: "Anonymous aggregated implementation data only. No individual answers are shown."
        }
    };

}

function buildSampleDataFromQuestionnaire(questionnaire) {

    const implementationBuckets = buildImplementationBuckets(questionnaire?.responseScale);
    const questions = enrichAdminQuestionRecords(
        questionnaire,
        (questionnaire?.questions || []).map((question, index) => (
            buildQuestionImplementation(question, index, implementationBuckets)
        ))
    );
    const sections = buildSectionImplementation(questions, implementationBuckets);
    const teachings = buildTeachingRankings();
    const mostImplementedTeachings = [...teachings]
        .sort((left, right) => right.positiveRate - left.positiveRate)
        .slice(0, 10);
    const leastImplementedTeachings = [...teachings]
        .sort((left, right) => left.positiveRate - right.positiveRate)
        .slice(0, 10);
    const baseData = {
        schemaVersion: ADMIN_SAMPLE_SCHEMA_VERSION,
        implementationBuckets,
        summary: buildSummary(sections, SAMPLE_USERS),
        overallDistribution: buildOverallDistribution(questions, implementationBuckets),
        mostImplementedTeachings,
        leastImplementedTeachings,
        questions,
        sections,
        trends: IMPLEMENTATION_TRENDS,
        users: SAMPLE_USERS,
        settings: buildSettings()
    };
    const hierarchical = buildAdminInsightsPresentation({
        questionnaire,
        questions: baseData.questions,
        sections: baseData.sections,
        mostImplementedTeachings: baseData.mostImplementedTeachings,
        leastImplementedTeachings: baseData.leastImplementedTeachings,
        trends: baseData.trends,
        implementationBuckets
    });

    return {
        ...baseData,
        sections: hierarchical.sections,
        questions: hierarchical.questions,
        mostImplementedTeachings: hierarchical.mostImplementedTeachings,
        leastImplementedTeachings: hierarchical.leastImplementedTeachings,
        trends: hierarchical.trends,
        sectionHierarchy: hierarchical.hierarchy
    };

}

const FALLBACK_SAMPLE_DATA = buildSampleDataFromQuestionnaire({ questions: [] });

/**
 * Load admin dashboard data. Uses questionnaire.json for question text when available.
 * @returns {Promise<object>}
 */
export async function loadAdminSampleData() {

    try {
        const response = await fetch("questionnaire.json");

        if (!response.ok) {
            return FALLBACK_SAMPLE_DATA;
        }

        const questionnaire = await response.json();

        return buildSampleDataFromQuestionnaire(questionnaire);

    }
    catch (error) {
        console.warn("Admin sample data fallback:", error);
        return FALLBACK_SAMPLE_DATA;
    }

}

export const AdminSampleData = {
    IMPLEMENTATION_BUCKETS,
    loadAdminSampleData
};
