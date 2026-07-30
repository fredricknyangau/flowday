CREATE TABLE IF NOT EXISTS assignments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID          NOT NULL
                     REFERENCES clients(id) ON DELETE RESTRICT,
    assignment_type  VARCHAR(50)   NOT NULL
                     CHECK (assignment_type IN (
                         'Discussion post', 'Essay', 'Assignment',
                         'Module response', 'Knowledge quiz',
                         'Research paper', 'Exam', 'Simulation', 'Other'
                     )),
    course           VARCHAR(150),
    word_count       INTEGER       CHECK (word_count > 0),
    estimated_hours  NUMERIC(4,1)  CHECK (estimated_hours > 0),
    deadline         TIMESTAMPTZ   NOT NULL,
    status           VARCHAR(20)   NOT NULL DEFAULT 'Not started'
                     CHECK (status IN (
                         'Not started', 'In progress',
                         'Submitted', 'Overdue', 'Cancelled'
                     )),
    payment_kes      NUMERIC(10,2) CHECK (payment_kes >= 0),
    notes            TEXT,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    received_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    submitted_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
