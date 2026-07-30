-- Migration 018: create assignment_subtasks table with RLS
BEGIN;

CREATE TABLE IF NOT EXISTS assignment_subtasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_subtasks_tenant_assignment
    ON assignment_subtasks(tenant_id, assignment_id);

ALTER TABLE assignment_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_subtasks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON assignment_subtasks;
CREATE POLICY tenant_isolation ON assignment_subtasks
    USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);

COMMIT;
