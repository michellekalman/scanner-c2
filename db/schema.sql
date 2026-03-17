-- 1. Create the scan_jobs table
CREATE TABLE IF NOT EXISTS scan_jobs (
    id SERIAL PRIMARY KEY,
    target TEXT,
    status TEXT DEFAULT 'pending',
    config JSONB DEFAULT '{}',
    duration INTERVAL,              -- Stores how long the scan took (e.g., '00:15:30')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Notification Function (The 'Shout')
CREATE OR REPLACE FUNCTION notify_new_scan_job()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_scan_channel', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Notification Trigger
DROP TRIGGER IF EXISTS trigger_new_scan_job ON scan_jobs;
CREATE TRIGGER trigger_new_scan_job
AFTER INSERT ON scan_jobs
FOR EACH ROW
EXECUTE FUNCTION notify_new_scan_job();

-- 4. Auto-update the 'updated_at' column on every change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scan_jobs_updated_at ON scan_jobs;
CREATE TRIGGER update_scan_jobs_updated_at
    BEFORE UPDATE ON scan_jobs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();