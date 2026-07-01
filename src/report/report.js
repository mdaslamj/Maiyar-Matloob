import {
    calculateQuestionScore,
    getMaxScore,
    getPerformanceLevel,
    generateCategoryComment
} from "../assessment/assessment.js";

export const CANONICAL_REPORT_SECTIONS = [
    "عقیدہ و فکر",
    "تعلق باللہ و عبادات",
    "اسلامی فکر و طرزِ زندگی",
    "تزکیۂ نفس",
    "اخلاق و معاشرت",
    "دعوت و اقامتِ دین",
    "تنظیمی زندگی و استقامت",
    "جامع محاسبۂ نفس"
];

export const SECTION_ALIASES = {
    "عبادات": "تعلق باللہ و عبادات",
    "مقصدِ حیات": "اسلامی فکر و طرزِ زندگی",
    "تزکیۂ نفس": "تزکیۂ نفس",
    "معاملات و اخلاق": "اخلاق و معاشرت",
    "تنظیمی زندگی": "تنظیمی زندگی و استقامت"
};

export function getCanonicalSectionName(sectionName) {

    if (!sectionName) {
        return sectionName;
    }

    return SECTION_ALIASES[sectionName] || sectionName;

}

export function normalizeReportCategories(categories) {

    const merged = {};

    categories.forEach(category => {
        const canonicalTitle = getCanonicalSectionName(category.title);

        if (!merged[canonicalTitle]) {
            merged[canonicalTitle] = {
                id: canonicalTitle,
                title: canonicalTitle,
                raw: 0,
                max: 0
            };
        }

        merged[canonicalTitle].raw += category.raw;
        merged[canonicalTitle].max += category.max;
    });

    return Object.values(merged).map(entry => {
        const percentage = entry.max ? Number(((entry.raw / entry.max) * 100).toFixed(1)) : 0;
        const level = getPerformanceLevel(percentage);

        return {
            ...entry,
            percentage,
            level,
            comment: generateCategoryComment({ percentage, level })
        };
    });

}

export function getReportSectionHighlights(normalizedCategories) {

    if (!normalizedCategories.length) {
        return {
            strongestSection: null,
            growthSection: null
        };
    }

    const strongestSection = [...normalizedCategories].sort((a, b) => b.percentage - a.percentage)[0];
    const growthSection = [...normalizedCategories].sort((a, b) => a.percentage - b.percentage)[0];

    return {
        strongestSection,
        growthSection
    };

}

export function getDisplaySectionName(sectionName) {

    return getCanonicalSectionName(sectionName);

}

export function getOverallInterpretation(percentage) {

    if (percentage >= 90) {
        return "آپ کی مجموعی روحانی و اخلاقی سطح بہت مضبوط ہے۔ آپ کے اندر موجود بنیاد اور مسلسل کوششوں کی تاثیر واضح طور پر نظر آتی ہے۔";
    }

    if (percentage >= 75) {
        return "آپ کی مجموعی سطح اچھی ہے۔ تھوڑی سی مزید نظم اور مسلسل محاسبہ سے آپ اپنی ترقی کو اور زیادہ پختہ کر سکتے ہیں۔";
    }

    if (percentage >= 60) {
        return "آپ کی مجموعی سطح قابلِ قبول ہے۔ مزید توجہ اور باقاعدہ عمل سے آپ اپنی سطح کو اور بہتر بنا سکتے ہیں۔";
    }

    if (percentage >= 40) {
        return "آپ کی مجموعی سطح میں بہتری کی ضرورت ہے۔ ایک منظم اور باقاعدہ عمل سے آپ کی روحانی و اخلاقی تربیت میں واضح پیش رفت ممکن ہے۔";
    }

    return "آپ کی مجموعی سطح میں فوری اصلاح کی ضرورت ہے۔ چھوٹے مگر باقاعدہ اقدامات سے یہ تبدیلی شروع کی جا سکتی ہے۔";

}

