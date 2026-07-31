-- Apply migration 024: paid_at on assignments
ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;
