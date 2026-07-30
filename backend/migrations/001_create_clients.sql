CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS clients (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100)  NOT NULL,
    platform      VARCHAR(50)   NOT NULL DEFAULT 'WhatsApp',
    priority      VARCHAR(10)   NOT NULL DEFAULT 'Medium'
                  CHECK (priority IN ('High', 'Medium', 'Low')),
    notes         TEXT,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
