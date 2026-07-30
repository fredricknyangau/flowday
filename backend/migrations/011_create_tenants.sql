-- Migration 011: create the tenants table
--
-- Every tenant row represents one isolated customer workspace.
-- All tenant-scoped tables reference this table via tenant_id FK.
--
-- Applied in production: DO NOT modify — add a new migration instead.

CREATE TABLE tenants (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200)  NOT NULL,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
