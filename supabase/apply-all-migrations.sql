-- Maiyar-e-Matloob — Apply migrations 001 → 004 (Option A)
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- Project: https://cfbdzxmobbnihdqtetdu.supabase.co

-- ===========================================================================
-- 001_canonical_schema.sql
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    local_participant_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    mobile TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_assessment_at TIMESTAMPTZ,
    assessment_count INTEGER NOT NULL DEFAULT 0 CHECK (assessment_count >= 0),
    schema_version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS participants_local_participant_id_idx
    ON participants (local_participant_id);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report JSONB NOT NULL,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    version TEXT NOT NULL DEFAULT 'unknown',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id TEXT NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES reports (id) ON DELETE RESTRICT,
    captured_at TIMESTAMPTZ NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    app_version TEXT NOT NULL DEFAULT 'unknown',
    content_version TEXT NOT NULL DEFAULT 'unknown',
    overall_percentage NUMERIC(5, 1),
    overall_level TEXT,
    implementation_score NUMERIC(5, 1),
    section_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    community_answer_record JSONB,
    schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS assessments_timestamp_desc_idx
    ON assessments (timestamp DESC);

CREATE INDEX IF NOT EXISTS assessments_participant_timestamp_idx
    ON assessments (participant_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS community_question_answers (
    question_id TEXT PRIMARY KEY,
    counts JSONB NOT NULL DEFAULT '{"always":0,"often":0,"sometimes":0,"never":0,"total":0}'::jsonb,
    schema_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_section_aggregates (
    section_id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    counts JSONB NOT NULL DEFAULT '{"always":0,"often":0,"sometimes":0,"never":0,"total":0}'::jsonb,
    schema_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_meta (
    id TEXT PRIMARY KEY DEFAULT 'default',
    total_submissions BIGINT NOT NULL DEFAULT 0 CHECK (total_submissions >= 0),
    schema_version INTEGER NOT NULL DEFAULT 1,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO community_meta (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS system_versions (
    id TEXT PRIMARY KEY DEFAULT 'default',
    last_client_app_version TEXT NOT NULL DEFAULT 'unknown',
    last_client_content_version TEXT NOT NULL DEFAULT 'unknown',
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_participant_id TEXT,
    schema_version INTEGER NOT NULL DEFAULT 1
);

INSERT INTO system_versions (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_dashboard_metrics (
    id TEXT PRIMARY KEY DEFAULT 'default',
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    schema_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO admin_dashboard_metrics (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- 002_storage_phase_rls.sql
-- ===========================================================================

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_section_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS participants_storage_phase_all ON participants;
CREATE POLICY participants_storage_phase_all
    ON participants FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS reports_storage_phase_all ON reports;
CREATE POLICY reports_storage_phase_all
    ON reports FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS assessments_storage_phase_all ON assessments;
CREATE POLICY assessments_storage_phase_all
    ON assessments FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS community_question_answers_storage_phase_all ON community_question_answers;
CREATE POLICY community_question_answers_storage_phase_all
    ON community_question_answers FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS community_section_aggregates_storage_phase_all ON community_section_aggregates;
CREATE POLICY community_section_aggregates_storage_phase_all
    ON community_section_aggregates FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS community_meta_storage_phase_all ON community_meta;
CREATE POLICY community_meta_storage_phase_all
    ON community_meta FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS system_versions_storage_phase_all ON system_versions;
CREATE POLICY system_versions_storage_phase_all
    ON system_versions FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_dashboard_metrics_storage_phase_all ON admin_dashboard_metrics;
CREATE POLICY admin_dashboard_metrics_storage_phase_all
    ON admin_dashboard_metrics FOR ALL
    USING (true)
    WITH CHECK (true);

-- ===========================================================================
-- 003_community_increment_rpcs.sql
-- ===========================================================================

CREATE OR REPLACE FUNCTION increment_community_question_counts(
    p_question_id TEXT,
    p_bucket TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    valid_buckets TEXT[] := ARRAY['always', 'often', 'sometimes', 'never'];
BEGIN
    IF NOT (p_bucket = ANY (valid_buckets)) THEN
        RAISE EXCEPTION 'Invalid bucket: %', p_bucket;
    END IF;

    INSERT INTO community_question_answers (question_id, counts, updated_at)
    VALUES (
        p_question_id,
        jsonb_build_object(
            'always', CASE WHEN p_bucket = 'always' THEN 1 ELSE 0 END,
            'often', CASE WHEN p_bucket = 'often' THEN 1 ELSE 0 END,
            'sometimes', CASE WHEN p_bucket = 'sometimes' THEN 1 ELSE 0 END,
            'never', CASE WHEN p_bucket = 'never' THEN 1 ELSE 0 END,
            'total', 1
        ),
        NOW()
    )
    ON CONFLICT (question_id) DO UPDATE
    SET counts = jsonb_set(
            jsonb_set(
                community_question_answers.counts,
                ARRAY[p_bucket],
                to_jsonb(COALESCE((community_question_answers.counts ->> p_bucket)::INTEGER, 0) + 1)
            ),
            ARRAY['total'],
            to_jsonb(COALESCE((community_question_answers.counts ->> 'total')::INTEGER, 0) + 1)
        ),
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION increment_community_section_counts(
    p_section_id TEXT,
    p_title TEXT,
    p_bucket TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    valid_buckets TEXT[] := ARRAY['always', 'often', 'sometimes', 'never'];
BEGIN
    IF NOT (p_bucket = ANY (valid_buckets)) THEN
        RAISE EXCEPTION 'Invalid bucket: %', p_bucket;
    END IF;

    IF p_increment IS NULL OR p_increment < 1 THEN
        RAISE EXCEPTION 'Increment must be >= 1';
    END IF;

    INSERT INTO community_section_aggregates (section_id, title, counts, updated_at)
    VALUES (
        p_section_id,
        COALESCE(p_title, p_section_id),
        jsonb_build_object(
            'always', CASE WHEN p_bucket = 'always' THEN p_increment ELSE 0 END,
            'often', CASE WHEN p_bucket = 'often' THEN p_increment ELSE 0 END,
            'sometimes', CASE WHEN p_bucket = 'sometimes' THEN p_increment ELSE 0 END,
            'never', CASE WHEN p_bucket = 'never' THEN p_increment ELSE 0 END,
            'total', p_increment
        ),
        NOW()
    )
    ON CONFLICT (section_id) DO UPDATE
    SET title = EXCLUDED.title,
        counts = jsonb_set(
            jsonb_set(
                community_section_aggregates.counts,
                ARRAY[p_bucket],
                to_jsonb(COALESCE((community_section_aggregates.counts ->> p_bucket)::INTEGER, 0) + p_increment)
            ),
            ARRAY['total'],
            to_jsonb(COALESCE((community_section_aggregates.counts ->> 'total')::INTEGER, 0) + p_increment)
        ),
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION increment_community_meta_submissions()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO community_meta (id, total_submissions, last_updated_at)
    VALUES ('default', 1, NOW())
    ON CONFLICT (id) DO UPDATE
    SET total_submissions = community_meta.total_submissions + 1,
        last_updated_at = NOW();
END;
$$;

-- ===========================================================================
-- 004_atomic_assessment_persistence.sql
-- ===========================================================================

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

-- ===========================================================================
-- API grants (required for frontend anon/publishable key)
-- ===========================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
