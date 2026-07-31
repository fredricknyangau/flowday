-- Migration 024: add paid_at to assignments
-- Tracks when money actually arrived, distinct from submitted_at (when work was delivered).
-- No backfill — all existing Submitted assignments correctly start as unpaid.
ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;
