-- Update jobs type constraint to match actual job types
-- Old: ('embed', 'summarize', 'brief', 'signal')
-- New: ('ingestion', 'extraction', 'embed', 'summarize', 'brief', 'briefing', 'signal')

ALTER TABLE public.jobs DROP CONSTRAINT jobs_type_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_type_check
  CHECK (type IN ('ingestion', 'extraction', 'embed', 'summarize', 'brief', 'briefing', 'signal'));