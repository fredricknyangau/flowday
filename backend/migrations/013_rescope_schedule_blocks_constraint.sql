-- Migration 013: rescope the schedule_blocks uniqueness constraint for multi-tenancy
--
-- Context: migration 010 added UNIQUE (start_time, label) to prevent duplicate
-- schedule block seeding. That constraint is now WRONG for multi-tenancy —
-- only one tenant in the entire system could ever have a "READING BLOCK" at 09:30,
-- because the uniqueness is global rather than per-tenant.
--
-- This migration drops the old constraint. The replacement constraint —
-- UNIQUE (tenant_id, start_time, label) — is added in migration 015, after
-- tenant_id has been backfilled (015 also enforces NOT NULL, at which point
-- the composite unique constraint becomes meaningful and correct).
--
-- Applied in production: DO NOT modify — add a new migration instead.

ALTER TABLE schedule_blocks
    DROP CONSTRAINT IF EXISTS uq_schedule_blocks_time_label;

-- Note: do NOT add the tenant-scoped replacement here. The new constraint
-- requires tenant_id to be non-null on every row, which is only guaranteed
-- after migration 014 (backfill) and 015 (NOT NULL enforcement).
-- See migration 015 for: UNIQUE (tenant_id, start_time, label).
