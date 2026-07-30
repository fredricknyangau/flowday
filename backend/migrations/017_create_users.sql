-- Migration 017: create users table and backfill default admin user
--
-- Applied in production: DO NOT modify — add a new migration instead.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Users table is the global authentication registry (email is UNIQUE across tenants).
-- RLS is disabled on users so unauthenticated login calls can look up the user's
-- tenant_id by email before the JWT is issued.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON users;

-- Backfill default admin user for default tenant (password: 'password123')
-- PBKDF2-HMAC-SHA256 hash format: pbkdf2_sha256$100000$salt_hex$hash_hex
INSERT INTO users (id, tenant_id, email, password_hash, full_name)
VALUES (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'dev@flowday.app',
    'pbkdf2_sha256$100000$666c6f7764617973616c743132333435$c990b7978ebae5393d25816997cf2f9549f2b8429df340c2134591f4a9b6e864',
    'Default Admin'
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

COMMIT;
