-- Migration 020: Rename clients to contexts and add context_type
BEGIN;

-- 1. Rename table clients -> contexts
ALTER TABLE clients RENAME TO contexts;

-- 2. Add context_type column with default 'Client'
ALTER TABLE contexts
    ADD COLUMN context_type VARCHAR(20) NOT NULL DEFAULT 'Client'
    CHECK (context_type IN ('Client', 'Employer', 'Academic', 'Personal', 'Other'));

-- 3. Rename index on contexts
ALTER INDEX idx_clients_tenant_id RENAME TO idx_contexts_tenant_id;

-- 4. Rename column client_id -> context_id on assignments
ALTER TABLE assignments RENAME COLUMN client_id TO context_id;

-- 5. Rename FK constraint on assignments
ALTER TABLE assignments RENAME CONSTRAINT assignments_client_id_fkey TO assignments_context_id_fkey;

-- 6. Rename index on assignments(client_id) if it exists
ALTER INDEX IF EXISTS idx_assignments_client_id RENAME TO idx_assignments_context_id;

COMMIT;
