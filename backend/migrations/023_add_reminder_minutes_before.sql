-- Migration 023: add configurable push-notification reminder lead time
-- • tenants.reminder_minutes_before  – workspace default (preserves existing 120 min behaviour)
-- • assignments.reminder_minutes_before – optional per-assignment override; NULL means use tenant default

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER NOT NULL DEFAULT 120
    CHECK (reminder_minutes_before > 0);

ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT NULL
    CHECK (reminder_minutes_before > 0);
