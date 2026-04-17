-- Normalize historical double-encoded jobs.input rows.
--
-- The jobs.input column is jsonb, but for ~28 rows from early Phase 1
-- the client sent a JSON-stringified payload (a string whose contents
-- parse to a JSON object) instead of an object. This meant
-- jsonb_typeof(input) = 'string' rather than 'object', and retry-lookup
-- code couldn't match capture_id without a defensive double-parse.
--
-- This migration unwraps each affected row once: (input #>> '{}') extracts
-- the jsonb string as text, which we then re-cast to jsonb. Only rows
-- with jsonb_typeof(input) = 'string' are touched, so it is idempotent —
-- re-running it selects the empty set.

UPDATE public.jobs
SET input = (input #>> '{}')::jsonb
WHERE jsonb_typeof(input) = 'string';

-- Rollback:
-- No automatic rollback — the original double-encoded values are lost
-- after this UPDATE. Restore from a pre-migration backup if needed.
