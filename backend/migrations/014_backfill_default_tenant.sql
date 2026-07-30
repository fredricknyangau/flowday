-- Migration 014: insert the default tenant and backfill all existing rows
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  DEFAULT TENANT UUID: a0000000-0000-4000-8000-000000000001               │
-- │                                                                           │
-- │  This is a deliberately non-random, human-memorable UUID chosen so it    │
-- │  is easy to identify in logs, queries, and error messages as "the         │
-- │  original single-tenant data."  It is NOT auto-generated to avoid any    │
-- │  ambiguity between environments (dev, staging, production all use the     │
-- │  same documented UUID for the bootstrap tenant).                          │
-- │                                                                           │
-- │  BEFORE RUNNING THIS MIGRATION IN PRODUCTION: confirm with the system     │
-- │  owner that this UUID is acceptable as the canonical identifier for the   │
-- │  existing client's data. If a different UUID is preferred, edit the       │
-- │  INSERT and UPDATE statements below BEFORE applying — changing it after   │
-- │  is possible but requires updating every FK reference.                    │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- Applied in production: DO NOT modify — add a new migration instead.

BEGIN;

-- Insert the default (bootstrap) tenant
INSERT INTO tenants (id, name, is_active)
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'Default Tenant',
    TRUE
);

-- Backfill all existing rows across every tenant-scoped table.
-- All existing data belongs to this single bootstrap tenant.

UPDATE clients
SET tenant_id = 'a0000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

UPDATE assignments
SET tenant_id = 'a0000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

UPDATE schedule_blocks
SET tenant_id = 'a0000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

UPDATE push_subscriptions
SET tenant_id = 'a0000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

-- Log/audit tables — denormalized tenant_id, same backfill logic
UPDATE assignment_status_log
SET tenant_id = 'a0000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

UPDATE schedule_block_logs
SET tenant_id = 'a0000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

-- Sanity check: verify no NULLs remain before we commit.
-- If any of these assertions fail, the transaction rolls back automatically.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM clients              WHERE tenant_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill incomplete: clients still has NULL tenant_id rows';
    END IF;
    IF EXISTS (SELECT 1 FROM assignments          WHERE tenant_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill incomplete: assignments still has NULL tenant_id rows';
    END IF;
    IF EXISTS (SELECT 1 FROM schedule_blocks      WHERE tenant_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill incomplete: schedule_blocks still has NULL tenant_id rows';
    END IF;
    IF EXISTS (SELECT 1 FROM push_subscriptions   WHERE tenant_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill incomplete: push_subscriptions still has NULL tenant_id rows';
    END IF;
    IF EXISTS (SELECT 1 FROM assignment_status_log WHERE tenant_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill incomplete: assignment_status_log still has NULL tenant_id rows';
    END IF;
    IF EXISTS (SELECT 1 FROM schedule_block_logs  WHERE tenant_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill incomplete: schedule_block_logs still has NULL tenant_id rows';
    END IF;
END $$;

COMMIT;