export function getSectionInterpretation(sectionName, percentage) {

    if (percentage >= 90) {
        return `${sectionName} میں آپ کی سطح بہت مضبوط ہے۔ یہ شعبہ آپ کی موجودہ تربیت اور عادتوں کا ایک روشن ثبوت ہے۔`;
    }

    if (percentage >= 75) {
        return `${sectionName} میں آپ کی سطح اچھی ہے۔ چند مزید مسلسل کوششوں سے اس شعبے کو اور زیادہ پختہ کیا جا سکتا ہے۔`;
    }

    if (percentage >= 60) {
        return `${sectionName} میں آپ کی سطح قابلِ قبول ہے۔ نظم و ترتیب اور باقاعدہ توجہ سے اس میں مزید بہتری ممکن ہے۔`;
    }

    if (percentage >= 40) {
        return `${sectionName} میں مزید بہتری کی ضرورت ہے۔ اس شعبے میں عملی اور باقاعدہ تبدیلی آپ کے نتائج کو بہتر کر سکتی ہے۔`;
    }

    return `${sectionName} میں فوری توجہ کی ضرورت ہے۔ اس پر مسلسل محاسبہ اور واضح عملی قدم بہت مددگار ثابت ہوں گے۔`;

}

export function getStrongestAreaExplanation(sectionName, percentage) {

    return `${sectionName} آپ کے جوابوں میں سب سے زیادہ مضبوط شعبہ ظاہر ہوتا ہے۔ ${percentage}% کی سطح اس بات کی نشانی ہے کہ آپ اس میدان میں اچھی بنیاد رکھتے ہیں۔`;

}

export function getGrowthAreaExplanation(sectionName, percentage) {

    return `${sectionName} میں مزید ترقی کے لیے ایک منظم اور باقاعدہ کوشش ضروری ہے۔ ${percentage}% کی سطح اس شعبے کو توجہ اور عملی تبدیلی کی ضرورت دکھاتی ہے۔`;

}

export function getAnswerLabel(answerValue, responseScale) {

    const numericValue = Number(answerValue);
    const matchingOption = responseScale.find(option => Number(option.id) === numericValue);

    return matchingOption?.label || String(answerValue ?? "");

}

export function getQuestionInsightMetadata(question) {

    const explanation = question?.explanation || question?.reason || question?.whyItMatters || question?.insight;
    const improvement = question?.improvement || question?.practicalImprovement || question?.nextStep || question?.action;

    return {
        explanation: explanation || "یہ سوال اس شعبے میں موجود کمزور یا غیر منظم عادت کی نشاندہی کرتا ہے۔",
        improvement: improvement || "اس سوال کے مطابق ایک واضح اور عملی قدم اختیار کریں، جیسے کہ روزمرہ ایک مخصوص عادت کو نافذ کرنا۔"
    };

}

export function buildActionPlan(assessment, context) {

    const {
        questionnaire,
        answers,
        responseScale,
        getQuestionKey,
        getQuestionSection
    } = context;

    const questions = questionnaire.map((question, index) => {
        const questionKey = getQuestionKey(question, index);
        const answer = answers[questionKey];
        const score = answer == null ? 0 : calculateQuestionScore(question, answer, responseScale);
        const maxScore = getMaxScore(question, responseScale);
        const percentage = maxScore ? (score / maxScore) * 100 : 0;

        return {
            section: getQuestionSection(question),
            questionText: question.question,
            percentage: Number(percentage.toFixed(1))
        };
    });

    const sortedQuestions = [...questions].sort((a, b) => a.percentage - b.percentage);
    const sectionPriority = [...assessment.categories]
        .sort((a, b) => a.percentage - b.percentage)
        .filter(category => category.percentage < 100);

    const priorities = [];

    sectionPriority.forEach(category => {
        if (priorities.length >= 3) {
            return;
        }

        const sectionQuestions = questions.filter(item => item.section === category.title);
        const lowestQuestion = sectionQuestions.length
            ? sectionQuestions.reduce((worst, current) => current.percentage < worst.percentage ? current : worst, sectionQuestions[0])
            : null;

        if (!lowestQuestion) {
            return;
        }

        priorities.push(`اس شعبے میں ترقی کے لیے ${getDisplaySectionName(category.title)} پر عمل کرتے ہوئے ${lowestQuestion.questionText} کے بارے میں ایک واضح اور عملی قدم منتخب کریں۔`);
    });

    if (priorities.length < 3) {
        const remainingQuestions = sortedQuestions.filter(item => !priorities.some(priority => priority.includes(item.questionText)));

        remainingQuestions.slice(0, 3 - priorities.length).forEach(item => {
            priorities.push(`اپنی عادتوں کو مزید مضبوط بنانے کے لیے ${getDisplaySectionName(item.section)} کے موضوع پر ${item.questionText} سے شروع کرتے ہوئے ایک روزمرہ کا عملی قدم بنائیں۔`);
        });
    }

    return priorities.slice(0, 3);

}

