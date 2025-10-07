DO $$
BEGIN
  ALTER TYPE public.incident_status ADD VALUE 'draft';
  ALTER TYPE public.incident_status ADD VALUE 'canceled';
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Ignore if value already exists
END
$$;