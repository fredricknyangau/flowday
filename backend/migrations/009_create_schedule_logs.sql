CREATE TABLE IF NOT EXISTS schedule_block_logs (
    date DATE NOT NULL,
    schedule_block_id UUID REFERENCES schedule_blocks(id) ON DELETE CASCADE,
    skipped BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, schedule_block_id)
);
