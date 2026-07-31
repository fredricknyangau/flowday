-- Migration 021: add timezone and day_boundary_hour to tenants
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    ADD COLUMN IF NOT EXISTS day_boundary_hour INTEGER NOT NULL DEFAULT 0
    CHECK (day_boundary_hour >= 0 AND day_boundary_hour <= 23);

-- Backfill default tenant to preserve live behavior (08:00 Africa/Nairobi)
UPDATE tenants
SET timezone = 'Africa/Nairobi',
    day_boundary_hour = 8
WHERE id = 'a0000000-0000-4000-8000-000000000001';
