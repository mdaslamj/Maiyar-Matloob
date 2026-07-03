-- Version 2.3.1 — Atomic assessment persistence (report + assessment in one transaction).
-- Eliminates orphan report rows when assessment insert fails.

CREATE OR REPLACE FUNCTION persist_assessment_submission(
    p_report JSONB,
    p_assessment JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_report_id UUID;
    v_assessment_id UUID;
BEGIN
    INSERT INTO reports (report, summary, version, metadata, schema_version)
    VALUES (
        p_report -> 'report',
        COALESCE(p_report -> 'summary', '{}'::jsonb),
        COALESCE(p_report ->> 'version', 'unknown'),
        COALESCE(p_report -> 'metadata', '{}'::jsonb),
        COALESCE((p_report ->> 'schema_version')::INTEGER, 1)
    )
    RETURNING id INTO v_report_id;

    INSERT INTO assessments (
        id,
        participant_id,
        report_id,
        captured_at,
        timestamp,
        app_version,
        content_version,
        overall_percentage,
        overall_level,
        implementation_score,
        section_scores,
        community_answer_record,
        schema_version
    )
    VALUES (
        (p_assessment ->> 'id')::UUID,
        p_assessment ->> 'participant_id',
        v_report_id,
        (p_assessment ->> 'captured_at')::TIMESTAMPTZ,
        COALESCE(
            (p_assessment ->> 'timestamp')::TIMESTAMPTZ,
            (p_assessment ->> 'captured_at')::TIMESTAMPTZ,
            NOW()
        ),
        COALESCE(p_assessment ->> 'app_version', 'unknown'),
        COALESCE(p_assessment ->> 'content_version', 'unknown'),
        NULLIF(p_assessment ->> 'overall_percentage', '')::NUMERIC,
        NULLIF(p_assessment ->> 'overall_level', ''),
        NULLIF(p_assessment ->> 'implementation_score', '')::NUMERIC,
        COALESCE(p_assessment -> 'section_scores', '[]'::jsonb),
        p_assessment -> 'community_answer_record',
        COALESCE((p_assessment ->> 'schema_version')::INTEGER, 1)
    )
    RETURNING id INTO v_assessment_id;

    RETURN jsonb_build_object(
        'report_id', v_report_id,
        'assessment_id', v_assessment_id
    );
END;
$$;
