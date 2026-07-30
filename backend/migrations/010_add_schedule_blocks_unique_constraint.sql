-- Migration 010: add unique constraint on schedule_blocks(start_time, label)
--
-- Pre-condition: run scripts/dedupe_schedule.py first if there are existing
-- duplicates in the database (was the case before this constraint was added).
-- That script keeps the oldest row for each (start_time, label) pair.
--
-- Post-condition: INSERT of a duplicate (start_time, label) pair raises a
-- UniqueViolationError, which the global handler in main.py converts to a 409.
-- The DISTINCT ON workaround in schedule/queries.py::get_all_schedule_blocks
-- can now be removed.

ALTER TABLE schedule_blocks
    ADD CONSTRAINT uq_schedule_blocks_time_label
    UNIQUE (start_time, label);
