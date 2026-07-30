-- Migration 019: Sync demo user credentials
BEGIN;

INSERT INTO tenants (id, name, is_active)
VALUES ('a0000000-0000-4000-8000-000000000001', 'Default Tenant', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, email, password_hash, full_name)
VALUES (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'dev@flowday.app',
    'pbkdf2_sha256$100000$666c6f7764617973616c743132333435$c990b7978ebae5393d25816997cf2f9549f2b8429df340c2134591f4a9b6e864',
    'Default Admin'
)
ON CONFLICT (email) DO NOTHING;

COMMIT;
