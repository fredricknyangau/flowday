-- Migration 012: add tenant_id (NULLABLE) to all tenant-scoped tables
--
-- Nullable at this stage so the column can be added without touching existing
-- data.  Migration 014 will backfill the values; migration 015 will enforce
-- NOT NULL once every row has been assigned a tenant.
--
-- Tables covered:
--   clients, assignments, schedule_blocks, push_subscriptions    (primary tables)
--   assignment_status_log, schedule_block_logs                   (log/audit tables,
--                                                                 denormalized — no JOIN
--                                                                 needed for RLS)
--
-- Applied in production: DO NOT modify — add a new migration instead.

ALTER TABLE clients
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);

ALTER TABLE assignments
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);

ALTER TABLE schedule_blocks
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);

ALTER TABLE push_subscriptions
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Denormalized log tables: tenant_id copied at write time so RLS policies
-- on these tables never need to JOIN to determine ownership, which avoids
-- RLS bypass via SECURITY DEFINER functions and keeps policies simple and fast.
ALTER TABLE assignment_status_log
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);

ALTER TABLE schedule_block_logs
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);
