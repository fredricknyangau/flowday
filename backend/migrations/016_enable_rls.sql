-- Migration 016: enable Row Level Security on all tenant-scoped tables
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  CRITICAL MANUAL PRE-FLIGHT — READ BEFORE RUNNING IN PRODUCTION          │
-- │                                                                           │
-- │  1. BYPASSRLS / superuser check                                           │
-- │     RLS policies are silently ignored for superusers and any role with   │
-- │     the BYPASSRLS attribute.  Run this as the *connecting app role*:     │
-- │       SELECT current_role, rolbypassrls, rolsuper                        │
-- │         FROM pg_roles WHERE rolname = current_role;                      │
-- │     Both must be FALSE.                                                   │
-- │                                                                           │
-- │  2. Table owner check — FORCE ROW LEVEL SECURITY matters here            │
-- │     ENABLE ROW LEVEL SECURITY alone is not enough: the role that *owns*  │
-- │     the table bypasses RLS by default, even without BYPASSRLS or         │
-- │     superuser.  FORCE ROW LEVEL SECURITY overrides this, making RLS      │
-- │     apply to the owner role too — which is why every table below gets    │
-- │     both ENABLE and FORCE.                                                │
-- │                                                                           │
-- │     If your Railway connection role *owns* the tables (likely on a       │
-- │     simple single-role setup where the same role ran all migrations),     │
-- │     FORCE is what makes RLS actually enforce. Verify with:               │
-- │       SELECT tableowner FROM pg_tables                                    │
-- │         WHERE tablename IN ('clients','assignments','schedule_blocks',    │
-- │                              'push_subscriptions',                        │
-- │                              'assignment_status_log',                     │
-- │                              'schedule_block_logs');                      │
-- │                                                                           │
-- │  3. Smoke test after applying (run as the connecting app role):           │
-- │     SET app.tenant_id = '<a UUID that owns ZERO rows in clients>';        │
-- │     SELECT count(*) FROM clients;   -- must return 0                      │
-- │     If it returns > 0, RLS is not enforcing. Stop and investigate         │
-- │     before proceeding.                                                    │
-- │                                                                           │
-- │  4. Health-check query                                                    │
-- │     The /health endpoint has been updated to use SELECT to_regclass(...)  │
-- │     instead of COUNT(*) on schedule_blocks, so it is not affected by RLS  │
-- │     when app.tenant_id is not set.                                        │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- Policy design:
--   current_setting('app.tenant_id', TRUE)
--     The two-argument form returns NULL (not an error) when the setting is
--     absent.  NULL = NULL evaluates to NULL (not TRUE) in Postgres, so a
--     connection that has not set app.tenant_id sees ZERO rows — the safe
--     failure mode.  This is intentional: unauthenticated requests that
--     bypass the dependency layer produce an empty result set rather than
--     an exception, which is still safe but means you must ensure all
--     authenticated paths set the variable via the get_connection dependency.
--
-- Applied in production: DO NOT modify — add a new migration instead.

-- ── clients ────────────────────────────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON clients;
CREATE POLICY tenant_isolation ON clients
    USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);

-- ── assignments ────────────────────────────────────────────────────────────

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON assignments;
CREATE POLICY tenant_isolation ON assignments
    USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);

-- ── schedule_blocks ────────────────────────────────────────────────────────

ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON schedule_blocks;
CREATE POLICY tenant_isolation ON schedule_blocks
    USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);

-- ── push_subscriptions ─────────────────────────────────────────────────────

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON push_subscriptions;
CREATE POLICY tenant_isolation ON push_subscriptions
    USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);

-- ── assignment_status_log ──────────────────────────────────────────────────

ALTER TABLE assignment_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_status_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON assignment_status_log;
CREATE POLICY tenant_isolation ON assignment_status_log
    USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);

-- ── schedule_block_logs ────────────────────────────────────────────────────

ALTER TABLE schedule_block_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_block_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON schedule_block_logs;
CREATE POLICY tenant_isolation ON schedule_block_logs
    USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);
