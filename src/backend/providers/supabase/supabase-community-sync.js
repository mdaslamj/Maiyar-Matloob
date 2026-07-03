import { getSupabaseClient, isSupabaseReady } from "./supabase-client.js";
import { RESPONSE_BUCKETS } from "../../../trend/trend-community-config.js";

function bucketKeyForValue(value) {

    const match = RESPONSE_BUCKETS.find(bucket => bucket.value === Number(value));

    return match?.key || null;

}

export async function syncCommunityAnswerRecord(communityAnswerRecord, questionnaire = [], getQuestionSection) {

    if (!isSupabaseReady() || !communityAnswerRecord?.questionAnswers) {
        return { success: false, reason: "community-sync-skipped" };
    }

    const supabase = getSupabaseClient();
    const questionAnswers = communityAnswerRecord.questionAnswers;
    const sectionCounts = {};

    try {
        for (const [questionId, answerValue] of Object.entries(questionAnswers)) {
            const bucket = bucketKeyForValue(Number(answerValue));

            if (!bucket) {
                continue;
            }

            const { error } = await supabase.rpc("increment_community_question_counts", {
                p_question_id: questionId,
                p_bucket: bucket
            });

            if (error) {
                throw error;
            }

            const question = questionnaire.find(item => {
                const id = item.id || item.standardId;
                return id === questionId;
            });
            const sectionName = question ? getQuestionSection(question) : "General";

            if (!sectionCounts[sectionName]) {
                sectionCounts[sectionName] = {};
            }

            sectionCounts[sectionName][bucket] = (sectionCounts[sectionName][bucket] || 0) + 1;
        }

        for (const [sectionId, buckets] of Object.entries(sectionCounts)) {
            for (const [bucket, incrementValue] of Object.entries(buckets)) {
                const { error } = await supabase.rpc("increment_community_section_counts", {
                    p_section_id: sectionId,
                    p_title: sectionId,
                    p_bucket: bucket,
                    p_increment: incrementValue
                });

                if (error) {
                    throw error;
                }
            }
        }

        const { error: metaError } = await supabase.rpc("increment_community_meta_submissions");

        if (metaError) {
            throw metaError;
        }

        return {
            success: true,
            reason: "community-sync-complete",
            questionCount: Object.keys(questionAnswers).length
        };
    }
    catch (error) {
        console.warn("Community Supabase sync failed.", error);

        return {
            success: false,
            reason: "community-sync-failed",
            error: error?.message || String(error)
        };
    }

}

export const SupabaseCommunitySync = {
    syncCommunityAnswerRecord
};