export function buildGrowthQuestionGroups(context) {

    const {
        questionnaire,
        answers,
        responseScale,
        getQuestionKey,
        getQuestionSection
    } = context;

    const groupedQuestions = questionnaire
        .map((question, index) => {
            const questionKey = getQuestionKey(question, index);
            const answerValue = answers[questionKey];

            if (answerValue == null || Number(answerValue) >= 4) {
                return null;
            }

            if (Number(answerValue) > 2) {
                return null;
            }

            const score = calculateQuestionScore(question, answerValue, responseScale);
            const maxScore = getMaxScore(question, responseScale);
            const percentage = maxScore ? (score / maxScore) * 100 : 0;
            const insight = getQuestionInsightMetadata(question);

            return {
                section: getDisplaySectionName(getQuestionSection(question)),
                questionNumber: question.id || question.standardId || `Q${index + 1}`,
                questionText: question.question,
                selectedAnswer: getAnswerLabel(answerValue, responseScale),
                explanation: insight.explanation,
                improvement: insight.improvement,
                score: Number(percentage.toFixed(1)),
                answerValue: Number(answerValue)
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.answerValue - b.answerValue || a.score - b.score);

    const groups = [];

    groupedQuestions.forEach(question => {
        const existingGroup = groups.find(group => group.sectionName === question.section);

        if (existingGroup) {
            existingGroup.questions.push(question);
            return;
        }

        groups.push({
            sectionName: question.section,
            questions: [question]
        });
    });

    return groups;

}

export function createReportInsights(assessment, context) {

    const normalizedCategories = normalizeReportCategories(assessment.categories);
    const sectionInsights = normalizedCategories.map(category => ({
        ...category,
        interpretation: getSectionInterpretation(category.title, category.percentage)
    }));

    const { strongestSection, growthSection } = getReportSectionHighlights(normalizedCategories);

    return {
        overallSummary: getOverallInterpretation(assessment.overall.percentage),
        sections: sectionInsights,
        strongestSection,
        growthSection,
        strongestSectionExplanation: strongestSection ? getStrongestAreaExplanation(strongestSection.title, strongestSection.percentage) : "",
        growthSectionExplanation: growthSection ? getGrowthAreaExplanation(growthSection.title, growthSection.percentage) : "",
        actionPlan: buildActionPlan(assessment, context),
        growthQuestionGroups: buildGrowthQuestionGroups(context)
    };

}

export function detectStrengths(categories) {

    return categories.filter(category => category.percentage >= 75).map(category => ({
        id: category.id,
        title: category.title,
        percentage: category.percentage,
        level: category.level,
        comment: category.comment
    }));

}

export function detectWeaknesses(categories) {

    return categories.filter(category => category.percentage < 60).map(category => ({
        id: category.id,
        title: category.title,
        percentage: category.percentage,
        level: category.level,
        comment: category.comment
    }));

}

export function generateRecommendations(assessment, strengths, weaknesses) {

    const recommendations = [];

    if (assessment.overall.percentage < 60) {
        recommendations.push("اپنی روزمرہ کی عادتوں میں منظم اور گہری خودِ نگرانی شامل کریں۔");
    }

    weaknesses.forEach(item => {
        recommendations.push(`"${item.title}" کے شعبے میں مزید توجہ اور مسلسل محاسبہ رکھیں۔`);
    });

    strengths.forEach(item => {
        recommendations.push(`"${item.title}" کی اچھی سطح کو برقرار رکھنے کے لیے مسلسل عمل جاری رکھیں۔`);
    });

    return recommendations;

}

export function createFinalReport(assessment, context) {

    const strengths = detectStrengths(assessment.categories);
    const weaknesses = detectWeaknesses(assessment.categories);
    const insights = createReportInsights(assessment, context);

    return {
        assessment,
        strengths,
        weaknesses,
        recommendations: generateRecommendations(assessment, strengths, weaknesses),
        insights
    };

}

export function getReportSectionData(sectionName, normalizedCategories) {

    const fallbackCategory = {
        title: sectionName,
        percentage: 0,
        level: getPerformanceLevel(0),
        raw: 0,
        max: 0
    };

    const normalizedCategory = normalizedCategories.find(category => category.title === sectionName);

    if (normalizedCategory) {
        return {
            ...normalizedCategory,
            title: sectionName
        };
    }

    return fallbackCategory;

}

export function buildReportSections(categories) {

    const normalizedCategories = normalizeReportCategories(categories);

    return CANONICAL_REPORT_SECTIONS.map(sectionName => getReportSectionData(sectionName, normalizedCategories));

}
