-- Atomic community aggregate increments (storage operation only).

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
