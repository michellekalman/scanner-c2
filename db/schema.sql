CREATE TABLE IF NOT EXISTS scan_jobs (
    id SERIAL PRIMARY KEY,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION notify_new_scan_job()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_scan_channel', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_scan_job ON scan_jobs;

CREATE TRIGGER trigger_new_scan_job
AFTER INSERT ON scan_jobs
FOR EACH ROW
EXECUTE FUNCTION notify_new_scan_job();