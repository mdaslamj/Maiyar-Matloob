-- Phase B storage access policies.
-- NOTE: Permissive policies for storage-only phase (no Supabase Auth yet).
-- Replace with role-based policies when Identity phase is implemented.

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_section_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY participants_storage_phase_all
    ON participants FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY reports_storage_phase_all
    ON reports FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY assessments_storage_phase_all
    ON assessments FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY community_question_answers_storage_phase_all
    ON community_question_answers FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY community_section_aggregates_storage_phase_all
    ON community_section_aggregates FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY community_meta_storage_phase_all
    ON community_meta FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY system_versions_storage_phase_all
    ON system_versions FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY admin_dashboard_metrics_storage_phase_all
    ON admin_dashboard_metrics FOR ALL
    USING (true)
    WITH CHECK (true);
