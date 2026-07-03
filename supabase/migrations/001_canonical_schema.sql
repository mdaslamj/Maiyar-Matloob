-- Maiyar-e-Matloob — Canonical schema (Version 2.2 / Phase B)
-- Provider: Supabase PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- participants
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report JSONB NOT NULL,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    version TEXT NOT NULL DEFAULT 'unknown',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    schema_version INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- assessments
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- community analytics (storage only — domain calculates metrics)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- system / admin placeholders
-- ---------------------------------------------------------------------------
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
