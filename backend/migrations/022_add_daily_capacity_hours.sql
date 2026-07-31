-- Migration 022: add daily_capacity_hours to tenants
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS daily_capacity_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.0
    CHECK (daily_capacity_hours > 0);
