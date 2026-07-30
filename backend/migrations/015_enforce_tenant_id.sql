-- Migration 015: enforce NOT NULL on tenant_id; add indexes; rescope schedule_blocks constraint
--
-- Prerequisite: migration 014 must have completed with zero NULL tenant_id rows
-- across all six tables. The DO block at the end of 014 asserts this.
--
-- Applied in production: DO NOT modify — add a new migration instead.

BEGIN;

-- ── NOT NULL enforcement ───────────────────────────────────────────────────

ALTER TABLE clients
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE assignments
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE schedule_blocks
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE push_subscriptions
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE assignment_status_log
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE schedule_block_logs
    ALTER COLUMN tenant_id SET NOT NULL;

-- ── Drop obsolete single-tenant indexes ───────────────────────────────────
--
-- These indexes were created in migration 005 without a tenant_id prefix.
-- Now that every query filters on tenant_id first, these indexes provide
-- no useful selectivity benefit and add unnecessary write overhead on every
-- INSERT/UPDATE.  They are replaced by the composite indexes below.

DROP INDEX IF EXISTS idx_assignments_deadline;   -- replaced by idx_assignments_tenant_deadline
DROP INDEX IF EXISTS idx_schedule_blocks_sort;   -- replaced by idx_schedule_blocks_tenant_start

-- ── Tenant-scoped indexes ──────────────────────────────────────────────────

-- clients
CREATE INDEX idx_clients_tenant_id
    ON clients(tenant_id);

-- assignments — basic tenant scan
CREATE INDEX idx_assignments_tenant_id
    ON assignments(tenant_id);

-- assignments — composite hot path: tenant + deadline (list/today queries)
-- Partial index mirrors the existing active-not-terminal filter pattern.
CREATE INDEX idx_assignments_tenant_deadline
    ON assignments(tenant_id, deadline)
    WHERE is_active = TRUE AND status NOT IN ('Submitted', 'Cancelled');

-- schedule_blocks — basic tenant scan
CREATE INDEX idx_schedule_blocks_tenant_id
    ON schedule_blocks(tenant_id);

-- schedule_blocks — composite hot path: tenant + start_time (list query)
CREATE INDEX idx_schedule_blocks_tenant_start
    ON schedule_blocks(tenant_id, start_time)
    WHERE is_active = TRUE;

-- log / audit tables
CREATE INDEX idx_status_log_tenant_id
    ON assignment_status_log(tenant_id);

CREATE INDEX idx_schedule_block_logs_tenant
    ON schedule_block_logs(tenant_id);

-- push_subscriptions
CREATE INDEX idx_push_subscriptions_tenant
    ON push_subscriptions(tenant_id);

-- ── Rescoped schedule_blocks uniqueness constraint ─────────────────────────
--
-- Replaces the single-tenant uq_schedule_blocks_time_label (dropped in 013)
-- with a per-tenant constraint. Now that tenant_id is NOT NULL on every row,
-- this constraint is both meaningful and enforceable.

-- Clean up any pre-existing duplicate (tenant_id, start_time, label) rows
-- before creating the unique constraint, keeping the oldest row for each pair.
DELETE FROM schedule_blocks
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY tenant_id, start_time, label
            ORDER BY created_at ASC, id ASC
        ) as row_num
        FROM schedule_blocks
    ) t
    WHERE t.row_num > 1
);

ALTER TABLE schedule_blocks
    ADD CONSTRAINT uq_schedule_blocks_tenant_time_label
    UNIQUE (tenant_id, start_time, label);

COMMIT;
