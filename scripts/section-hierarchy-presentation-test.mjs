/**
 * Section hierarchy presentation tests.
 *
 * Usage:
 *   node scripts/section-hierarchy-presentation-test.mjs
 */

import { readFileSync } from "node:fs";
import { buildQuestionnaireHierarchy } from "../src/presentation/section-hierarchy.js";
import { buildReportSectionPresentation } from "../src/presentation/report-section-presentation.js";
import {
    buildAdminInsightsPresentation,
    buildAdminTrendPresentation
} from "../src/presentation/admin-section-presentation.js";
import { buildReportSections, createReportInsights } from "../src/report/report.js";
import { generateAssessment } from "../src/assessment/assessment.js";

function assert(condition, message) {

    if (!condition) {
        throw new Error(message);
    }

}

function loadQuestionnaire() {

    return JSON.parse(readFileSync(new URL("../questionnaire.json", import.meta.url), "utf8"));

}

function testQuestionnaireHierarchy() {

    const questionnaire = loadQuestionnaire();
    const hierarchy = buildQuestionnaireHierarchy(questionnaire);

    assert(hierarchy.sections.length === 8, "canonical section count");
    assert(hierarchy.sections[0].categories.length >= 1, "section contains categories");
    assert(
        hierarchy.sections.some(section => section.categories.length > 1),
        "at least one section has multiple categories"
    );

    console.log("questionnaire hierarchy tests: PASS");

}

function testReportPresentation() {

    const questionnaire = loadQuestionnaire().questions;
    const answers = Object.fromEntries(questionnaire.map((question, index) => [
        question.id || `q-${index}`,
        index % 4 === 0 ? 1 : 4
    ]));
    const responseScale = [
        { id: 1, label: "کبھی نہیں", value: 1 },
        { id: 2, label: "کبھی کبھار", value: 2 },
        { id: 3, label: "اکثر", value: 3 },
        { id: 4, label: "ہمیشہ", value: 4 }
    ];
    const assessment = generateAssessment(questionnaire, answers, responseScale);
    const reportSections = buildReportSections(assessment.categories);
    const insights = createReportInsights(assessment, {
        questionnaire,
        answers,
        responseScale,
        getQuestionKey: question => question.id,
        getQuestionSection: question => question.section || question.category
    });
    const presentation = buildReportSectionPresentation({
        questionnaire,
        reportSections,
        insights,
        strengths: [],
        weaknesses: [],
        recommendations: [],
        growthQuestionGroups: insights.growthQuestionGroups
    });

    assert(presentation.sections.length === 8, "report presentation section count");
    assert(
        presentation.sections.every(section => Array.isArray(section.categories)),
        "report sections expose categories"
    );
    assert(
        presentation.sections.some(section => section.categories.some(category => category.growthQuestions.length)),
        "growth questions grouped under categories"
    );

    console.log("report presentation tests: PASS");

}

function testAdminPresentation() {

    const questionnaire = loadQuestionnaire();
    const questions = questionnaire.questions.map((question, index) => ({
        questionId: question.id,
        standardId: question.standardId,
        section: question.section,
        category: question.category,
        questionText: question.question,
        distribution: { always: 20, often: 20, sometimes: 20, rarely: 20, never: 20 },
        positiveRate: 40
    }));
    const sections = questions.reduce((map, question) => {
        if (!map[question.section]) {
            map[question.section] = {
                sectionId: question.section,
                sectionTitle: question.section,
                questionCount: 0,
                distribution: { always: 0, often: 0, sometimes: 0, rarely: 0, never: 0 },
                positiveRate: 40
            };
        }

        map[question.section].questionCount += 1;
        return map;
    }, {});
    const adminPresentation = buildAdminInsightsPresentation({
        questionnaire,
        questions,
        sections: Object.values(sections)
    });
    const trends = buildAdminTrendPresentation({
        questionnaire,
        hierarchicalSections: adminPresentation.sections
    });

    assert(adminPresentation.sections.length === 8, "admin hierarchical section count");
    assert(
        adminPresentation.sections.every(section => section.categories.length >= 1),
        "admin sections contain categories"
    );
    assert(trends.length === 8, "admin trend section groups");
    assert(trends[0].categories.length >= 1, "admin trend categories");

    console.log("admin presentation tests: PASS");

}

function main() {

    testQuestionnaireHierarchy();
    testReportPresentation();
    testAdminPresentation();
    console.log("Section hierarchy presentation tests completed.");

}

main();
